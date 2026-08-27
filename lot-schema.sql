-- ============================================
-- DO NOT RUN - This file is SUPERSEDED.
-- Running this will break multi-store data isolation.
-- Use: multi-store-migration.sql + create-accounts.sql + security-harden.sql
-- ============================================

-- TABLE 1: STOCK LOTS (one row per purchase batch)
CREATE TABLE IF NOT EXISTS public.stock_lots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_no text NOT NULL,
  purchase_id uuid,
  item_code text NOT NULL DEFAULT '',
  item_name text NOT NULL,
  date text NOT NULL,
  supplier text NOT NULL DEFAULT '',
  qty integer NOT NULL DEFAULT 0,
  purchase_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stock_lots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can read stock_lots" ON public.stock_lots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can insert stock_lots" ON public.stock_lots FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can update stock_lots" ON public.stock_lots FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete stock_lots" ON public.stock_lots;
CREATE POLICY "Anyone can delete stock_lots" ON public.stock_lots FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_lots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_lots TO anon;
GRANT ALL ON public.stock_lots TO service_role;

CREATE INDEX IF NOT EXISTS idx_stock_lots_item_code ON public.stock_lots(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_lots_item_name ON public.stock_lots(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_lots_lot_no ON public.stock_lots(lot_no);

-- TABLE 2: SALE LOT ALLOCATIONS (which lot each sale came from)
CREATE TABLE IF NOT EXISTS public.sale_lot_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  lot_id uuid NOT NULL REFERENCES public.stock_lots(id) ON DELETE CASCADE,
  qty_taken integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sale_lot_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read sale_lot_allocations" ON public.sale_lot_allocations;
CREATE POLICY "Anyone can read sale_lot_allocations" ON public.sale_lot_allocations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert sale_lot_allocations" ON public.sale_lot_allocations;
CREATE POLICY "Anyone can insert sale_lot_allocations" ON public.sale_lot_allocations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete sale_lot_allocations" ON public.sale_lot_allocations;
CREATE POLICY "Anyone can delete sale_lot_allocations" ON public.sale_lot_allocations FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_lot_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_lot_allocations TO anon;
GRANT ALL ON public.sale_lot_allocations TO service_role;

CREATE INDEX IF NOT EXISTS idx_sale_alloc_sale_id ON public.sale_lot_allocations(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_alloc_lot_id ON public.sale_lot_allocations(lot_id);

-- FUNCTION 1: Get next lot number
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

-- FUNCTION 2: FIFO deduct from oldest lots
CREATE OR REPLACE FUNCTION public.fifo_deduct(
  p_item_name text,
  p_qty integer,
  p_sale_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining integer := p_qty;
  v_lot record;
  v_take integer;
BEGIN
  FOR v_lot IN
    SELECT id, qty
    FROM public.stock_lots
    WHERE item_name = p_item_name AND qty > 0
    ORDER BY date ASC, created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;
    v_take := LEAST(v_lot.qty, v_remaining);
    UPDATE public.stock_lots SET qty = qty - v_take WHERE id = v_lot.id;
    INSERT INTO public.sale_lot_allocations (sale_id, lot_id, qty_taken)
    VALUES (p_sale_id, v_lot.id, v_take);
    v_remaining := v_remaining - v_take;
  END LOOP;
END;
$$;
