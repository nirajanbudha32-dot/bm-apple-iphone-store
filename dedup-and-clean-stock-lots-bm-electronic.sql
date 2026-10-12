-- =========================================================================
-- BM ELECTRONIC: Safe Zero-Delete Lot Quantity Normalization
--
-- Why the previous DELETE failed:
-- Foreign key constraint "sale_lot_allocations_lot_id_fkey" protects past sales!
-- Some of those older lots are linked to real past sales invoices.
--
-- THE CORRECT FIX:
-- In an inventory system, sold-out / exhausted lots must have QTY = 0.
-- We DO NOT delete them; we simply set older/exhausted lots to QTY = 0,
-- and set the current active lot to the exact required stock quantity!
-- =========================================================================

-- 1. Set all older / past lots to QTY = 0 (marks them as sold/exhausted)
WITH ranked_lots AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
    AND item_code IN ('391', '395', '399', '414')
)
UPDATE public.stock_lots sl
SET qty = 0
FROM ranked_lots rl
WHERE sl.id = rl.id AND rl.rn > 1;

-- 2. Set the single newest active lot to the exact required quantity
WITH newest_lots AS (
  SELECT 
    id,
    item_code,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
    AND item_code IN ('391', '395', '399', '414')
)
UPDATE public.stock_lots sl
SET 
  qty = CASE 
    WHEN nl.item_code = '391' THEN 2
    WHEN nl.item_code = '395' THEN 3
    WHEN nl.item_code = '399' THEN 3
    WHEN nl.item_code = '414' THEN 1
    ELSE sl.qty
  END,
  purchase_price = CASE
    WHEN nl.item_code = '391' THEN 45250.00
    WHEN nl.item_code = '395' THEN 46000.00
    WHEN nl.item_code = '399' THEN 55000.00
    WHEN nl.item_code = '414' THEN 7000.00
    ELSE sl.purchase_price
  END
FROM newest_lots nl
WHERE sl.id = nl.id AND nl.rn = 1;

-- 3. Ensure public.stock has the exact intended quantities
UPDATE public.stock SET qty = 2, purchase_price = 45250.00, updated_at = NOW() WHERE code = '391' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 46000.00, updated_at = NOW() WHERE code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 55000.00, updated_at = NOW() WHERE code = '399' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 7000.00,  updated_at = NOW() WHERE code = '414' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- 4. Verification: Check total active lot qty vs stock qty
SELECT 
  s.code,
  s.name,
  s.qty AS stock_qty,
  COALESCE(SUM(l.qty), 0) AS total_active_lots_qty,
  COUNT(CASE WHEN l.qty > 0 THEN 1 END) AS active_lots_count,
  CASE 
    WHEN s.qty = COALESCE(SUM(l.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock s
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND s.code IN ('391','392','394','395','423','397','424','398','399','401','402','403','404','414')
GROUP BY s.code, s.name, s.qty
ORDER BY CAST(s.code AS integer);
