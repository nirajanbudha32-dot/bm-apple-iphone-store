-- ============================================
-- peek_invoice_no: Read next invoice number without advancing sequence
-- Reads actual max from sales table (works in all Supabase PostgreSQL versions)
-- Run in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION public.peek_invoice_no()
RETURNS text AS $$
  SELECT 'BM-AIS-' || LPAD(
    (COALESCE(
      (SELECT MAX(CAST(SUBSTRING(invoice_no FROM 9) AS int)) FROM sales),
      0
    ) + 1)::text, 4, '0'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.peek_invoice_no() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.peek_invoice_no() FROM anon;
