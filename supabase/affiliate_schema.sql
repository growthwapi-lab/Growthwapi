-- ============================================================
-- Growthwapi Tiered Affiliate / Referral System Schema
-- Run this in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AFFILIATE PROFILES (Stores affiliate partner code, wallet, payment details)
CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  upi_id TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_account_name TEXT,
  total_earnings NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  pending_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  paid_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid_member BOOLEAN NOT NULL DEFAULT FALSE,
  payment_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent column additions for existing tables
ALTER TABLE public.affiliate_profiles ADD COLUMN IF NOT EXISTS is_paid_member BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.affiliate_profiles ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE public.affiliate_profiles ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2. AFFILIATE REFERRALS (Tracks which client signed up under which affiliate)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT NOT NULL,
  total_months_paid INTEGER NOT NULL DEFAULT 0,
  current_plan TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'churned'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AFFILIATE COMMISSIONS (Detailed transaction ledger of every earning per payment)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID,
  plan_type TEXT NOT NULL,           -- 'starter', 'growth', 'pro'
  month_number INTEGER NOT NULL,      -- 1, 2, 3, 4, 5
  commission_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved', -- 'approved', 'paid', 'reversed'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AFFILIATE PAYOUTS (Withdrawal requests from partners)
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payout_method TEXT NOT NULL DEFAULT 'upi', -- 'upi' or 'bank'
  payout_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
  transaction_ref TEXT,
  admin_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Add index for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON public.affiliate_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON public.affiliate_referrals(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_client ON public.affiliate_referrals(referred_client_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON public.affiliate_commissions(affiliate_user_id);
