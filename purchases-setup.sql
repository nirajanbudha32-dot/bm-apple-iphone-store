-- ============================================
-- BM iPhone Store - Purchases / Stock In
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no text NOT NULL DEFAULT '',
  date text NOT NULL,
  supplier text NOT NULL DEFAULT '',
  item_code text NOT NULL DEFAULT '',
  item_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  sub_category text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO anon;
GRANT ALL ON public.purchases TO service_role;

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read purchases" ON public.purchases;
CREATE POLICY "Anyone can read purchases" ON public.purchases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert purchases" ON public.purchases;
CREATE POLICY "Anyone can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete purchases" ON public.purchases;
CREATE POLICY "Anyone can delete purchases" ON public.purchases FOR DELETE USING (true);

-- Helper: add stock quantity by item code (creates nothing, only updates)
CREATE OR REPLACE FUNCTION public.increment_stock_by_code(p_code text, p_qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stock SET qty = qty + p_qty, updated_at = now() WHERE code = p_code;
$$;
