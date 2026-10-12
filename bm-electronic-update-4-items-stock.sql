-- =========================================================================
-- BM ELECTRONIC: Update Stock Qty & Purchase Prices for 4 Items
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items Specification:
-- 1. Code 393 | Iphone 12 128 GB      | Qty: 1 | Price: 35,000.00
-- 2. Code 395 | Iphone 13 128 GB      | Qty: 4 | Price: 46,000.00 (Updated 3 -> 4)
-- 3. Code 399 | Iphone 14 Plus 128 GB | Qty: 1 | Price: 55,000.00 (Updated 3 -> 1)
-- 4. Code 427 | Iphone 11 64 GB       | Qty: 1 | Price: 26,500.00 (Price set to 26,500)
-- =========================================================================

-- STEP 1: Update public.stock
UPDATE public.stock SET qty = 1, purchase_price = 35000.00, updated_at = NOW() WHERE code = '393' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 4, purchase_price = 46000.00, updated_at = NOW() WHERE code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 55000.00, updated_at = NOW() WHERE code = '399' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 26500.00, updated_at = NOW() WHERE code = '427' AND store_id = 'a0000000-0000-0000-0000-000000000003';


-- STEP 2: Normalize FIFO Stock Lots in public.stock_lots
-- 2a. Set any older duplicate lots for these codes to 0 (protects past sales allocations)
WITH ranked_lots AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
    AND item_code IN ('393', '395', '399', '427')
)
UPDATE public.stock_lots sl
SET qty = 0
FROM ranked_lots rl
WHERE sl.id = rl.id AND rl.rn > 1;

-- 2b. Set the active lot to the exact quantity and price
WITH newest_lots AS (
  SELECT 
    id,
    item_code,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
    AND item_code IN ('393', '395', '399', '427')
)
UPDATE public.stock_lots sl
SET 
  qty = CASE 
    WHEN nl.item_code = '393' THEN 1
    WHEN nl.item_code = '395' THEN 4
    WHEN nl.item_code = '399' THEN 1
    WHEN nl.item_code = '427' THEN 1
    ELSE sl.qty
  END,
  purchase_price = CASE
    WHEN nl.item_code = '393' THEN 35000.00
    WHEN nl.item_code = '395' THEN 46000.00
    WHEN nl.item_code = '399' THEN 55000.00
    WHEN nl.item_code = '427' THEN 26500.00
    ELSE sl.purchase_price
  END
FROM newest_lots nl
WHERE sl.id = nl.id AND nl.rn = 1;

-- 2c. Ensure lot for Code 427 exists
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-427', NULL, '427', 'Iphone 11 64 GB', CURRENT_DATE::text, 'IMPORT', 1, 26500.00, 'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  qty = 1, purchase_price = 26500.00, item_code = '427', store_id = 'a0000000-0000-0000-0000-000000000003';


-- STEP 3: Verification - Confirm 100% MATCH across both tables
SELECT 
  s.code,
  s.name,
  s.qty AS stock_qty,
  COALESCE(SUM(l.qty), 0) AS total_active_lots_qty,
  s.purchase_price,
  CASE 
    WHEN s.qty = COALESCE(SUM(l.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock s
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND s.code IN ('393', '395', '399', '427')
GROUP BY s.code, s.name, s.qty, s.purchase_price
ORDER BY CAST(s.code AS integer);
