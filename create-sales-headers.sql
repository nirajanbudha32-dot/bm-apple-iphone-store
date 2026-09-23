-- ============================================================
-- Phase 1: Create sales_headers table + back-fill
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS sales_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  customer TEXT NOT NULL DEFAULT '',
  customer_pan TEXT DEFAULT '',
  has_vat_pan BOOLEAN DEFAULT FALSE,
  customer_type TEXT DEFAULT 'Individual',
  customer_contact TEXT DEFAULT '',
  customer_location TEXT DEFAULT '',
  sale_type TEXT DEFAULT 'Cash',
  payment_method TEXT DEFAULT 'Cash',
  gross_total NUMERIC DEFAULT 0,
  header_discount NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining NUMERIC DEFAULT 0,
  remarks TEXT DEFAULT '',
  status TEXT DEFAULT 'CONFIRMED',
  warranty_original_invoice TEXT DEFAULT '',
  created_by UUID,
  store_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE sales_headers ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy — allow all for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sales_headers' AND policyname = 'sales_headers_all'
  ) THEN
    CREATE POLICY "sales_headers_all" ON sales_headers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 4. Back-fill from existing sales data
--    Takes the first row per invoice_no as the header source
--    Computes gross_total = SUM(total) across all items in that invoice
INSERT INTO sales_headers (
  invoice_no, date, customer, customer_pan, has_vat_pan,
  customer_type, customer_contact, customer_location,
  sale_type, payment_method,
  gross_total, header_discount, other_charges, grand_total,
  paid_amount, remaining, remarks, status,
  warranty_original_invoice, store_id, created_at
)
SELECT DISTINCT ON (s.invoice_no)
  s.invoice_no,
  s.date,
  s.customer,
  s.customer_pan,
  s.has_vat_pan,
  COALESCE(s.customer_type, 'Individual'),
  COALESCE(s.customer_contact, ''),
  COALESCE(s.customer_location, ''),
  COALESCE(s.sale_type, 'Cash'),
  s.payment_method,
  inv.gross_total,
  0,  -- header_discount not tracked in old data
  COALESCE(s.other_charges, 0),
  inv.gross_total + COALESCE(s.other_charges, 0),
  COALESCE(s.paid_amount, 0),
  COALESCE(s.remaining, 0),
  COALESCE(s.remarks, ''),
  COALESCE(s.status, 'CONFIRMED'),
  COALESCE(s.warranty_original_invoice, ''),
  s.store_id,
  s.created_at
FROM sales s
JOIN (
  SELECT invoice_no, SUM(total) AS gross_total
  FROM sales
  GROUP BY invoice_no
) inv ON inv.invoice_no = s.invoice_no
ORDER BY s.invoice_no, s.created_at ASC
ON CONFLICT (invoice_no) DO NOTHING;
