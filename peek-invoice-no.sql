-- ============================================
-- peek_invoice_no: Read next invoice number without advancing sequence
-- Uses pg_sequences (system catalog) instead of currval() which is session-dependent
-- Run in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.peek_invoice_no()
RETURNS text AS $$
  SELECT 'BM-AIS-' || LPAD(
    CASE WHEN is_called THEN (last_value + 1)::text ELSE '1' END,
    4, '0'
  )
  FROM pg_sequences
  WHERE schemaname = 'public' AND sequencename = 'invoice_no_seq';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.peek_invoice_no() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.peek_invoice_no() FROM anon;
