-- GrowthWapi Supabase Schema Migration: WhatsApp Accounts

-- Create whatsapp_accounts table if not exists
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_display_name TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'requirement' CHECK (stage IN ('requirement', 'meta_verification', 'api_setup', 'testing', 'live')),
    requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'setup_pending' CHECK (status IN ('setup_pending', 'active', 'live')),
    utility_msgs_included INTEGER NOT NULL,
    marketing_msgs_included INTEGER NOT NULL,
    utility_msgs_used INTEGER NOT NULL DEFAULT 0,
    marketing_msgs_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for WhatsApp accounts
CREATE POLICY "Users can view their own whatsapp accounts" ON public.whatsapp_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own whatsapp accounts" ON public.whatsapp_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp accounts" ON public.whatsapp_accounts
    FOR UPDATE USING (auth.uid() = user_id);
