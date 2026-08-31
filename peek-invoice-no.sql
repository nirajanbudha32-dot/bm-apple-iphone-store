-- ============================================
-- peek_invoice_no: Read current invoice number without advancing sequence
-- Run in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.peek_invoice_no()
RETURNS text AS $$
  SELECT 'BM-AIS-' || LPAD(
    (COALESCE(currval('public.invoice_no_seq'), 0) + 1)::text, 4, '0'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.peek_invoice_no() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.peek_invoice_no() FROM anon;
