-- ============================================================
-- Migration: Add missing WhatsApp columns to users table
-- Run this in your Supabase SQL Editor if columns don't exist
-- ============================================================

-- Add whatsapp_display_phone column (safe: only adds if missing)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_display_phone TEXT;

-- Add whatsapp_access_token column for per-user tokens
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;

-- Ensure whatsapp_phone_number_id & waba_id exist (from original schema)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS whatsapp_waba_id TEXT;
