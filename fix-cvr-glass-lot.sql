-- =========================================================================
-- FIX: Update stock & stock_lots to Qty = 4 without DELETE
-- Prevents foreign key constraint violation on sale_lot_allocations
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Insert or Update public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES (
  '415', 
  'CVR Super HD Glass Iphone 13', 
  'ASSERICESS', 
  'Glass', 
  'CVR Supe', 
  'CVR Supe', 
  'Iphone 13', 
  'Pcs', 
  4, 
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
  qty = 4, 
  store_id = EXCLUDED.store_id;

-- 2. Update existing lot ELC-415 to qty = 4 (or insert if missing)
-- NEVER deletes the lot, so sales history / foreign keys stay completely safe!
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-415', 
  NULL, 
  '415', 
  'CVR Super HD Glass Iphone 13', 
  CURRENT_DATE::text, 
  'IMPORT', 
  4, 
  0, 
  'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  qty = 4, 
  store_id = EXCLUDED.store_id;

-- 3. Sync sequences
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- 4. Verify lot now has qty = 4
SELECT id, lot_no, item_code, item_name, qty, store_id 
FROM public.stock_lots 
WHERE lot_no = 'ELC-415';
