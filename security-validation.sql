-- ============================================
-- SECURITY: Data Validation Constraints
-- Run in Supabase SQL Editor AFTER security-harden.sql
-- ============================================

-- Stock quantities must be non-negative
ALTER TABLE public.stock
  DROP CONSTRAINT IF EXISTS stock_qty_non_negative;
ALTER TABLE public.stock
  ADD CONSTRAINT stock_qty_non_negative CHECK (qty >= 0);

-- Stock prices must be non-negative
ALTER TABLE public.stock
  DROP CONSTRAINT IF EXISTS stock_price_non_negative;
ALTER TABLE public.stock
  ADD CONSTRAINT stock_price_non_negative CHECK (purchase_price >= 0 AND selling_price >= 0);

-- Lot quantities must be non-negative
ALTER TABLE public.stock_lots
  DROP CONSTRAINT IF EXISTS lot_qty_non_negative;
ALTER TABLE public.stock_lots
  ADD CONSTRAINT lot_qty_non_negative CHECK (qty >= 0);

-- Lot prices must be non-negative
ALTER TABLE public.stock_lots
  DROP CONSTRAINT IF EXISTS lot_price_non_negative;
ALTER TABLE public.stock_lots
  ADD CONSTRAINT lot_price_non_negative CHECK (purchase_price >= 0);

-- Sale line items must have positive qty
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sale_qty_positive;
ALTER TABLE public.sales
  ADD CONSTRAINT sale_qty_positive CHECK (qty > 0);

-- Sale amounts must be non-negative
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sale_amounts_non_negative;
ALTER TABLE public.sales
  ADD CONSTRAINT sale_amounts_non_negative CHECK (rate >= 0 AND amount >= 0 AND vat >= 0 AND total >= 0);

-- Purchase items must have non-negative values
ALTER TABLE public.purchase_items
  DROP CONSTRAINT IF EXISTS pi_qty_non_negative;
ALTER TABLE public.purchase_items
  ADD CONSTRAINT pi_qty_non_negative CHECK (qty >= 0);

ALTER TABLE public.purchase_items
  DROP CONSTRAINT IF EXISTS pi_amounts_non_negative;
ALTER TABLE public.purchase_items
  ADD CONSTRAINT pi_amounts_non_negative CHECK (rate >= 0 AND amount >= 0 AND total >= 0);

-- Purchase attachment file size limit: 5MB
ALTER TABLE public.purchase_attachments
  DROP CONSTRAINT IF EXISTS attach_size_limit;
ALTER TABLE public.purchase_attachments
  ADD CONSTRAINT attach_size_limit CHECK (file_size <= 5242880);

-- Sale allocations must have positive qty_taken
ALTER TABLE public.sale_lot_allocations
  DROP CONSTRAINT IF EXISTS alloc_qty_positive;
ALTER TABLE public.sale_lot_allocations
  ADD CONSTRAINT alloc_qty_positive CHECK (qty_taken > 0);
