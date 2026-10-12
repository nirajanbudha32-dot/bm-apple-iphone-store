-- =========================================================================
-- BM IPHONE STORE: Update 6 Items + Add 2 New Items (Codes 2303, 2304)
-- Store: BM Iphone Store (Store ID: a0000000-0000-0000-0000-000000000002)
--
-- UPDATES (6 items):
--   Code 2280 | Iphone 12 128GB            | Qty: 1 | Price: 36,000.00
--   Code 2139 | Iphone 13 (128) GB         | Qty: 2 | Price: 45,000.00
--   Code 2288 | Iphone 13 Pro Max (128) GB | Qty: 1 | Price: 79,000.00
--   Code 2281 | Iphone 14 (128) GB         | Qty: 1 | Price: 52,500.00
--   Code 2140 | Iphone 14 Plus (128) GB    | Qty: 1 | Price: 55,000.00
--   Code 2289 | Iphone 15 (128) GB         | Qty: 1 | Price: 65,000.00
--
-- NEW ITEMS (2 items):
--   Code 2303 | Iphone Xr 128 GB           | Qty: 1 | Lot: IPH-2303
--   Code 2304 | Mac Book New 8/256         | Qty: 1 | Lot: IPH-2304
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Upsert all 8 items into public.stock
-- =========================================================
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES
  (
    '2280', 'Iphone 12 128GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone 12 128GB', 'PCS',
    1, 36000.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2139', 'Iphone 13 (128) GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone 13 (128) GB', 'Pcs',
    2, 45000.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2288', 'Iphone 13 Pro Max (128) GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone 13 Pro Max (128) GB', 'Pcs',
    1, 79000.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2281', 'Iphone 14 (128) GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone 14 (128) GB', 'Pcs',
    1, 52500.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2140', 'Iphone 14 Plus (128) GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone 14 Plus (128) GB', 'Pcs',
    1, 55000.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2289', 'Iphone 15 (128) GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone 15 (128) GB', 'Pcs',
    1, 65000.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2303', 'Iphone Xr 128 GB', 'Old Phone', 'Iphone',
    'Apple', 'Apple', 'Iphone Xr 128 GB', 'Pcs',
    1, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2304', 'Mac Book New 8/256', 'Mac Book', 'Mac Book',
    'Apple', 'Apple', 'Mac Book New 8/256', 'Pcs',
    1, 0.00, 0.00, 'a0000000-0000-0000-0000-000000000002'
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
-- STEP 2: Zero out existing lots for these 8 codes
-- =========================================================
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000002'
  AND item_code IN ('2280', '2139', '2288', '2281', '2140', '2289', '2303', '2304');

-- =========================================================
-- STEP 3: Upsert primary FIFO stock lots
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  ('IPH-2280', NULL, '2280', 'Iphone 12 128GB',            CURRENT_DATE::text, 'IMPORT', 1, 36000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2139', NULL, '2139', 'Iphone 13 (128) GB',         CURRENT_DATE::text, 'IMPORT', 2, 45000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2288', NULL, '2288', 'Iphone 13 Pro Max (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 79000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2281', NULL, '2281', 'Iphone 14 (128) GB',         CURRENT_DATE::text, 'IMPORT', 1, 52500.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2140', NULL, '2140', 'Iphone 14 Plus (128) GB',    CURRENT_DATE::text, 'IMPORT', 1, 55000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2289', NULL, '2289', 'Iphone 15 (128) GB',         CURRENT_DATE::text, 'IMPORT', 1, 65000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2303', NULL, '2303', 'Iphone Xr 128 GB',           CURRENT_DATE::text, 'IMPORT', 1,     0.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2304', NULL, '2304', 'Mac Book New 8/256',         CURRENT_DATE::text, 'IMPORT', 1,     0.00, 'a0000000-0000-0000-0000-000000000002')
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
-- STEP 5: Verification (All 8 items must show status = 'MATCH')
-- =========================================================
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
  st.category,
  st.qty                   AS stock_qty,
  COALESCE(SUM(sl.qty), 0) AS total_lot_qty,
  st.purchase_price,
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
  AND st.code IN ('2280', '2139', '2288', '2281', '2140', '2289', '2303', '2304')
GROUP BY s.name, st.code, st.name, st.category, st.qty, st.purchase_price
ORDER BY CAST(st.code AS integer);
