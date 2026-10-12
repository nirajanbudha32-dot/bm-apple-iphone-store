-- =========================================================================
-- BM ELECTRONIC: Add New Item (Iphone 11 64 GB)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- New Code: 427 (Next sequential code after 426)
-- Lot No:   ELC-427
--
-- Item Details from Specification:
-- Item Name:     Iphone 11 64 GB
-- Category:      Old Iphone
-- Sub-Category:  Iphone
-- Brand:         Apple
-- Model:         Iphone 11 64 GB
-- Unit:          Pcs
-- Qty:           1
-- =========================================================================

-- 1. Insert/Update Item into public.stock
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
  '427',
  'Iphone 11 64 GB',
  'Old Iphone',
  'Iphone',
  'Apple',
  'Apple',
  'Iphone 11 64 GB',
  'Pcs',
  1,
  0.00,
  0.00,
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
  store_id = EXCLUDED.store_id,
  updated_at = NOW();

-- 2. Insert/Update FIFO Stock Lot in public.stock_lots
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
  'ELC-427',
  NULL,
  '427',
  'Iphone 11 64 GB',
  CURRENT_DATE::text,
  'IMPORT',
  1,
  0.00,
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

-- 3. Sync Sequence Generators safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^ELC-\d+$')));

-- 4. Verification Queries
SELECT id, code, name, category, sub_category, brand, model, unit, qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '427';

SELECT id, lot_no, item_code, item_name, qty, purchase_price, supplier, store_id
FROM public.stock_lots
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND lot_no = 'ELC-427';
