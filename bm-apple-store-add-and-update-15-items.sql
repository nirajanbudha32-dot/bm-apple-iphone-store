-- =========================================================================
-- BM APPLE IPHONE STORE: Add 8 New Items + Update 7 Items Quantity
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- UPDATES (7 items):
--   Code 1001 | Anker Adapter (30 W)                   | Qty: 166 | Lot: AIS-1001
--   Code 1311 | Bird Wiwo Wireless Power Bank          | Qty:  17 | Lot: AIS-1311
--   Code 1002 | Lighting Charger 350 Rs                | Qty:  20 | Lot: AIS-1002
--   Code 1003 | Lighting Charger 650 Rs                | Qty:  79 | Lot: AIS-1003
--   Code 1249 | Wiwu Lighting Cable                    | Qty:  34 | Lot: AIS-1249
--   Code 1043 | Anank Easy Install Iphone 17 Pro Max   | Qty:  22 | Lot: AIS-1043
--   Code 1047 | Anank Easy Install Iphone 17           | Qty:  10 | Lot: AIS-1047
--
-- NEW ITEMS (8 items, sequential codes 1313 - 1320):
--   Code 1313 | Orginal Airpod Pro                     | Qty:  20 | Lot: AIS-1313
--   Code 1314 | Sasto Airpod Pro                       | Qty:  30 | Lot: AIS-1314
--   Code 1315 | SUS Sapphire Camere Leans              | Qty:  30 | Lot: AIS-1315
--   Code 1316 | Anank Easy Install Iphone 14           | Qty:  10 | Lot: AIS-1316
--   Code 1317 | Anank Easy Install Privacy Iphone 18 Pro Max | Qty: 10 | Lot: AIS-1317
--   Code 1318 | Anank Easy Install Privacy Iphone 18 Pro     | Qty: 10 | Lot: AIS-1318
--   Code 1319 | Anank Easy Install Iphone 18 Pro Max   | Qty:  30 | Lot: AIS-1319
--   Code 1320 | Anank Easy Install Iphone 18 Pro       | Qty:  20 | Lot: AIS-1320
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Insert 8 New Items into public.stock
-- =========================================================
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES
  (
    '1313', 'Orginal Airpod Pro', 'Accessory', 'Airpod',
    'Apple', 'Apple', 'Pro', 'Pcs',
    20, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1314', 'Sasto Airpod Pro', 'Accessory', 'Airpod',
    'Apple', 'Apple', 'Pro', 'Pcs',
    30, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1315', 'SUS Sapphire Camere Leans', 'Accessory', 'Camera Leans',
    'SUS', 'SUS', 'SUS Sapphire', 'Pcs',
    30, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1316', 'Anank Easy Install Iphone 14', 'Accessory', 'Glass',
    'Anank', 'Anank', 'Iphone 14', 'Pcs',
    10, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1317', 'Anank Easy Install Privacy Iphone 18 Pro Max', 'Accessory', 'Glass',
    'Anank', 'Anank', 'Iphone 18 Pro Max', 'Pcs',
    10, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1318', 'Anank Easy Install Privacy Iphone 18 Pro', 'Accessory', 'Glass',
    'Anank', 'Anank', 'Iphone 18 Pro', 'Pcs',
    10, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1319', 'Anank Easy Install Iphone 18 Pro Max', 'Accessory', 'Glass',
    'Anank', 'Anank', 'Iphone 18 Pro Max', 'Pcs',
    30, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1320', 'Anank Easy Install Iphone 18 Pro', 'Accessory', 'Glass',
    'Anank', 'Anank', 'Iphone 18 Pro', 'Pcs',
    20, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000001'
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
-- STEP 2: Update Quantities for 7 Existing Items
-- =========================================================
UPDATE public.stock SET qty = 166, updated_at = NOW()
WHERE code = '1001' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock SET qty = 17, updated_at = NOW()
WHERE code = '1311' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock SET qty = 20, updated_at = NOW()
WHERE code = '1002' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock SET qty = 79, updated_at = NOW()
WHERE code = '1003' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock SET qty = 34, updated_at = NOW()
WHERE code = '1249' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock SET qty = 22, updated_at = NOW()
WHERE code = '1043' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock SET qty = 10, updated_at = NOW()
WHERE code = '1047' AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- =========================================================
-- STEP 3: Zero out ALL existing lots for all 15 items
-- =========================================================
UPDATE public.stock_lots SET qty = 0
WHERE item_code IN (
  '1001', '1311', '1002', '1003', '1249', '1043', '1047',
  '1313', '1314', '1315', '1316', '1317', '1318', '1319', '1320'
)
AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- =========================================================
-- STEP 4: Upsert FIFO Lots for all 15 items
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  -- 7 Updated items
  ('AIS-1001', NULL, '1001', 'Anker Adapter (30 W)',                 CURRENT_DATE::text, 'IMPORT', 166, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1311', NULL, '1311', 'Bird Wiwo Wireless Power Bank',        CURRENT_DATE::text, 'IMPORT',  17, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1002', NULL, '1002', 'Lighting Charger 350 Rs',              CURRENT_DATE::text, 'IMPORT',  20, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1003', NULL, '1003', 'Lighting Charger 650 Rs',              CURRENT_DATE::text, 'IMPORT',  79, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1249', NULL, '1249', 'Wiwu Lighting Cable',                  CURRENT_DATE::text, 'IMPORT',  34, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1043', NULL, '1043', 'Anank Easy Install Iphone 17 Pro Max', CURRENT_DATE::text, 'IMPORT',  22, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1047', NULL, '1047', 'Anank Easy Install Iphone 17',         CURRENT_DATE::text, 'IMPORT',  10, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  -- 8 New items
  ('AIS-1313', NULL, '1313', 'Orginal Airpod Pro',                   CURRENT_DATE::text, 'IMPORT',  20, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1314', NULL, '1314', 'Sasto Airpod Pro',                     CURRENT_DATE::text, 'IMPORT',  30, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1315', NULL, '1315', 'SUS Sapphire Camere Leans',            CURRENT_DATE::text, 'IMPORT',  30, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1316', NULL, '1316', 'Anank Easy Install Iphone 14',         CURRENT_DATE::text, 'IMPORT',  10, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1317', NULL, '1317', 'Anank Easy Install Privacy Iphone 18 Pro Max', CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1318', NULL, '1318', 'Anank Easy Install Privacy Iphone 18 Pro',     CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1319', NULL, '1319', 'Anank Easy Install Iphone 18 Pro Max', CURRENT_DATE::text, 'IMPORT',  30, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1320', NULL, '1320', 'Anank Easy Install Iphone 18 Pro',     CURRENT_DATE::text, 'IMPORT',  20, 0.00, 'a0000000-0000-0000-0000-000000000001')
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
-- STEP 6: Verification Query (All 15 items should show MATCH)
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND st.code IN (
    '1001', '1311', '1002', '1003', '1249', '1043', '1047',
    '1313', '1314', '1315', '1316', '1317', '1318', '1319', '1320'
  )
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty
ORDER BY CAST(st.code AS integer);
