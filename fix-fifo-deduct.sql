-- ============================================
-- FIX: fifo_deduct ambiguity + stock out lot numbers
-- Run in Supabase SQL Editor
-- ============================================

-- Step 1: Drop the numeric overload that causes ambiguity
DROP FUNCTION IF EXISTS public.fifo_deduct(text, numeric, uuid);

-- Step 2: Recreate the integer version with store_id + stock verification
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
  v_lot RECORD;
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
    INSERT INTO public.sale_lot_allocations (sale_id, lot_id, qty_taken, store_id)
    VALUES (p_sale_id, v_lot.id, v_take, public.user_store_id());
    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'Insufficient lot stock for "%": requested %, available %',
      p_item_name, p_qty, p_qty - v_remaining;
  END IF;
END;
$$;

-- Step 3: Backfill old allocations with NULL store_id
UPDATE public.sale_lot_allocations
SET store_id = (
  SELECT s.store_id FROM public.sales s WHERE s.id = sale_lot_allocations.sale_id
)
WHERE store_id IS NULL;

SELECT 'fifo_deduct fixed: single overload (integer), store_id included, old allocations backfilled' as result;
