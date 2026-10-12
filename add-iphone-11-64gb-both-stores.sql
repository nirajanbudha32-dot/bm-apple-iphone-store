-- =========================================================================
-- Add "Iphone 11 (64)GB" to:
--   1. BM Apple Iphone Store (Qty: 2) -> Store ID: a0000000-0000-0000-0000-000000000001
--   2. BM Iphone Store (Qty: 1)       -> Store ID: a0000000-0000-0000-0000-000000000002
--
-- Automatically assigns next available unique codes and matching FIFO lots.
-- Run this in your Supabase SQL Editor.
-- =========================================================================

DO $$
DECLARE
  v_apple_store_id  uuid := 'a0000000-0000-0000-0000-000000000001';
  v_iphone_store_id uuid := 'a0000000-0000-0000-0000-000000000002';
  
  v_apple_code  text;
  v_iphone_code text;
  v_apple_lot   text;
  v_iphone_lot  text;
  
  v_next_num integer;
BEGIN
  -- -------------------------------------------------------------
  -- 1. Determine next code for BM Apple Iphone Store
  -- (Picks next available code in 1000-series, e.g. 1304+)
  -- -------------------------------------------------------------
  SELECT COALESCE(MAX(CAST(code AS integer)), 1303) + 1
  INTO v_next_num
  FROM public.stock
  WHERE store_id = v_apple_store_id
    AND code ~ '^[0-9]+$'
    AND CAST(code AS integer) BETWEEN 1000 AND 1999;
    
  -- Ensure code is globally unique across public.stock
  WHILE EXISTS (SELECT 1 FROM public.stock WHERE code = v_next_num::text) LOOP
    v_next_num := v_next_num + 1;
  END LOOP;
  
  v_apple_code := v_next_num::text;
  v_apple_lot  := 'AIS-' || v_apple_code;

  -- -------------------------------------------------------------
  -- 2. Determine next code for BM Iphone Store
  -- (Picks next available code in 2000-series, e.g. 2290+)
  -- -------------------------------------------------------------
  SELECT COALESCE(MAX(CAST(code AS integer)), 2289) + 1
  INTO v_next_num
  FROM public.stock
  WHERE store_id = v_iphone_store_id
    AND code ~ '^[0-9]+$'
    AND CAST(code AS integer) >= 2000;
    
  -- Ensure code is globally unique across public.stock
  WHILE EXISTS (SELECT 1 FROM public.stock WHERE code = v_next_num::text) LOOP
    v_next_num := v_next_num + 1;
  END LOOP;
  
  v_iphone_code := v_next_num::text;
  v_iphone_lot  := 'IPH-' || v_iphone_code;

  -- -------------------------------------------------------------
  -- 3. Insert Item into BM Apple Iphone Store (Qty: 2)
  -- -------------------------------------------------------------
  INSERT INTO public.stock (
    code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
  )
  VALUES (
    v_apple_code,
    'Iphone 11 (64)GB',
    'Old Iphone',
    'Iphone',
    'Apple',
    'Apple',
    'Iphone 11 (64)GB',
    'Pcs',
    2,
    0,
    0,
    v_apple_store_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    brand = EXCLUDED.brand,
    sub_brand = EXCLUDED.sub_brand,
    model = EXCLUDED.model,
    unit = EXCLUDED.unit,
    qty = EXCLUDED.qty,
    purchase_price = EXCLUDED.purchase_price,
    selling_price = EXCLUDED.selling_price,
    store_id = EXCLUDED.store_id,
    updated_at = NOW();

  -- Insert FIFO Stock Lot for BM Apple Iphone Store
  INSERT INTO public.stock_lots (
    lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
  )
  VALUES (
    v_apple_lot,
    NULL,
    v_apple_code,
    'Iphone 11 (64)GB',
    CURRENT_DATE::text,
    'IMPORT',
    2,
    0,
    v_apple_store_id
  )
  ON CONFLICT (lot_no) DO UPDATE SET
    item_code = EXCLUDED.item_code,
    item_name = EXCLUDED.item_name,
    date = EXCLUDED.date,
    supplier = EXCLUDED.supplier,
    qty = EXCLUDED.qty,
    purchase_price = EXCLUDED.purchase_price,
    store_id = EXCLUDED.store_id;

  -- -------------------------------------------------------------
  -- 4. Insert Item into BM Iphone Store (Qty: 1)
  -- -------------------------------------------------------------
  INSERT INTO public.stock (
    code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
  )
  VALUES (
    v_iphone_code,
    'Iphone 11 (64)GB',
    'Old Iphone',
    'Iphone',
    'Apple',
    'Apple',
    'Iphone 11 (64)GB',
    'Pcs',
    1,
    0,
    0,
    v_iphone_store_id
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    brand = EXCLUDED.brand,
    sub_brand = EXCLUDED.sub_brand,
    model = EXCLUDED.model,
    unit = EXCLUDED.unit,
    qty = EXCLUDED.qty,
    purchase_price = EXCLUDED.purchase_price,
    selling_price = EXCLUDED.selling_price,
    store_id = EXCLUDED.store_id,
    updated_at = NOW();

  -- Insert FIFO Stock Lot for BM Iphone Store
  INSERT INTO public.stock_lots (
    lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
  )
  VALUES (
    v_iphone_lot,
    NULL,
    v_iphone_code,
    'Iphone 11 (64)GB',
    CURRENT_DATE::text,
    'IMPORT',
    1,
    0,
    v_iphone_store_id
  )
  ON CONFLICT (lot_no) DO UPDATE SET
    item_code = EXCLUDED.item_code,
    item_name = EXCLUDED.item_name,
    date = EXCLUDED.date,
    supplier = EXCLUDED.supplier,
    qty = EXCLUDED.qty,
    purchase_price = EXCLUDED.purchase_price,
    store_id = EXCLUDED.store_id;

  -- -------------------------------------------------------------
  -- 5. Sync Sequences
  -- -------------------------------------------------------------
  PERFORM setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^[0-9]+$')));
  PERFORM setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

  RAISE NOTICE 'Successfully added items:';
  RAISE NOTICE 'BM Apple Iphone Store -> Code: %, Lot: %, Qty: 2', v_apple_code, v_apple_lot;
  RAISE NOTICE 'BM Iphone Store       -> Code: %, Lot: %, Qty: 1', v_iphone_code, v_iphone_lot;
END $$;

-- -------------------------------------------------------------
-- 6. Verification: View the added items and lots
-- -------------------------------------------------------------
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
  sl.qty AS lot_qty
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl ON sl.item_code = st.code AND sl.store_id = st.store_id
WHERE st.name = 'Iphone 11 (64)GB'
ORDER BY st.store_id, st.code;
