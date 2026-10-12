-- =========================================================================
-- 1. Delete the accidental item from BM Iphone Store (Code 2288)
-- 2. Insert item correctly into BM Electronic (Code 416) with Qty = 0
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- STEP 1: Delete accidental lot and stock item from BM Iphone Store
DELETE FROM public.stock_lots 
WHERE lot_no = 'IPH-2288' 
   OR (item_name = 'Iphone 15 Pro Max (256) GB' AND store_id = 'a0000000-0000-0000-0000-000000000002');

DELETE FROM public.stock 
WHERE code = '2288' 
  AND store_id = 'a0000000-0000-0000-0000-000000000002';


-- STEP 2: Insert into BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003) with QTY = 0
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES (
  '416', 
  'Iphone 15 Pro Max (256) GB', 
  'Old Phone', 
  'Iphone', 
  'Apple', 
  'Apple', 
  'Iphone 15 Pro Max (256) GB', 
  'Pcs', 
  0, 
  95000.00, 
  0, 
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
  qty = 0, 
  purchase_price = EXCLUDED.purchase_price, 
  selling_price = EXCLUDED.selling_price, 
  store_id = EXCLUDED.store_id;

-- STEP 3: Create FIFO Stock Lot for BM Electronic with QTY = 0
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-416', 
  NULL, 
  '416', 
  'Iphone 15 Pro Max (256) GB', 
  CURRENT_DATE::text, 
  'IMPORT', 
  0, 
  95000.00, 
  'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = 0, 
  purchase_price = EXCLUDED.purchase_price, 
  store_id = EXCLUDED.store_id;

-- STEP 4: Sync sequences
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- STEP 5: Verification
SELECT 'BM Electronic' AS store, id, lot_no, item_code, item_name, qty, purchase_price, store_id 
FROM public.stock_lots 
WHERE lot_no = 'ELC-416';
