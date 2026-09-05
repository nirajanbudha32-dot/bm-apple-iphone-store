-- ============================================
-- P0 AUDIT SQL FIXES
-- Run in Supabase SQL Editor
-- ============================================

-- P0-4: Revoke increment_stock/decrement_stock from anon role
-- These bypass the lot system and can cause stock corruption
-- Code now uses adjust_stock_by_code instead
REVOKE EXECUTE ON FUNCTION public.increment_stock(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(text, integer) FROM anon;

-- NOTE: fifo_deduct is fixed in fix-fifo-deduct.sql (drop numeric overload, add store_id + stock verification)
-- Do NOT run fifo_deduct changes from this file - use fix-fifo-deduct.sql instead

SELECT 'P0 audit SQL fixes applied successfully' as result;
