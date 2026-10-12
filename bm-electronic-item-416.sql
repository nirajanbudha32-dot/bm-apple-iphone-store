-- =========================================================================
-- BM Electronic: Insert New Item "Iphone 15 Pro Max (256) GB"
-- Code: 416 (Next sequential code for BM Electronic after 415)
-- Store ID: a0000000-0000-0000-0000-000000000003
-- Lot Prefix: ELC-
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Insert Item into public.stock
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
  1, 
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
  qty = EXCLUDED.qty, 
  purchase_price = EXCLUDED.purchase_price, 
  selling_price = EXCLUDED.selling_price, 
  store_id = EXCLUDED.store_id;

-- 2. Insert/Update FIFO Stock Lot (Safe with ON CONFLICT on lot_no)
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
  1, 
  95000.00, 
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

-- 3. Sync sequences
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- 4. Verification: check the new lot
SELECT id, lot_no, item_code, item_name, qty, purchase_price, store_id 
FROM public.stock_lots 
WHERE lot_no = 'ELC-416';
