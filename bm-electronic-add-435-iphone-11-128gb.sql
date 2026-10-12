-- =========================================================================
-- BM ELECTRONIC: Add New Item "Iphone 11 128 GB" (Code 435)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Code: 435 | Lot: ELC-435 | Qty: 1
--
-- Details from Sheet:
--   Item Code:    435 (Next sequential code after 434)
--   Item Name:    Iphone 11 128 GB
--   Category:     Old Iphone
--   Sub-Category: Iphone
--   Brand:        Apple
--   Sub-Brand:    Apple
--   Model:        Iphone 11 128 GB
--   Unit:         Pcs
--   Qty:          1
--
-- Run this in your Supabase SQL Editor.
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
  '435',
  'Iphone 11 128 GB',
  'Old Iphone',
  'Iphone',
  'Apple',
  'Apple',
  'Iphone 11 128 GB',
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
  'ELC-435',
  NULL,
  '435',
  'Iphone 11 128 GB',
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

-- 3. Sync Sequence Generators Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- 4. Verification Check
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
  AND st.code = '435';
