-- ============================================
-- SALES RETURNS
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.sales_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_no text NOT NULL UNIQUE,
  original_invoice_no text NOT NULL,
  sale_id uuid REFERENCES public.sales(id),
  sale_item_name text NOT NULL,
  sale_item_code text NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_sales_returns_invoice ON public.sales_returns(original_invoice_no);
CREATE INDEX IF NOT EXISTS idx_sales_returns_date ON public.sales_returns(return_date);

ALTER TABLE public.sales_returns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_returns_authenticated" ON public.sales_returns;
CREATE POLICY "sales_returns_authenticated" ON public.sales_returns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.sales_returns TO authenticated;
REVOKE ALL ON public.sales_returns FROM anon;

-- Function: Generate next return number (RET-0001, RET-0002, ...)
CREATE OR REPLACE FUNCTION public.next_return_no()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'RET-' || LPAD(
    (COALESCE(
      (SELECT MAX(CAST(SUBSTRING(return_no FROM 5) AS integer)) FROM public.sales_returns),
      0
    ) + 1)::text,
    4, '0'
  );
$$;

GRANT EXECUTE ON FUNCTION public.next_return_no() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.next_return_no() FROM anon;
