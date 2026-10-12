-- =========================================================================
-- BM ELECTRONIC: Update Code 433 — Fix Name, Model, and Qty
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Changes:
--   Name:  "Red Glass Iphone 17 Pro Max"  ->  "Red Glass Iphone 13 Pro Max"
--   Model: "Iphone 17 Pro Max"            ->  "Iphone 13 Pro Max"
--   Qty:   4                              ->  3
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  name = 'Red Glass Iphone 13 Pro Max',
  model = 'Iphone 13 Pro Max',
  qty = 3,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '433';

-- 2. Update public.stock_lots
UPDATE public.stock_lots
SET 
  item_name = 'Red Glass Iphone 13 Pro Max',
  qty = 3
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '433' OR lot_no = 'ELC-433');

-- 3. Verification
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
  AND st.code = '433';
