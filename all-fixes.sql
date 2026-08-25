-- ============================================
-- BM iPhone Store - ALL FIXES SQL
-- Run this SINGLE file in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. STOCK TABLE: RLS policies (INSERT + UPDATE)
-- ============================================
DROP POLICY IF EXISTS "Anyone can insert stock" ON public.stock;
CREATE POLICY "Anyone can insert stock"
  ON public.stock FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update stock" ON public.stock;
CREATE POLICY "Anyone can update stock"
  ON public.stock FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. PURCHASES TABLE
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

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read purchases" ON public.purchases;
CREATE POLICY "Anyone can read purchases" ON public.purchases FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert purchases" ON public.purchases;
CREATE POLICY "Anyone can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update purchases" ON public.purchases;
CREATE POLICY "Anyone can update purchases" ON public.purchases FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete purchases" ON public.purchases;
CREATE POLICY "Anyone can delete purchases" ON public.purchases FOR DELETE USING (true);

-- ============================================
-- 3. increment_stock_by_code RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_stock_by_code(p_code text, p_qty integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stock SET qty = qty + p_qty, updated_at = now() WHERE code = p_code;
$$;

-- ============================================
-- 4. STOCK LOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stock_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_no text NOT NULL UNIQUE,
  purchase_id uuid REFERENCES public.purchases(id),
  item_code text NOT NULL DEFAULT '',
  item_name text NOT NULL,
  date text NOT NULL,
  supplier text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_lots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_lots TO anon;

ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can read stock_lots" ON public.stock_lots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can insert stock_lots" ON public.stock_lots FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can update stock_lots" ON public.stock_lots FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can delete stock_lots" ON public.stock_lots FOR DELETE USING (true);

-- ============================================
-- 5. SALE LOT ALLOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sale_lot_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id),
  lot_id uuid REFERENCES public.stock_lots(id),
  qty integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_lot_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_lot_allocations TO anon;

ALTER TABLE public.sale_lot_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read sale_lot_allocations" ON public.sale_lot_allocations;
CREATE POLICY "Anyone can read sale_lot_allocations" ON public.sale_lot_allocations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert sale_lot_allocations" ON public.sale_lot_allocations;
CREATE POLICY "Anyone can insert sale_lot_allocations" ON public.sale_lot_allocations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete sale_lot_allocations" ON public.sale_lot_allocations;
CREATE POLICY "Anyone can delete sale_lot_allocations" ON public.sale_lot_allocations FOR DELETE USING (true);

-- ============================================
-- 6. next_lot_no RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.next_lot_no()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'LOT-' || LPAD(
    (
      COALESCE(
        (SELECT MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)) FROM public.stock_lots),
        0
      ) + 1
    )::text,
    4, '0'
  );
$$;

-- ============================================
-- 7. fifo_deduct RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.fifo_deduct(
  p_item_code text,
  p_qty integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining integer := p_qty;
  lot_rec record;
  deduct integer;
BEGIN
  FOR lot_rec IN
    SELECT id, qty FROM public.stock_lots
    WHERE item_code = p_item_code AND qty > 0
    ORDER BY created_at ASC
  LOOP
    IF remaining <= 0 THEN EXIT; END IF;
    deduct := LEAST(lot_rec.qty, remaining);
    UPDATE public.stock_lots SET qty = qty - deduct WHERE id = lot_rec.id;
    remaining := remaining - deduct;
  END LOOP;
  RETURN p_qty - remaining;
END;
$$;

-- ============================================
-- 8. SALES TABLE: add missing columns if needed
-- ============================================
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sub_category text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS item_code text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_pan text NOT NULL DEFAULT '';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS has_vat_pan boolean NOT NULL DEFAULT false;

-- ============================================
-- 9. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_bill_no ON public.purchases(bill_no);
CREATE INDEX IF NOT EXISTS idx_purchases_item_code ON public.purchases(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_lots_item_code ON public.stock_lots(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_lots_lot_no ON public.stock_lots(lot_no);
CREATE INDEX IF NOT EXISTS idx_sale_allocations_sale_id ON public.sale_lot_allocations(sale_id);
