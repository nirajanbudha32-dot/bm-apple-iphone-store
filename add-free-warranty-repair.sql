-- ============================================
-- ADD FREE ITEMS, WARRANTY, REPAIR TO SALES
-- Run in Supabase SQL Editor
-- ============================================

-- Add is_free column (per-item flag for free items on mixed bills)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;

-- Add warranty_original_invoice column (track original purchase for warranty claims)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS warranty_original_invoice text DEFAULT '';

SELECT 'Sales table updated: is_free + warranty_original_invoice columns added' as result;
