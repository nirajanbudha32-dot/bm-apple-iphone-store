-- ============================================
-- SALE IMEI TRACKING
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.sale_item_imeis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
  imei text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_item_imeis_sale ON public.sale_item_imeis(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_item_imeis_imei ON public.sale_item_imeis(imei);

ALTER TABLE public.sale_item_imeis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sale_item_imeis_authenticated" ON public.sale_item_imeis;
CREATE POLICY "sale_item_imeis_authenticated" ON public.sale_item_imeis
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.sale_item_imeis TO authenticated;
REVOKE ALL ON public.sale_item_imeis FROM anon;
