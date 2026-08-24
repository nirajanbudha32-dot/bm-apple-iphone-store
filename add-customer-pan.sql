-- Add Customer PAN and VAT/PAN status columns
-- Run this in Supabase SQL Editor

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_pan text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS has_vat_pan boolean NOT NULL DEFAULT false;
