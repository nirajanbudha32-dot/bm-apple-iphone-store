-- =========================================================================
-- Insert 3 New Items into BM Iphone Store
-- Codes: 2284, 2285, 2286 (Continuing from 2283)
-- Store ID: a0000000-0000-0000-0000-000000000002
-- Lot Prefix: IPH-
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Insert/Update Items into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES 
  (
    '2284', 
    'Lighting To Headphone Jack', 
    'ASSERICESS', 
    'Spiliter', 
    'Lighting To Headphone Jack', 
    'Lighting To Headphone Jack', 
    'Lighting To Headphone Jack', 
    'Pcs', 
    16, 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2285', 
    'Zone Faste Charger 45 W Charger Type C To C', 
    'ASSERICESS', 
    'Charger', 
    'Zone', 
    'Zone', 
    'Zone Faste Charger 45 W', 
    'Pcs', 
    4, 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '2286', 
    'Zone Faste Charger 45 W Charger Type c To Micro', 
    'ASSERICESS', 
    'Charger', 
    'Zone', 
    'Zone', 
    'Zone Faste Charger 45 W', 
    'Pcs', 
    4, 
    0, 
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

-- 2. Insert/Update FIFO Stock Lots (Safe against duplicate key errors)
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES 
  ('IPH-2284', NULL, '2284', 'Lighting To Headphone Jack', CURRENT_DATE::text, 'IMPORT', 16, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2285', NULL, '2285', 'Zone Faste Charger 45 W Charger Type C To C', CURRENT_DATE::text, 'IMPORT', 4, 0, 'a0000000-0000-0000-0000-000000000002'),
  ('IPH-2286', NULL, '2286', 'Zone Faste Charger 45 W Charger Type c To Micro', CURRENT_DATE::text, 'IMPORT', 4, 0, 'a0000000-0000-0000-0000-000000000002')
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

-- 4. Verification: check the 3 new lots
SELECT id, lot_no, item_code, item_name, qty, store_id 
FROM public.stock_lots 
WHERE lot_no IN ('IPH-2284', 'IPH-2285', 'IPH-2286');
