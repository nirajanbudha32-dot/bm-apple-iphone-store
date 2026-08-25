-- Fix: Drop broken FK constraint on stock_lots.purchase_id
-- This was referencing the old purchases table, but new code passes purchase_items IDs
ALTER TABLE public.stock_lots
  DROP CONSTRAINT IF EXISTS stock_lots_purchase_id_fkey;
