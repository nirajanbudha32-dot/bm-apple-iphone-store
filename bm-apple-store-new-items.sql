-- ============================================
-- BM Apple Iphone Store - Add Item: Iphone 13 Pro Max
-- Store: BM Apple Iphone Store (a0000000-0000-0000-0000-000000000001)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Insert Item 2312 (Iphone 13 Pro Max)
INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('2312', 'Iphone 13 Pro Max', 'Old Iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 Pro Max', 'Pcs', 1, 72000, 0, 'a0000000-0000-0000-0000-000000000001')
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

-- 2. Create opening stock lot for 2312 (FIFO)
INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id)
SELECT 
  'AIS-' || code, 
  NULL, 
  code, 
  name, 
  CURRENT_DATE, 
  'IMPORT', 
  qty, 
  purchase_price, 
  store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND code = '2312'
ON CONFLICT DO NOTHING;

-- 3. Sync sequences
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));
