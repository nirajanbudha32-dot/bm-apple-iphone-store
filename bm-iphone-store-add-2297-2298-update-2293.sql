-- =========================================================================
-- BM IPHONE STORE: Add 2 New Items (2297, 2298) + Update Qty for Code 2293
-- Store: BM Iphone Store (Store ID: a0000000-0000-0000-0000-000000000002)
--
-- Actions:
--   ADD    Code 2297 | KARERTE Iphone 18 Pro Max                           | Qty: 11 | Lot: IPH-2297
--   ADD    Code 2298 | Wiwu C to C                                         | Qty: 10 | Lot: IPH-2298
--   UPDATE Code 2293 | Zone Type C to Lighting 35W Super Fast Charger Cable 1M | Qty: 20 | Lot: IPH-2293
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Insert 2 New Items into public.stock
-- =========================================================
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES
  (
    '2297',
    'KARERTE Iphone 18 Pro Max',
    'Accessory',
    'Camera Lens',
    'KARERTE',
    'KARERTE',
    'Iphone 18 Pro Max',
    'Pcs',
    11, 0.00, 0.00,
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2298',
    'Wiwu C to C',
    'Accessory',
    'Cable',
    'Wiwu',
    'Wiwu',
    'C to C',
    'Pcs',
    10, 0.00, 0.00,
    'a0000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  category       = EXCLUDED.category,
  sub_category   = EXCLUDED.sub_category,
  brand          = EXCLUDED.brand,
  sub_brand      = EXCLUDED.sub_brand,
  model          = EXCLUDED.model,
  unit           = EXCLUDED.unit,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  selling_price  = EXCLUDED.selling_price,
  store_id       = EXCLUDED.store_id,
  updated_at     = NOW();

-- =========================================================
-- STEP 2: Update Quantity for Code 2293 in public.stock
-- =========================================================
UPDATE public.stock
SET qty        = 20,
    updated_at = NOW()
WHERE code     = '2293'
  AND store_id = 'a0000000-0000-0000-0000-000000000002';

-- =========================================================
-- STEP 3: Zero out ALL existing lots for these 3 items
-- =========================================================
UPDATE public.stock_lots SET qty = 0
WHERE item_code IN ('2297', '2298', '2293')
  AND store_id = 'a0000000-0000-0000-0000-000000000002';

-- =========================================================
-- STEP 4: Upsert FIFO Lots for all 3 items
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  (
    'IPH-2297', NULL, '2297',
    'KARERTE Iphone 18 Pro Max',
    CURRENT_DATE::text, 'IMPORT', 11, 0.00,
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    'IPH-2298', NULL, '2298',
    'Wiwu C to C',
    CURRENT_DATE::text, 'IMPORT', 10, 0.00,
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    'IPH-2293', NULL, '2293',
    'Zone Type C to Lighting 35W Super Fast Charger Cable 1M',
    CURRENT_DATE::text, 'IMPORT', 20, 0.00,
    'a0000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- =========================================================
-- STEP 5: Sync Sequences Safely
-- =========================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================
-- STEP 6: Verification Query (All 3 items should show MATCH)
-- =========================================================
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
  st.category,
  st.sub_category,
  st.brand,
  st.model,
  st.unit,
  st.qty                   AS stock_qty,
  COALESCE(SUM(sl.qty), 0) AS total_lot_qty,
  CASE
    WHEN st.qty = COALESCE(SUM(sl.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END                      AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl
  ON  sl.item_code = st.code
  AND sl.store_id  = st.store_id
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000002'
  AND st.code IN ('2297', '2298', '2293')
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty
ORDER BY CAST(st.code AS integer);
