-- =========================================================================
-- BM Electronic: Insert New Item "Iphone 16 Pro Max"
-- Code: 418
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Lot No: ELC-418
-- =========================================================================

-- 1. Insert Item into public.stock
INSERT INTO public.stock (
  code, 
  name, 
  category, 
  sub_category, 
  brand, 
  sub_brand, 
  model, 
  unit, 
  qty, 
  purchase_price, 
  selling_price, 
  store_id
)
VALUES (
  '418', 
  'Iphone 16 Pro Max', 
  'Old Iphone', 
  'Iphone', 
  'Apple', 
  'Apple', 
  'Iphone 16 Pro Max', 
  'Pcs', 
  0, 
  0, 
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
  qty = EXCLUDED.qty, 
  purchase_price = EXCLUDED.purchase_price, 
  selling_price = EXCLUDED.selling_price, 
  store_id = EXCLUDED.store_id;

-- 2. Insert FIFO Stock Lot into public.stock_lots
INSERT INTO public.stock_lots (
  lot_no, 
  purchase_id, 
  item_code, 
  item_name, 
  date, 
  supplier, 
  qty, 
  purchase_price, 
  store_id
)
VALUES (
  'ELC-418', 
  NULL, 
  '418', 
  'Iphone 16 Pro Max', 
  CURRENT_DATE::text, 
  'IMPORT', 
  0, 
  0, 
  'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty, 
  purchase_price = EXCLUDED.purchase_price, 
  store_id = EXCLUDED.store_id;

-- 3. Sync sequences safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- 4. Verification: check the newly added stock item and lot
SELECT id, code, name, category, sub_category, brand, model, qty, store_id 
FROM public.stock 
WHERE code = '418';

SELECT id, lot_no, item_code, item_name, qty, store_id 
FROM public.stock_lots 
WHERE lot_no = 'ELC-418';
