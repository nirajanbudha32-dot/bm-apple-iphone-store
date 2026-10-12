-- =========================================================================
-- BM ELECTRONIC: Add 2 New Items
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items:
--   1. Code 430 | Metal Ag Glass Cover Iphone 12/12 Pro | Lot: ELC-430 | Qty: 0
--   2. Code 431 | Mag Fit Cover Iphone 12/12 Pro        | Lot: ELC-431 | Qty: 0
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================================
-- PART 1: Insert 2 New Items into public.stock
-- =========================================================================

INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES 
  (
    '430',
    'Metal Ag Glass Cover Iphone 12/12 Pro',
    'ASSERICESS',
    'Cover',
    'Metal Ag Glass',
    'Metal Ag Glass',
    'Iphone 12/12 Pro',
    'Pcs',
    0,
    0.00,
    0.00,
    'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '431',
    'Mag Fit Cover Iphone 12/12 Pro',
    'ASSERICESS',
    'Cover',
    'Mag Fit',
    'Mag Fit',
    'Iphone 12/12 Pro',
    'Pcs',
    0,
    0.00,
    0.00,
    'a0000000-0000-0000-0000-000000000003'
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

-- =========================================================================
-- PART 2: Upsert FIFO Stock Lots into public.stock_lots
-- =========================================================================

INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES 
  (
    'ELC-430', NULL, '430', 'Metal Ag Glass Cover Iphone 12/12 Pro',
    CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    'ELC-431', NULL, '431', 'Mag Fit Cover Iphone 12/12 Pro',
    CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'
  )
ON CONFLICT (lot_no) DO UPDATE SET
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id = EXCLUDED.store_id;

-- =========================================================================
-- PART 3: Sync Sequence Generators safely
-- =========================================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================================
-- PART 4: Verification Query
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN ('430', '431')
ORDER BY st.code;
