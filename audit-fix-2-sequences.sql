-- ============================================
-- AUDIT FIX 2: PostgreSQL Sequences
-- Replaces all MAX()+1 RPC functions with atomic sequences
-- Run in Supabase SQL Editor AFTER audit-fix-1
-- ============================================

-- ============================================
-- PART A: Create Sequences
-- ============================================

CREATE SEQUENCE IF NOT EXISTS public.invoice_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.purchase_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.lot_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.stock_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.vendor_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.vendor_payment_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.purchase_return_no_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.return_no_seq START 1;

-- ============================================
-- PART B: Re-create RPC functions using sequences
-- ============================================

-- next_invoice_no: BM-AIS-0001, BM-AIS-0002, ...
CREATE OR REPLACE FUNCTION public.next_invoice_no()
RETURNS text AS $$
  SELECT 'BM-AIS-' || LPAD(nextval('public.invoice_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_purchase_no: PUR-0001, PUR-0002, ...
CREATE OR REPLACE FUNCTION public.next_purchase_no()
RETURNS text AS $$
  SELECT 'PUR-' || LPAD(nextval('public.purchase_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_lot_no: LOT-0001, LOT-0002, ...
CREATE OR REPLACE FUNCTION public.next_lot_no()
RETURNS text AS $$
  SELECT 'LOT-' || LPAD(nextval('public.lot_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_stock_code: 000001, 000002, ...
CREATE OR REPLACE FUNCTION public.next_stock_code()
RETURNS text AS $$
  SELECT LPAD(nextval('public.stock_code_seq')::text, 6, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_vendor_code: VEN-0001, VEN-0002, ...
CREATE OR REPLACE FUNCTION public.next_vendor_code()
RETURNS text AS $$
  SELECT 'VEN-' || LPAD(nextval('public.vendor_code_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_vendor_payment_no: VP-0001, VP-0002, ...
CREATE OR REPLACE FUNCTION public.next_vendor_payment_no()
RETURNS text AS $$
  SELECT 'VP-' || LPAD(nextval('public.vendor_payment_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_purchase_return_no: PR-0001, PR-0002, ...
CREATE OR REPLACE FUNCTION public.next_purchase_return_no()
RETURNS text AS $$
  SELECT 'PR-' || LPAD(nextval('public.purchase_return_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_return_no: RET-0001, RET-0002, ...
CREATE OR REPLACE FUNCTION public.next_return_no()
RETURNS text AS $$
  SELECT 'RET-' || LPAD(nextval('public.return_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- next_transfer_no: TRF-0001, TRF-0002, ...
CREATE OR REPLACE FUNCTION public.next_transfer_no()
RETURNS text AS $$
  SELECT 'TRF-' || LPAD(nextval('public.transfer_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================
-- PART C: Ensure proper GRANT/REVOKE
-- ============================================

GRANT EXECUTE ON FUNCTION public.next_invoice_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_purchase_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_lot_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_stock_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_vendor_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_vendor_payment_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_purchase_return_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_return_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_transfer_no() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.next_invoice_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_purchase_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_lot_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_stock_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_vendor_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_vendor_payment_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_purchase_return_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_return_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_transfer_no() FROM anon;

-- ============================================
-- AUDIT FIX 2 COMPLETE
-- ============================================
