-- =========================================================================
-- Remove Accidental Duplicate Run for "Iphone 11 (64)GB"
-- Removes:
--   - Code 1305 & Lot AIS-1305 (from BM Apple Iphone Store)
--   - Code 2293 & Lot IPH-2293 (from BM Iphone Store)
--
-- Keeps the first run:
--   - Code 1304 & Lot AIS-1304 (BM Apple Iphone Store, Qty: 2)
--   - Code 2292 & Lot IPH-2292 (BM Iphone Store, Qty: 1)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- 1. Remove duplicate stock lots (and any allocations if any exist)
DELETE FROM public.sale_lot_allocations 
WHERE lot_id IN (
  SELECT id FROM public.stock_lots 
  WHERE lot_no IN ('AIS-1305', 'IPH-2293') 
     OR item_code IN ('1305', '2293')
);

DELETE FROM public.stock_lots 
WHERE lot_no IN ('AIS-1305', 'IPH-2293') 
   OR item_code IN ('1305', '2293');

-- 2. Remove duplicate stock items
DELETE FROM public.stock 
WHERE code IN ('1305', '2293');

-- 3. Reset sequences back to highest valid numbers
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^[0-9]+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- 4. Verification Check: Confirm only 1 item per store remains
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
  sl.qty AS lot_qty
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl ON sl.item_code = st.code AND sl.store_id = st.store_id
WHERE st.name = 'Iphone 11 (64)GB'
ORDER BY st.store_id, st.code;
