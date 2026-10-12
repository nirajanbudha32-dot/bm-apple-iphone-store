-- =========================================================================
-- BM Iphone Store: Update 3 Existing Items (2139, 2140, 2281) + Insert 1 New Item (2287)
-- Store ID: a0000000-0000-0000-0000-000000000002
-- Lot Prefix: IPH-
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Upsert Items into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES 
  -- Existing Code 2139 (Updated Name, Qty 3, Price 45000)
  (
    '2139', 
    'Iphone 13 (128) GB', 
    'Old Phone', 
    'Iphone', 
    'Apple', 
    'Apple', 
    'Iphone 13 (128) GB', 
    'Pcs', 
    3, 
    45000.00, 
    0, 
    'a0000000-0000-0000-0000-000000000002'
  ),
  -- Existing Code 2140 (Updated Name, Qty 1, Price 55000)
  (
    '2140', 
    'Iphone 14 Plus (128) GB', 
    'Old Phone', 
    'Iphone', 
    'Apple', 
    'Apple', 
    'Iphone 14 Plus (128) GB', 
    'Pcs', 
    1, 
    55000.00, 
    0, 
    'a0000000-0000-0000-0000-000000000002'
  ),
  -- Existing Code 2281 (Updated Name, Qty 1, Price 52500)
  (
    '2281', 
    'Iphone 14 (128) GB', 
    'Old Phone', 
    'Iphone', 
    'Apple', 
    'Apple', 
    'Iphone 14 (128) GB', 
    'Pcs', 
    1, 
    52500.00, 
    0, 
    'a0000000-0000-0000-0000-000000000002'
  ),
  -- New Item (Code 2287, Qty 1, Price 79000)
  (
    '2287', 
    'Iphone 13 Pro Max (256) GB', 
    'Old Phone', 
    'Iphone', 
    'Apple', 
    'Apple', 
    'Iphone 13 Pro Max (256) GB', 
    'Pcs', 
    1, 
    79000.00, 
    0, 
    'a0000000-0000-0000-0000-000000000002'
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
  store_id = EXCLUDED.store_id;

-- 2. Upsert FIFO Stock Lots (Safe with ON CONFLICT on lot_no)
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES 
  ('IPH-2139', NULL, '2139', 'Iphone 13 (128) GB', CURRENT_DATE::text, 'IMPORT', 3, 45000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2140', NULL, '2140', 'Iphone 14 Plus (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 55000.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2281', NULL, '2281', 'Iphone 14 (128) GB', CURRENT_DATE::text, 'IMPORT', 1, 52500.00, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2287', NULL, '2287', 'Iphone 13 Pro Max (256) GB', CURRENT_DATE::text, 'IMPORT', 1, 79000.00, 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty, 
  purchase_price = EXCLUDED.purchase_price, 
  store_id = EXCLUDED.store_id;

-- 3. Sync sequences
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- 4. Verification: Check the 4 lots
SELECT id, lot_no, item_code, item_name, qty, purchase_price, store_id 
FROM public.stock_lots 
WHERE lot_no IN ('IPH-2139', 'IPH-2140', 'IPH-2281', 'IPH-2287');
