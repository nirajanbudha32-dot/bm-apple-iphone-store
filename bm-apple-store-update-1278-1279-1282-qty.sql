-- =========================================================================
-- BM APPLE IPHONE STORE: Update Quantities for 3 Items
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Target Updates:
--   Code 1278 | New Iphone 15         | Qty ->  0 | Lot: AIS-1278
--   Code 1279 | New Iphone 16         | Qty ->  2 | Lot: AIS-1279
--   Code 1282 | New Iphone 17 Pro Max | Qty -> 10 | Lot: AIS-1282
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- STEP 1: Update public.stock quantities
UPDATE public.stock AS st
SET
  qty = v.new_qty,
  updated_at = NOW()
FROM (
  VALUES
    ('1278', 0),
    ('1279', 2),
    ('1282', 10)
) AS v(code, new_qty)
WHERE st.code = v.code
  AND st.store_id = 'a0000000-0000-0000-0000-000000000001';

-- STEP 2: Zero out ALL existing lots for these 3 items
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND item_code IN ('1278', '1279', '1282');

-- STEP 3: Upsert primary FIFO stock lots with target quantities
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  ('AIS-1278', NULL, '1278', 'New Iphone 15',         CURRENT_DATE::text, 'IMPORT',  0, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1279', NULL, '1279', 'New Iphone 16',         CURRENT_DATE::text, 'IMPORT',  2, 0.00, 'a0000000-0000-0000-0000-000000000001'),
  ('AIS-1282', NULL, '1282', 'New Iphone 17 Pro Max', CURRENT_DATE::text, 'IMPORT', 10, 0.00, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- STEP 4: Sync Sequences Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- STEP 5: Verification (All 3 items must show status = 'MATCH')
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
  st.category,
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
  AND st.code IN ('1278', '1279', '1282')
GROUP BY s.name, st.code, st.name, st.category, st.qty
ORDER BY CAST(st.code AS integer);
