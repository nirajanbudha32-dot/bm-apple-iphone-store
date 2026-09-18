-- SECURITY DEFINER RPCs for stock transfers
-- Allows salesmen to create lots in OTHER stores (bypasses RLS)
-- Run in Supabase SQL Editor

-- 1. Create a destination lot for any store (bypasses RLS)
CREATE OR REPLACE FUNCTION public.create_transfer_dest_lot(
  p_lot_no text,
  p_item_code text,
  p_item_name text,
  p_qty integer,
  p_purchase_price numeric,
  p_store_id uuid
) RETURNS uuid AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id)
  VALUES (p_lot_no, NULL, p_item_code, p_item_name, CURRENT_DATE, 'Transfer', p_qty, p_purchase_price, p_store_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_transfer_dest_lot(text, text, text, integer, numeric, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.create_transfer_dest_lot(text, text, text, integer, numeric, uuid) FROM anon;

-- 2. Reconcile stock table for any store (bypasses RLS)
CREATE OR REPLACE FUNCTION public.reconcile_store_stock(p_store_id uuid)
RETURNS void AS $$
BEGIN
  -- Update existing stock rows from lot totals
  UPDATE public.stock SET qty = COALESCE(sub.q, 0)
  FROM (
    SELECT item_name, SUM(qty) AS q
    FROM public.stock_lots
    WHERE store_id = p_store_id
    GROUP BY item_name
  ) sub
  WHERE stock.name = sub.item_name AND stock.store_id = p_store_id;

  -- Insert new stock rows for items not yet in stock table
  INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
  SELECT public.next_stock_code(), sub.item_name, 'General', '', '', '', '', 'PCS', sub.q, 0, 0, p_store_id
  FROM (
    SELECT item_name, SUM(qty) AS q
    FROM public.stock_lots
    WHERE store_id = p_store_id
    GROUP BY item_name
  ) sub
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock WHERE name = sub.item_name AND store_id = p_store_id
  ) AND sub.q > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.reconcile_store_stock(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_store_stock(uuid) FROM anon;

SELECT 'Transfer RPCs created: create_transfer_dest_lot, reconcile_store_stock' AS result;
