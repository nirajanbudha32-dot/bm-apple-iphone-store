-- =========================================================================
-- BM Electronic: Update Item 2288 to New Latest Code 421
-- Item: Zone Usb Type C to Lighting 35W Super Fast Cable 14 Pro Max
-- Code: 421 (BM Electronic latest code after 420)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Lot No: ELC-421
-- =========================================================================

-- 1. Remove old/accidental code 2288 from BM Electronic if it exists
DELETE FROM public.stock_lots 
WHERE (lot_no = 'ELC-2288' OR (item_code = '2288' AND store_id = 'a0000000-0000-0000-0000-000000000003'));

DELETE FROM public.stock 
WHERE code = '2288' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- 2. Insert as Code 421 into public.stock
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
  '421', 
  'Zone Usb Type C to Lighting 35W Super Fast Cable 14 Pro Max', 
  'ASSERICESS', 
  'Charger', 
  'Zone', 
  'Zone', 
  'Type C to Lighting 35W Super Fast Cable 14 Pro Max', 
  'Pcs', 
  12, 
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

-- 3. Insert FIFO Stock Lot ELC-421
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
  'ELC-421', 
  NULL, 
  '421', 
  'Zone Usb Type C to Lighting 35W Super Fast Cable 14 Pro Max', 
  CURRENT_DATE::text, 
  'IMPORT', 
  12, 
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

-- 4. Sync sequences safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- 5. Verification: check the new item and lot
SELECT id, code, name, category, sub_category, brand, model, qty, store_id 
FROM public.stock 
WHERE code = '421';

SELECT id, lot_no, item_code, item_name, qty, store_id 
FROM public.stock_lots 
WHERE lot_no = 'ELC-421';
