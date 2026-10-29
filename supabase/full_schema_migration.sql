-- ============================================================
-- Complete Supabase Schema Migration for Growthwapi
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- This script is safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure columns exist on public.users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_waba_id TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_display_phone TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;

-- 2. TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en_US',
  header_type TEXT DEFAULT 'none',
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]'::jsonb,
  meta_template_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'templates' AND policyname = 'Users can manage own templates') THEN
    CREATE POLICY "Users can manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 3. API KEYS TABLE (Developer Hub)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL UNIQUE,
  masked_key TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{"send_message","broadcast","read"}',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Users can manage own api_keys') THEN
    CREATE POLICY "Users can manage own api_keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. EXTERNAL WEBHOOKS TABLE (Developer Hub Outbound Webhooks)
CREATE TABLE IF NOT EXISTS public.external_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] DEFAULT '{"message.received","message.sent"}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.external_webhooks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'external_webhooks' AND policyname = 'Users can manage own webhooks') THEN
    CREATE POLICY "Users can manage own webhooks" ON public.external_webhooks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. AI AGENTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  business_type TEXT DEFAULT 'Other',
  custom_instructions TEXT,
  status TEXT DEFAULT 'crawling',
  pages_crawled INTEGER DEFAULT 0,
  ai_replies_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Users can manage own ai_agents') THEN
    CREATE POLICY "Users can manage own ai_agents" ON public.ai_agents FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6. KNOWLEDGE CHUNKS TABLE
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  url TEXT,
  chunk_index INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'knowledge_chunks' AND policyname = 'Users can manage own knowledge_chunks') THEN
    CREATE POLICY "Users can manage own knowledge_chunks" ON public.knowledge_chunks FOR ALL USING (
      EXISTS (SELECT 1 FROM public.ai_agents WHERE id = knowledge_chunks.agent_id AND user_id = auth.uid())
    );
  END IF;
END $$;

-- 7. AI USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  cost_usd NUMERIC(10, 6) DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 8. GRANT ALL PERMISSIONS TO authenticated and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_external_webhooks_user_id ON public.external_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON public.ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_agent_id ON public.knowledge_chunks(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_agent_id ON public.ai_usage_logs(agent_id);
