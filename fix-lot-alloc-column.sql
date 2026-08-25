-- ============================================
-- FIX: sale_lot_allocations column name + fifo_deduct
-- Run this in Supabase SQL Editor
-- ============================================

-- Fix the column name in sale_lot_allocations
DO $$
BEGIN
  -- If column is named 'qty', rename it to 'qty_taken'
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_lot_allocations' AND column_name = 'qty'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_lot_allocations' AND column_name = 'qty_taken'
  ) THEN
    ALTER TABLE public.sale_lot_allocations RENAME COLUMN qty TO qty_taken;
  END IF;

  -- If neither column exists, add qty_taken
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sale_lot_allocations' AND column_name = 'qty_taken'
  ) THEN
    ALTER TABLE public.sale_lot_allocations ADD COLUMN qty_taken integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Re-create fifo_deduct to ensure it's correct
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
