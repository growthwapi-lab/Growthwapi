-- ==============================================================
-- GROWTHWAPI: TEAM MEMBERS & MULTI-AGENT INBOX SCHEMA
-- ==============================================================
-- Run this in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  member_user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent', -- 'agent', 'sales', 'support'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ultra-fast queries by owner workspace
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);

-- Disable RLS or allow service role full access
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
