-- ============================================================
-- SALES MODULE UPGRADE: Discount, Other Charges, Paid/Remaining
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add new columns to sales table
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS discount        numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_charges   numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount     numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remaining       numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remarks         text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sale_type       text NOT NULL DEFAULT 'Cash';
