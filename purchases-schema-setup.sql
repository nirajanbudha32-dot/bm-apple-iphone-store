-- ============================================
-- BM iPhone Store - Purchases + Stock In Setup
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- 1. CREATE PURCHASES TABLE
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

-- 2. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO anon;
GRANT ALL ON public.purchases TO service_role;

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can read purchases" ON public.purchases;
CREATE POLICY "Anyone can read purchases" ON public.purchases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert purchases" ON public.purchases;
CREATE POLICY "Anyone can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete purchases" ON public.purchases;
CREATE POLICY "Anyone can delete purchases" ON public.purchases FOR DELETE USING (true);

-- 5. HELPER FUNCTION: increment stock by item code
CREATE OR REPLACE FUNCTION public.increment_stock_by_code(p_code text, p_qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stock SET qty = qty + p_qty, updated_at = now() WHERE code = p_code;
$$;

-- 6. INDEX for faster purchase queries
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_bill_no ON public.purchases(bill_no);
CREATE INDEX IF NOT EXISTS idx_purchases_item_code ON public.purchases(item_code);
CREATE INDEX IF NOT EXISTS idx_purchases_created_by ON public.purchases(created_by);

-- 7. Also add sub_category and item_code columns to sales if missing
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sub_category text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS item_code text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_pan text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS has_vat_pan boolean NOT NULL DEFAULT false;
