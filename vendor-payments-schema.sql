-- ============================================
-- VENDOR PAYMENTS
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no text NOT NULL UNIQUE,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE RESTRICT,
  payment_date text NOT NULL,
  payment_method text NOT NULL DEFAULT 'Cash',
  amount numeric NOT NULL DEFAULT 0,
  bank_name text DEFAULT '',
  reference_no text DEFAULT '',
  remarks text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendor_payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES public.vendor_payments(id) ON DELETE CASCADE,
  purchase_header_id uuid REFERENCES public.purchase_headers(id) ON DELETE RESTRICT,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vp_vendor ON public.vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vp_date ON public.vendor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_vpa_payment ON public.vendor_payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_vpa_purchase ON public.vendor_payment_allocations(purchase_header_id);

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payment_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vp_authenticated" ON public.vendor_payments;
CREATE POLICY "vp_authenticated" ON public.vendor_payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vpa_authenticated" ON public.vendor_payment_allocations;
CREATE POLICY "vpa_authenticated" ON public.vendor_payment_allocations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.vendor_payments TO authenticated;
GRANT ALL ON public.vendor_payment_allocations TO authenticated;
REVOKE ALL ON public.vendor_payments FROM anon;
REVOKE ALL ON public.vendor_payment_allocations FROM anon;

-- Function: Generate next payment number (VP-0001, VP-0002, ...)
CREATE OR REPLACE FUNCTION public.next_vendor_payment_no()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'VP-' || LPAD(
    (COALESCE(
      (SELECT MAX(CAST(SUBSTRING(payment_no FROM 4) AS integer)) FROM public.vendor_payments),
      0
    ) + 1)::text,
    4, '0'
  );
$$;

GRANT EXECUTE ON FUNCTION public.next_vendor_payment_no() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.next_vendor_payment_no() FROM anon;
