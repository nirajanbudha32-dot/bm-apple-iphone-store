-- =============================================================
-- COMPREHENSIVE FIX: Stock Transfers & Cross-Store Code Mapping
-- Resolves: "new row violates row-level security policy for table stock_lots"
-- Resolves: Salesman cannot see or map different stock codes for other stores
--
-- Instructions: Copy and RUN this entire script in Supabase SQL Editor.
-- =============================================================

-- -------------------------------------------------------------
-- 1. FIX RLS ON stock_lots
-- Needs to allow cross-store lot creation, increment, and lookup
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "stock_lots_select" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_insert" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_update" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_delete" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can read stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can insert stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can update stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can delete stock_lots" ON public.stock_lots;

CREATE POLICY "stock_lots_select" ON public.stock_lots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "stock_lots_insert" ON public.stock_lots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "stock_lots_update" ON public.stock_lots
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "stock_lots_delete" ON public.stock_lots
  FOR DELETE TO authenticated
  USING (store_id = public.user_store_id() OR public.user_store_id() IS NULL OR public.is_admin());

-- -------------------------------------------------------------
-- 2. FIX RLS ON stock (allow reading all stores so Item (Dest) dropdown works)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "stock_select" ON public.stock;
DROP POLICY IF EXISTS "stock_insert" ON public.stock;
DROP POLICY IF EXISTS "stock_update" ON public.stock;

CREATE POLICY "stock_select" ON public.stock
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "stock_insert" ON public.stock
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "stock_update" ON public.stock
  FOR UPDATE TO authenticated USING (true);

-- -------------------------------------------------------------
-- 3. FIX RLS ON purchase_item_imeis (allow transferring IMEIs across stores)
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "imei_select" ON public.purchase_item_imeis;
DROP POLICY IF EXISTS "imei_insert" ON public.purchase_item_imeis;
DROP POLICY IF EXISTS "imei_delete" ON public.purchase_item_imeis;
DROP POLICY IF EXISTS "purchase_item_imeis_all" ON public.purchase_item_imeis;

CREATE POLICY "imei_select" ON public.purchase_item_imeis
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "imei_insert" ON public.purchase_item_imeis
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "imei_delete" ON public.purchase_item_imeis
  FOR DELETE TO authenticated USING (true);

-- -------------------------------------------------------------
-- 4. FIX RLS ON stock_transfers & stock_transfer_items
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "st_select" ON public.stock_transfers;
DROP POLICY IF EXISTS "st_insert" ON public.stock_transfers;
DROP POLICY IF EXISTS "st_delete" ON public.stock_transfers;
DROP POLICY IF EXISTS "sti_select" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "sti_insert" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "sti_delete" ON public.stock_transfer_items;

CREATE POLICY "st_select" ON public.stock_transfers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "st_insert" ON public.stock_transfers
  FOR INSERT TO authenticated
  WITH CHECK (
    from_store_id = public.user_store_id()
    OR public.user_store_id() IS NULL
    OR public.is_admin()
  );

CREATE POLICY "st_delete" ON public.stock_transfers
  FOR DELETE TO authenticated
  USING (
    from_store_id = public.user_store_id()
    OR public.user_store_id() IS NULL
    OR public.is_admin()
  );

CREATE POLICY "sti_select" ON public.stock_transfer_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sti_insert" ON public.stock_transfer_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sti_delete" ON public.stock_transfer_items
  FOR DELETE TO authenticated USING (true);

-- -------------------------------------------------------------
-- 5. RECREATE RPC FUNCTIONS AS SECURITY DEFINER (OWNED BY POSTGRES)
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_transfer_dest_lot(text, text, text, integer, numeric, uuid);

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
  VALUES (p_lot_no, NULL, p_item_code, p_item_name, CURRENT_DATE::text, 'Transfer', p_qty, p_purchase_price, p_store_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER FUNCTION public.create_transfer_dest_lot(text, text, text, integer, numeric, uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.create_transfer_dest_lot(text, text, text, integer, numeric, uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.adjust_lot_qty(uuid, integer);

CREATE OR REPLACE FUNCTION public.adjust_lot_qty(
  p_lot_id uuid,
  p_delta integer
) RETURNS void AS $$
BEGIN
  UPDATE public.stock_lots SET qty = qty + p_delta WHERE id = p_lot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER FUNCTION public.adjust_lot_qty(uuid, integer) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.adjust_lot_qty(uuid, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.reconcile_store_stock(uuid);

CREATE OR REPLACE FUNCTION public.reconcile_store_stock(p_store_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.stock SET qty = COALESCE(sub.q, 0)
  FROM (
    SELECT item_name, SUM(qty) AS q
    FROM public.stock_lots
    WHERE store_id = p_store_id
    GROUP BY item_name
  ) sub
  WHERE stock.name = sub.item_name AND stock.store_id = p_store_id;

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

ALTER FUNCTION public.reconcile_store_stock(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.reconcile_store_stock(uuid) TO authenticated;

-- RPC to return ALL stock items from any store (regardless of quantity)
-- so user can select and map the destination item/code
DROP FUNCTION IF EXISTS public.get_store_stock(uuid);

CREATE OR REPLACE FUNCTION public.get_store_stock(p_store_id uuid)
RETURNS TABLE(code text, name text) AS $$
BEGIN
  RETURN QUERY
    SELECT s.code, s.name
    FROM public.stock s
    WHERE s.store_id = p_store_id
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER FUNCTION public.get_store_stock(uuid) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_store_stock(uuid) TO authenticated;

SELECT 'ALL RLS POLICIES & TRANSFER FUNCTIONS SUCCESSFULLY UPDATED' AS result;
