-- Fix missing columns for stock transfers
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/moavwfubvalkxgfcntmy/sql/new

-- 1. purchase_item_imeis: add columns used by createTransfer() and deleteTransfer()
ALTER TABLE public.purchase_item_imeis
  ADD COLUMN IF NOT EXISTS item_code text,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS lot_id uuid,
  ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false;

-- 2. stock_transfer_items: add destination item columns
ALTER TABLE public.stock_transfer_items
  ADD COLUMN IF NOT EXISTS dest_item_code text,
  ADD COLUMN IF NOT EXISTS dest_item_name text;
