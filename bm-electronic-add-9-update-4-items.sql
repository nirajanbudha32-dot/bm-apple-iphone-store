-- =========================================================================
-- BM ELECTRONIC: Add 9 New Items + Update 4 Items Quantity
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- UPDATES (4 items):
--   Code  18 | ANC Airpods USA                                            | Qty: 12 | Lot: ELC-18
--   Code 421 | Zone Usb Type C to Lighting 35W Super Fast Cable 14 Pro Max | Qty: 77 | Lot: ELC-421
--   Code  20 | Anker Adapter (30W)                                         | Qty: 35 | Lot: ELC-20
--   Code 432 | KARERTE 360 Camera Lens Iphone 15 Pro/15 Pro Max            | Qty: 10 | Lot: ELC-432
--
-- NEW ITEMS (9 items, sequential codes 447 - 455):
--   Code 447 | USB C to C Cable 240W                      | Qty: 10 | Lot: ELC-447
--   Code 448 | 35W Charger Iphone Normal                  | Qty: 20 | Lot: ELC-448
--   Code 449 | IOS Cover Iphone 13 Pro                    | Qty:  5 | Lot: ELC-449
--   Code 450 | IOS Cover Iphone 13 Pro Max                | Qty: 20 | Lot: ELC-450
--   Code 451 | IOS Phone Case Iphone 13                   | Qty: 30 | Lot: ELC-451
--   Code 452 | IOS Cover Iphone 14                        | Qty: 10 | Lot: ELC-452
--   Code 453 | IOS Phone Case Iphone 15                   | Qty: 10 | Lot: ELC-453
--   Code 454 | Anker Adapter (20W)                        | Qty: 25 | Lot: ELC-454
--   Code 455 | KARERTE 360 Camera Lens Iphone 18 Pro Max  | Qty:  6 | Lot: ELC-455
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Insert 9 New Items into public.stock
-- =========================================================
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES
  (
    '447', 'USB C to C Cable 240W', 'Accessory', 'Cable',
    'USB C to C', 'USB C to C', 'Cable 240W', 'Pcs',
    10, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '448', '35W Charger Iphone Normal', 'Accessory', 'Charger',
    '35W Charger Iphone Normal', '35W Charger Iphone Normal', '35W Charger Iphone Normal', 'Pcs',
    20, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '449', 'IOS Cover Iphone 13 Pro', 'Accessory', 'Cover',
    'IOS', 'IOS', 'Iphone 13 Pro', 'Pcs',
    5, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '450', 'IOS Cover Iphone 13 Pro Max', 'Accessory', 'Cover',
    'IOS', 'IOS', 'Iphone 13 Pro Max', 'Pcs',
    20, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '451', 'IOS Phone Case Iphone 13', 'Accessory', 'Cover',
    'IOS Phone Case', 'IOS Phone Case', 'Iphone 13', 'Pcs',
    30, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '452', 'IOS Cover Iphone 14', 'Accessory', 'Cover',
    'IOS', 'IOS', 'Iphone 14', 'Pcs',
    10, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '453', 'IOS Phone Case Iphone 15', 'Accessory', 'Cover',
    'IOS Phone Case', 'IOS Phone Case', 'Iphone 15', 'Pcs',
    10, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '454', 'Anker Adapter (20W)', 'Accessory', 'Adapter',
    'Anker', 'Anker', '(20W)', 'Pcs',
    25, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '455', 'KARERTE 360 Camera Lens Iphone 18 Pro Max', 'Accessory', 'Camera Lens',
    'KARERTE', 'KARERTE', 'Iphone 18 Pro Max', 'Pcs',
    6, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000003'
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
-- STEP 2: Update Quantities for 4 Existing Items
-- =========================================================
UPDATE public.stock SET qty = 12, updated_at = NOW()
WHERE code = '18' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 77, updated_at = NOW()
WHERE code = '421' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 35, updated_at = NOW()
WHERE code = '20' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 10, updated_at = NOW()
WHERE code = '432' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 3: Zero out ALL existing lots for all 13 items
-- =========================================================
UPDATE public.stock_lots SET qty = 0
WHERE item_code IN (
  '18', '421', '20', '432',
  '447', '448', '449', '450', '451', '452', '453', '454', '455'
)
AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 4: Upsert FIFO Lots for all 13 items
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  -- 4 Updated items
  ('ELC-18',  NULL, '18',  'ANC Airpods USA',                                            CURRENT_DATE::text, 'IMPORT', 12, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-421', NULL, '421', 'Zone Usb Type C to Lighting 35W Super Fast Cable 14 Pro Max', CURRENT_DATE::text, 'IMPORT', 77, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-20',  NULL, '20',  'Anker Adapter (30W)',                                         CURRENT_DATE::text, 'IMPORT', 35, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-432', NULL, '432', 'KARERTE 360 Camera Lens Iphone 15 Pro/15 Pro Max',            CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  -- 9 New items
  ('ELC-447', NULL, '447', 'USB C to C Cable 240W',                     CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-448', NULL, '448', '35W Charger Iphone Normal',                 CURRENT_DATE::text, 'IMPORT', 20, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-449', NULL, '449', 'IOS Cover Iphone 13 Pro',                   CURRENT_DATE::text, 'IMPORT',  5, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-450', NULL, '450', 'IOS Cover Iphone 13 Pro Max',               CURRENT_DATE::text, 'IMPORT', 20, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-451', NULL, '451', 'IOS Phone Case Iphone 13',                  CURRENT_DATE::text, 'IMPORT', 30, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-452', NULL, '452', 'IOS Cover Iphone 14',                       CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-453', NULL, '453', 'IOS Phone Case Iphone 15',                  CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-454', NULL, '454', 'Anker Adapter (20W)',                       CURRENT_DATE::text, 'IMPORT', 25, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-455', NULL, '455', 'KARERTE 360 Camera Lens Iphone 18 Pro Max', CURRENT_DATE::text, 'IMPORT',  6, 0.00, 'a0000000-0000-0000-0000-000000000003')
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
-- STEP 6: Verification Query (All 13 items should show MATCH)
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN (
    '18', '421', '20', '432',
    '447', '448', '449', '450', '451', '452', '453', '454', '455'
  )
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty
ORDER BY CAST(st.code AS integer);
