-- =========================================================================
-- BM Apple Iphone Store: Insert 3 New MacBook Neo Items
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
-- Sequential Codes in 1000-series (Continuing after 1299):
--
-- Item 1: Code 1300 -> M.B.N 13. SLV 8/256 GB (Qty: 0, Lot: AIS-1300)
-- Item 2: Code 1301 -> M.B.N 13. CIT 8/256 GB (Qty: 0, Lot: AIS-1301)
-- Item 3: Code 1302 -> M.B.N 13. BLS 8/256 GB (Qty: 0, Lot: AIS-1302)
-- =========================================================================

-- 1. Insert/Update into public.stock
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
VALUES
  (
    '1300', 
    'M.B.N 13. SLV 8/256 GB', 
    'Mac Book', 
    'Mac Book Neo', 
    'Apple', 
    'Apple', 
    'SLV 8/256 GB', 
    'Pcs', 
    0, 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1301', 
    'M.B.N 13. CIT 8/256 GB', 
    'Mac Book', 
    'Mac Book Neo', 
    'Apple', 
    'Apple', 
    'CIT 8/256 GB', 
    'Pcs', 
    0, 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1302', 
    'M.B.N 13. BLS 8/256 GB', 
    'Mac Book', 
    'Mac Book Neo', 
    'Apple', 
    'Apple', 
    'BLS 8/256 GB', 
    'Pcs', 
    0, 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000001'
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

-- 2. Insert/Update FIFO Stock Lots in public.stock_lots
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
VALUES
  (
    'AIS-1300', 
    NULL, 
    '1300', 
    'M.B.N 13. SLV 8/256 GB', 
    CURRENT_DATE::text, 
    'IMPORT', 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'AIS-1301', 
    NULL, 
    '1301', 
    'M.B.N 13. CIT 8/256 GB', 
    CURRENT_DATE::text, 
    'IMPORT', 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'AIS-1302', 
    NULL, 
    '1302', 
    'M.B.N 13. BLS 8/256 GB', 
    CURRENT_DATE::text, 
    'IMPORT', 
    0, 
    0, 
    'a0000000-0000-0000-0000-000000000001'
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

-- 4. Verification query
SELECT id, code, name, category, sub_category, brand, model, qty, store_id 
FROM public.stock 
WHERE code IN ('1300', '1301', '1302');

SELECT id, lot_no, item_code, item_name, qty, store_id 
FROM public.stock_lots 
WHERE lot_no IN ('AIS-1300', 'AIS-1301', 'AIS-1302');
