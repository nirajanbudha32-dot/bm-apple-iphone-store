-- ============================================
-- DO NOT RUN - This file is SUPERSEDED.
-- Running this will break multi-store data isolation.
-- Use: multi-store-migration.sql + create-accounts.sql + security-harden.sql
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code text NOT NULL UNIQUE,
  vendor_name text NOT NULL,
  vendor_type text NOT NULL DEFAULT 'Local Supplier',
  pan text DEFAULT '',
  vat_number text DEFAULT '',
  vat_status text NOT NULL DEFAULT 'PAN Only',
  address text DEFAULT '',
  contact_person text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  payment_terms text DEFAULT '30 Days',
  credit_limit numeric DEFAULT 0,
  bank_name text DEFAULT '',
  bank_account_no text DEFAULT '',
  opening_balance numeric DEFAULT 0,
  opening_balance_date text DEFAULT '',
  status text NOT NULL DEFAULT 'Active',
  remarks text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_code ON public.vendors(vendor_code);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON public.vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_authenticated" ON public.vendors;
CREATE POLICY "vendors_authenticated" ON public.vendors
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.vendors TO authenticated;
REVOKE ALL ON public.vendors FROM anon;

-- Function: Generate next vendor code (VEN-0001, VEN-0002, ...)
CREATE OR REPLACE FUNCTION public.next_vendor_code()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'VEN-' || LPAD(
    (COALESCE(
      (SELECT MAX(CAST(SUBSTRING(vendor_code FROM 5) AS integer)) FROM public.vendors),
      0
    ) + 1)::text,
    4, '0'
  );
$$;

GRANT EXECUTE ON FUNCTION public.next_vendor_code() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.next_vendor_code() FROM anon;
