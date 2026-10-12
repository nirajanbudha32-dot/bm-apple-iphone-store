-- =========================================================================
-- BM ELECTRONIC: 
--   1. Add New Item: "Red Glass Iphone 15/16" (Code: 429, Lot: ELC-429, Qty: 0)
--   2. Update Item:  "Red Glass Iphone 13"    (Code: 291, Lot: ELC-291, Qty: 11 -> 0)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================================
-- PART 1: Add New Item (Code 429) into public.stock and public.stock_lots
-- =========================================================================

-- 1a. Insert/Update Item into public.stock
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
  '429',
  'Red Glass Iphone 15/16',
  'ASSERICESS',
  'Glass',
  'Red Glass',
  'Red Glass',
  'Iphone 15/16',
  'Pcs',
  0,
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

-- 1b. Upsert FIFO Stock Lot into public.stock_lots
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
  'ELC-429',
  NULL,
  '429',
  'Red Glass Iphone 15/16',
  CURRENT_DATE::text,
  'IMPORT',
  0,
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

-- =========================================================================
-- PART 2: Update Code 291 (Red Glass Iphone 13) Quantity from 11 to 0
-- =========================================================================

-- 2a. Update public.stock
UPDATE public.stock
SET 
  qty = 0,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '291';

-- 2b. Update public.stock_lots
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '291' OR lot_no = 'ELC-291');

-- =========================================================================
-- PART 3: Sync Sequence Generators safely
-- =========================================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================================
-- PART 4: Verification Query (Check both items across stock & stock_lots)
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN ('291', '429')
ORDER BY st.code;
