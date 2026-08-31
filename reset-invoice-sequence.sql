-- ============================================
-- reset-invoice-sequence.sql
-- Syncs invoice_no_seq to actual max invoice number in sales table
-- Run AFTER peek-invoice-no.sql in Supabase SQL Editor
-- One-time fix for sequence drift caused by page-load nextval() calls
-- ============================================

DO $$
DECLARE
  max_num int;
BEGIN
  -- Find the highest invoice number currently in the sales table
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_no FROM 9) AS int)), 0)
    INTO max_num FROM sales;

  -- Set the sequence to that value so nextval() returns max_num + 1
  PERFORM setval('public.invoice_no_seq', max_num, true);

  RAISE NOTICE 'invoice_no_seq reset to % — next sale will be BM-AIS-%',
    max_num, LPAD((max_num + 1)::text, 4, '0');
END $$;
