-- =========================================================================
-- BM APPLE IPHONE STORE: Update Quantities for 11 Items
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Target Items & Quantities:
--   Code 1304 | Iphone 11 (64)GB       | Qty -> 0
--   Code 1292 | Iphone 11 Pro Max      | Qty -> 0
--   Code 1293 | Iphone 13 Pro Max      | Qty -> 1
--   Code 1309 | Iphone 16 Pro Max      | Qty -> 0
--   Code 1284 | Old Iphone 12          | Qty -> 2
--   Code 1285 | Old Iphone 13          | Qty -> 0
--   Code 1286 | Old Iphone 14          | Qty -> 1
--   Code 1287 | Old Iphone 14 Plus     | Qty -> 1
--   Code 1288 | Old Iphone 14 pro Max  | Qty -> 0
--   Code 1289 | Old Iphone 15          | Qty -> 1
--   Code 1283 | Old Iphone XR          | Qty -> 1
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Update public.stock quantities
-- =========================================================
UPDATE public.stock AS st
SET
  qty = v.new_qty,
  updated_at = NOW()
FROM (
  VALUES
    ('1304', 0),
    ('1292', 0),
    ('1293', 1),
    ('1309', 0),
    ('1284', 2),
    ('1285', 0),
    ('1286', 1),
    ('1287', 1),
    ('1288', 0),
    ('1289', 1),
    ('1283', 1)
) AS v(code, new_qty)
WHERE st.code = v.code
  AND st.store_id = 'a0000000-0000-0000-0000-000000000001';

-- =========================================================
-- STEP 2: Zero out ALL existing lots for these 11 items
-- =========================================================
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND item_code IN (
    '1304', '1292', '1293', '1309', '1284', '1285', '1286', '1287', '1288', '1289', '1283'
  );

-- =========================================================
-- STEP 3: Upsert primary FIFO stock lots with target quantities
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  ('AIS-1304', NULL, '1304', 'Iphone 11 (64)GB',      CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1292', NULL, '1292', 'Iphone 11 Pro Max',     CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1293', NULL, '1293', 'Iphone 13 Pro Max',     CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1309', NULL, '1309', 'Iphone 16 Pro Max',     CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1284', NULL, '1284', 'Old Iphone 12',         CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1285', NULL, '1285', 'Old Iphone 13',         CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1286', NULL, '1286', 'Old Iphone 14',         CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1287', NULL, '1287', 'Old Iphone 14 Plus',    CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1288', NULL, '1288', 'Old Iphone 14 pro Max', CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1289', NULL, '1289', 'Old Iphone 15',         CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1283', NULL, '1283', 'Old Iphone XR',         CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- =========================================================
-- STEP 4: Sync Sequences Safely
-- =========================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================
-- STEP 5: Verification (All 11 items must show status = 'MATCH')
-- =========================================================
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND st.code IN (
    '1304', '1292', '1293', '1309', '1284', '1285', '1286', '1287', '1288', '1289', '1283'
  )
GROUP BY s.name, st.code, st.name, st.qty
ORDER BY CAST(st.code AS integer);
