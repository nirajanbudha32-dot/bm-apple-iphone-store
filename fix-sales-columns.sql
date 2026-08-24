-- Add missing columns to sales table
-- Run this in Supabase SQL Editor

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS item_code text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sub_category text NOT NULL DEFAULT '';
