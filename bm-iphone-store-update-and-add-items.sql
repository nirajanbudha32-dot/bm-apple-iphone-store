-- =========================================================================
-- BM IPHONE STORE: Update 6 Existing Items + Add 2 New Items (8 Total)
-- Store: BM Iphone Store (Store ID: a0000000-0000-0000-0000-000000000002)
-- Lot Prefix: IPH-
--
-- Items Specification:
-- 1. Code 2280 | Iphone 12 128GB              | Qty: 1 | Price: 36,000.00
-- 2. Code 2279 | Iphone 12 64 GB              | Qty: 0 | Price: 0.00
-- 3. Code 2139 | Iphone 13 (128) GB           | Qty: 2 | Price: 45,000.00
-- 4. Code 2287 | Iphone 13 Pro Max (256) GB   | Qty: 1 | Price: 79,000.00
-- 5. Code 2281 | Iphone 14 (128) GB           | Qty: 1 | Price: 52,500.00
-- 6. Code 2140 | Iphone 14 Plus (128) GB      | Qty: 1 | Price: 55,000.00
-- 7. Code 2288 | Iphone 13 Pro Max (128) GB   | Qty: 1 | Price: 79,000.00 (NEW)
-- 8. Code 2289 | Iphone 15 (128) GB           | Qty: 1 | Price: 65,000.00 (NEW)
-- =========================================================================

-- STEP 1: Upsert Items into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES 
  ('2280', 'Iphone 12 128GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 12 128GB', 'PCS', 1, 36000.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2279', 'Iphone 12 64 GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 12 64 GB', 'PCS', 0, 0.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2139', 'Iphone 13 (128) GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 (128) GB', 'Pcs', 2, 45000.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2287', 'Iphone 13 Pro Max (256) GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 Pro Max (256) GB', 'Pcs', 1, 79000.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2281', 'Iphone 14 (128) GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 (128) GB', 'Pcs', 1, 52500.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2140', 'Iphone 14 Plus (128) GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 Plus (128) GB', 'Pcs', 1, 55000.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2288', 'Iphone 13 Pro Max (128) GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 Pro Max (128) GB', 'Pcs', 1, 79000.00, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('2289', 'Iphone 15 (128) GB', 'Old Phone', 'Iphone', 'Apple', 'Apple', 'Iphone 15 (128) GB', 'Pcs', 1, 65000.00, 0, 'a0000000-0000-0000-0000-000000000002')
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


-- STEP 2: Normalize and Upsert FIFO Stock Lots in public.stock_lots
-- 2a. Set any older duplicate lots for these codes to 0 (protects past sales allocations)
WITH ranked_lots AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000002'
    AND item_code IN ('2139', '2140', '2279', '2280', '2281', '2287', '2288', '2289')
)
UPDATE public.stock_lots sl
SET qty = 0
FROM ranked_lots rl
WHERE sl.id = rl.id AND rl.rn > 1;

-- 2b. Upsert the active lot for all 8 items
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES 
  ('IPH-2280', NULL, '2280', 'Iphone 12 128GB', CURRENT_DATE::text, 'IMPORT', 1, 36000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2279', NULL, '2279', 'Iphone 12 64 GB', CURRENT_DATE::text, 'IMPORT', 0, 0.00,     'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2139', NULL, '2139', 'Iphone 13 (128) GB', CURRENT_DATE::text, 'IMPORT', 2, 45000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2287', NULL, '2287', 'Iphone 13 Pro Max (256) GB', CURRENT_DATE::text, 'IMPORT', 1, 79000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2281', NULL, '2281', 'Iphone 14 (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 52500.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2140', NULL, '2140', 'Iphone 14 Plus (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 55000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2288', NULL, '2288', 'Iphone 13 Pro Max (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 79000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2289', NULL, '2289', 'Iphone 15 (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 65000.00, 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id = EXCLUDED.store_id;


-- STEP 3: Sync sequence generators safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^IPH-\d+$')));


-- STEP 4: Verification - Verify side-by-side match for all 8 items
SELECT 
  s.code,
  s.name,
  s.qty AS stock_qty,
  COALESCE(SUM(l.qty), 0) AS total_active_lots_qty,
  s.purchase_price,
  CASE 
    WHEN s.qty = COALESCE(SUM(l.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock s
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000002'
  AND s.code IN ('2139', '2140', '2279', '2280', '2281', '2287', '2288', '2289')
GROUP BY s.code, s.name, s.qty, s.purchase_price
ORDER BY CAST(s.code AS integer);
