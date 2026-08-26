-- ============================================
-- PURCHASE RETURNS (to Vendors)
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.purchase_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_no text NOT NULL UNIQUE,
  original_purchase_no text NOT NULL,
  purchase_header_id uuid REFERENCES public.purchase_headers(id),
  vendor_id uuid REFERENCES public.vendors(id),
  item_code text NOT NULL,
  item_name text NOT NULL,
  lot_id uuid REFERENCES public.stock_lots(id),
  imei text,
  qty integer NOT NULL CHECK (qty > 0),
  return_date text NOT NULL,
  reason text NOT NULL DEFAULT '',
  refund_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'COMPLETED',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pr_vendor ON public.purchase_returns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pr_date ON public.purchase_returns(return_date);
CREATE INDEX IF NOT EXISTS idx_pr_purchase ON public.purchase_returns(purchase_header_id);

ALTER TABLE public.purchase_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pr_authenticated" ON public.purchase_returns;
CREATE POLICY "pr_authenticated" ON public.purchase_returns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.purchase_returns TO authenticated;
REVOKE ALL ON public.purchase_returns FROM anon;

-- Function: Generate next purchase return number (PR-0001, PR-0002, ...)
CREATE OR REPLACE FUNCTION public.next_purchase_return_no()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'PR-' || LPAD(
    (COALESCE(
      (SELECT MAX(CAST(SUBSTRING(return_no FROM 4) AS integer)) FROM public.purchase_returns),
      0
    ) + 1)::text,
    4, '0'
  );
$$;

GRANT EXECUTE ON FUNCTION public.next_purchase_return_no() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.next_purchase_return_no() FROM anon;
