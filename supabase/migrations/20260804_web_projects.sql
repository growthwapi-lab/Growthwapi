-- GrowthWapi Supabase Schema Migration: Web Projects & Subscriptions

-- 1. Create subscriptions table if not exists
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create web_projects table if not exists
CREATE TABLE IF NOT EXISTS public.web_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    stage TEXT NOT NULL DEFAULT 'requirement' CHECK (stage IN ('requirement', 'design', 'development', 'review', 'live')),
    requested_domain TEXT,
    reference_sites TEXT,
    final_payment_status TEXT DEFAULT 'pending' CHECK (final_payment_status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ensure columns exist if web_projects was created previously
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='web_projects' AND column_name='final_payment_status') THEN
        ALTER TABLE public.web_projects ADD COLUMN final_payment_status TEXT DEFAULT 'pending' CHECK (final_payment_status IN ('pending', 'paid'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='web_projects' AND column_name='requested_domain') THEN
        ALTER TABLE public.web_projects ADD COLUMN requested_domain TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='web_projects' AND column_name='reference_sites') THEN
        ALTER TABLE public.web_projects ADD COLUMN reference_sites TEXT;
    END IF;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_projects ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to manage their own web projects
CREATE POLICY "Users can view their own web projects" ON public.web_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own web projects" ON public.web_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own web projects" ON public.web_projects
    FOR UPDATE USING (auth.uid() = user_id);
