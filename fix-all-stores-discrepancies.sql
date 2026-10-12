-- =========================================================================
-- COMPLETE AUDIT RESOLUTION: Fix All 9 Remaining Mismatches Across All Stores
--
-- Breakdown of the 9 items:
-- 1 & 2. BM Apple Store (1223, 1225): Align stock to real lot counts (54, 2)
-- 3 & 4. BM Electronic (79, 80): Reset from 9 to actual lots (7 and 2)
-- 5 & 6. BM Electronic (201, 233): Reset from inflated numbers back to 0 (Code 200 has the 6, Code 232 has the 2)
-- 7 & 8. BM Electronic (2288, 2289): 2000-series codes in BM Electronic with 0 lots -> set qty to 0 (or create lot if physical stock exists)
-- 9.     BM Iphone Store (2141): Sync lot for Iphone 15(128)GB with qty 1
-- =========================================================================

-- 1. BM Apple Iphone Store: Align stock table to real lots
UPDATE public.stock 
SET qty = 54, updated_at = NOW() 
WHERE code = '1223' AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock 
SET qty = 2, updated_at = NOW() 
WHERE code = '1225' AND store_id = 'a0000000-0000-0000-0000-000000000001';


-- 2. BM Electronic: Reset duplicate-name collisions (79, 80, 201, 233)
UPDATE public.stock 
SET qty = 7, updated_at = NOW() 
WHERE code = '79' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock 
SET qty = 2, updated_at = NOW() 
WHERE code = '80' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- Code 201 was inflated by Code 200 (Magic Box Glass). Code 200 holds the 6 pcs.
UPDATE public.stock 
SET qty = 0, updated_at = NOW() 
WHERE code = '201' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- Code 233 was inflated by Code 232 (MI Earphone). Code 232 holds the 2 pcs.
UPDATE public.stock 
SET qty = 0, updated_at = NOW() 
WHERE code = '233' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- Code 2288 was moved to Code 426 in BM Electronic; sync stock table to 0 lots
UPDATE public.stock 
SET qty = 0, updated_at = NOW() 
WHERE code = '2288' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- Code 2289 (Iphone 15 Pro Max 256GB in BM Electronic): Ensure lot exists with qty 1
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-2289', NULL, '2289', 'Iphone 15 Pro Max (256) GB', CURRENT_DATE::text, 'IMPORT', 1, 0, 'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  qty = 1, item_code = '2289', store_id = 'a0000000-0000-0000-0000-000000000003';


-- 3. BM Iphone Store: Ensure lot exists for Code 2141 (Iphone 15 128GB) with qty 1
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'IPH-2141', NULL, '2141', 'Iphone 15(128)GB', CURRENT_DATE::text, 'IMPORT', 1, 0, 'a0000000-0000-0000-0000-000000000002'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  qty = 1, item_code = '2141', store_id = 'a0000000-0000-0000-0000-000000000002';


-- 4. Verification Check: Should return 0 rows (all stores 100% clean)
SELECT 
  st.name AS store_name,
  s.code,
  s.name AS item_name,
  s.qty AS stock_qty,
  COALESCE(SUM(l.qty), 0) AS lots_qty,
  COUNT(CASE WHEN l.qty > 0 THEN 1 END) AS active_lots_count
FROM public.stock s
JOIN public.stores st ON s.store_id = st.id
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
GROUP BY st.name, s.code, s.name, s.qty
HAVING s.qty != COALESCE(SUM(l.qty), 0)
ORDER BY st.name, CAST(NULLIF(regexp_replace(s.code, '\D', '', 'g'), '') AS integer);
