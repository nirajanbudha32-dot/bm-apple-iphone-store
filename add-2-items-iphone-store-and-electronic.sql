-- =========================================================================
-- ADD 2 NEW ITEMS TO 2 STORES:
--   1. "Zone Type C to Lighting 35W Super Fast Charger Cable 1M"
--      -> BM Iphone Store (Code: 2293, Lot: IPH-2293, Qty: 3)
--   2. "Red Glass Iphone 17 Pro Max"
--      -> BM Electronic   (Code: 433, Lot: ELC-433, Qty: 4)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================================
-- PART 1: BM Iphone Store — Add "Zone Type C to Lighting 35W Super Fast Charger Cable 1M"
-- Store ID: a0000000-0000-0000-0000-000000000002 | Code: 2293 | Lot: IPH-2293 | Qty: 3
-- =========================================================================

-- 1a. Insert into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES (
  '2293',
  'Zone Type C to Lighting 35W Super Fast Charger Cable 1M',
  'ASSERICESS',
  'Charger',
  'Zone',
  'Zone',
  '35W Super Fast Charger Cable 1M',
  'Pcs',
  3,
  0.00,
  0.00,
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
  store_id = EXCLUDED.store_id,
  updated_at = NOW();

-- 1b. Upsert FIFO Stock Lot
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'IPH-2293', NULL, '2293', 'Zone Type C to Lighting 35W Super Fast Charger Cable 1M',
  CURRENT_DATE::text, 'IMPORT', 3, 0.00, 'a0000000-0000-0000-0000-000000000002'
)
ON CONFLICT (lot_no) DO UPDATE SET
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id = EXCLUDED.store_id;

-- =========================================================================
-- PART 2: BM Electronic — Add "Red Glass Iphone 17 Pro Max"
-- Store ID: a0000000-0000-0000-0000-000000000003 | Code: 433 | Lot: ELC-433 | Qty: 4
-- =========================================================================

-- 2a. Insert into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES (
  '433',
  'Red Glass Iphone 17 Pro Max',
  'ASSERICESS',
  'Glass',
  'Red Glass',
  'Red Glass',
  'Iphone 17 Pro Max',
  'Pcs',
  4,
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

-- 2b. Upsert FIFO Stock Lot
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-433', NULL, '433', 'Red Glass Iphone 17 Pro Max',
  CURRENT_DATE::text, 'IMPORT', 4, 0.00, 'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id = EXCLUDED.store_id;

-- =========================================================================
-- PART 3: Sync Sequences
-- =========================================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================================
-- PART 4: Verification
-- =========================================================================
SELECT 
  s.name AS store_name,
  st.code,
  st.name AS item_name,
  st.category,
  st.sub_category,
  st.brand,
  st.model,
  st.unit,
  st.qty AS stock_qty,
  sl.lot_no,
  COALESCE(sl.qty, 0) AS lot_qty,
  CASE 
    WHEN st.qty = COALESCE(sl.qty, 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl 
  ON sl.item_code = st.code 
  AND sl.store_id = st.store_id
WHERE (st.store_id = 'a0000000-0000-0000-0000-000000000002' AND st.code = '2293')
   OR (st.store_id = 'a0000000-0000-0000-0000-000000000003' AND st.code = '433')
ORDER BY st.store_id, st.code;
