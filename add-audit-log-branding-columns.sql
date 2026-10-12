-- Add app_version and app_owner columns to audit_log table
-- Run this in Supabase SQL Editor before deploying the app update

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS app_version TEXT DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS app_owner   TEXT DEFAULT 'BM Electronic';
