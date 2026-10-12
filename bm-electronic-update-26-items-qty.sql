-- =========================================================================
-- BM ELECTRONIC: Update Quantities for 26 Items
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items and Target Quantities:
--   Code 435 | Iphone 11 128 GB            | Qty -> 0
--   Code 427 | Iphone 11 64 GB             | Qty -> 0
--   Code 391 | Iphone 11 Pro Max 256 GB    | Qty -> 2
--   Code 390 | Iphone 11 Pro Max 64 GB     | Qty -> 0
--   Code 393 | Iphone 12 128 GB            | Qty -> 0
--   Code 405 | Iphone 12 64 GB             | Qty -> 2
--   Code 392 | Iphone 12 Min 64 GB         | Qty -> 0
--   Code 394 | Iphone 12 Pro Max 512 GB    | Qty -> 1
--   Code 395 | Iphone 13 128 GB            | Qty -> 1
--   Code 423 | Iphone 13 256GB             | Qty -> 0
--   Code 396 | Iphone 13 Pro 256 GB        | Qty -> 0
--   Code 397 | Iphone 13 Pro Max 128 GB    | Qty -> 2
--   Code 424 | Iphone 13 Pro Max 256GB     | Qty -> 1
--   Code 398 | Iphone 14 128 Gb            | Qty -> 1
--   Code 399 | Iphone 14 Plus 128 GB       | Qty -> 1
--   Code 400 | Iphone 14 Plus 256 GB       | Qty -> 0
--   Code 401 | Iphone 14 Pro 128 GB        | Qty -> 1
--   Code 402 | Iphone 14 Pro Max 128 GB    | Qty -> 1
--   Code 403 | Iphone 15 128 GB            | Qty -> 2
--   Code 404 | Iphone 15 Plus 128 GB       | Qty -> 1
--   Code 425 | Iphone 15 Pro Max 256 GB    | Qty -> 0
--   Code 439 | Iphone 16 Pro Max           | Qty -> 0
--   Code 418 | Iphone 16 Pro Max           | Qty -> 0
--   Code 414 | Iphone 7 Plus 128GB         | Qty -> 0
--   Code 437 | Iphone X                    | Qty -> 1
--   Code 443 | Iphone XR 128GB             | Qty -> 1
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
    ('435', 0),
    ('427', 0),
    ('391', 2),
    ('390', 0),
    ('393', 0),
    ('405', 2),
    ('392', 0),
    ('394', 1),
    ('395', 1),
    ('423', 0),
    ('396', 0),
    ('397', 2),
    ('424', 1),
    ('398', 1),
    ('399', 1),
    ('400', 0),
    ('401', 1),
    ('402', 1),
    ('403', 2),
    ('404', 1),
    ('425', 0),
    ('439', 0),
    ('418', 0),
    ('414', 0),
    ('437', 1),
    ('443', 1)
) AS v(code, new_qty)
WHERE st.code = v.code
  AND st.store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 2: Zero out ALL existing lots for these 26 items
-- =========================================================
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND item_code IN (
    '435', '427', '391', '390', '393', '405', '392', '394', '395', '423',
    '396', '397', '424', '398', '399', '400', '401', '402', '403', '404',
    '425', '439', '418', '414', '437', '443'
  );

-- =========================================================
-- STEP 3: Upsert primary FIFO stock lots with target quantities
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  ('ELC-435', NULL, '435', 'Iphone 11 128 GB',         CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-427', NULL, '427', 'Iphone 11 64 GB',          CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-391', NULL, '391', 'Iphone 11 Pro Max 256 GB', CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-390', NULL, '390', 'Iphone 11 Pro Max 64 GB',  CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-393', NULL, '393', 'Iphone 12 128 GB',         CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-405', NULL, '405', 'Iphone 12 64 GB',          CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-392', NULL, '392', 'Iphone 12 Min 64 GB',      CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-394', NULL, '394', 'Iphone 12 Pro Max 512 GB', CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-395', NULL, '395', 'Iphone 13 128 GB',         CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-423', NULL, '423', 'Iphone 13 256GB',          CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-396', NULL, '396', 'Iphone 13 Pro 256 GB',     CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-397', NULL, '397', 'Iphone 13 Pro Max 128 GB', CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-424', NULL, '424', 'Iphone 13 Pro Max 256GB',  CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-398', NULL, '398', 'Iphone 14 128 Gb',         CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-399', NULL, '399', 'Iphone 14 Plus 128 GB',    CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-400', NULL, '400', 'Iphone 14 Plus 256 GB',    CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-401', NULL, '401', 'Iphone 14 Pro 128 GB',     CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-402', NULL, '402', 'Iphone 14 Pro Max 128 GB', CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-403', NULL, '403', 'Iphone 15 128 GB',         CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-404', NULL, '404', 'Iphone 15 Plus 128 GB',    CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-425', NULL, '425', 'Iphone 15 Pro Max 256 GB', CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-439', NULL, '439', 'Iphone 16 Pro Max',        CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-418', NULL, '418', 'Iphone 16 Pro Max',        CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-414', NULL, '414', 'Iphone 7 Plus 128GB',      CURRENT_DATE::text, 'IMPORT', 0, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-437', NULL, '437', 'Iphone X',                 CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-443', NULL, '443', 'Iphone XR 128GB',          CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003')
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
-- STEP 5: Verification (All 26 items must show status = 'MATCH')
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN (
    '435', '427', '391', '390', '393', '405', '392', '394', '395', '423',
    '396', '397', '424', '398', '399', '400', '401', '402', '403', '404',
    '425', '439', '418', '414', '437', '443'
  )
GROUP BY s.name, st.code, st.name, st.qty
ORDER BY CAST(st.code AS integer);
