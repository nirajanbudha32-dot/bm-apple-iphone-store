-- =========================================================================
-- UPDATE ITEM CODE 1284 (Old Iphone 12) QTY TO 1
-- Store: BM Apple Iphone Store / BM Iphone Store
-- Item Code: 1284 | Qty: 1
--
-- Details from Sheet:
--   Item Code:    1284
--   Item Name:    Old Iphone 12
--   Category:     Old Iphone
--   Sub-Category: Iphone
--   Brand:        Apple
--   Model:        Iphone 12
--   Unit:         Pcs
--   Qty:          1 (updated from 0)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

DO $$
DECLARE
  v_store_id   uuid;
  v_lot_prefix text;
BEGIN
  -- 1. Find store_id for code 1284
  SELECT store_id INTO v_store_id
  FROM public.stock
  WHERE code = '1284';

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Item code 1284 not found in public.stock';
  END IF;

  -- 2. Update stock table
  UPDATE public.stock
  SET 
    qty = 1,
    updated_at = NOW()
  WHERE code = '1284';

  -- 3. Determine lot prefix based on store
  IF v_store_id = 'a0000000-0000-0000-0000-000000000001' THEN
    v_lot_prefix := 'AIS-';
  ELSE
    v_lot_prefix := 'IPH-';
  END IF;

  -- 4. Upsert primary active FIFO lot
  INSERT INTO public.stock_lots (
    lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
  )
  VALUES (
    v_lot_prefix || '1284', NULL, '1284', 'Old Iphone 12',
    CURRENT_DATE::text, 'IMPORT', 1, 0.00, v_store_id
  )
  ON CONFLICT (lot_no) DO UPDATE SET
    item_code = EXCLUDED.item_code,
    item_name = EXCLUDED.item_name,
    qty = EXCLUDED.qty,
    store_id = EXCLUDED.store_id;

  -- 5. Zero out any secondary lots if multiple exist for 1284
  UPDATE public.stock_lots
  SET qty = 0
  WHERE store_id = v_store_id
    AND item_code = '1284'
    AND lot_no != (v_lot_prefix || '1284');

END $$;


-- =========================================================================
-- VERIFICATION CHECK
-- =========================================================================
SELECT 
  s.name AS store_name,
  st.code,
  st.name AS item_name,
  st.category,
  st.sub_category,
  st.brand,
  st.model,
  st.unit,
  st.qty AS stock_qty,
  sl.lot_no,
  COALESCE(sl.qty, 0) AS lot_qty,
  CASE 
    WHEN st.qty = COALESCE(sl.qty, 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl 
  ON sl.item_code = st.code 
  AND sl.store_id = st.store_id
  AND sl.lot_no IN ('AIS-1284', 'IPH-1284')
WHERE st.code = '1284';
