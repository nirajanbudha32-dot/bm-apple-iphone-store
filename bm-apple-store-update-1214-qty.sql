-- =========================================================================
-- BM APPLE IPHONE STORE: Update Item 1214 (Red Glass Iphone 15/16) Quantity to 42
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
-- Lot No: AIS-1214
-- =========================================================================

-- STEP 1: Update public.stock
UPDATE public.stock
SET 
  qty = 42,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND code = '1214';

-- STEP 2: Normalize and update public.stock_lots
-- 2a. Zero out any older duplicate lots if present (protects historical sales allocations)
WITH ranked_lots AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
    AND item_code = '1214'
)
UPDATE public.stock_lots sl
SET qty = 0
FROM ranked_lots rl
WHERE sl.id = rl.id AND rl.rn > 1;

-- 2b. Upsert the active lot AIS-1214 to qty = 42
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'AIS-1214', NULL, '1214', 'Red Glass Iphone 15/16', CURRENT_DATE::text, 'IMPORT', 42, 0.00, 'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  qty = 42,
  item_code = '1214',
  item_name = 'Red Glass Iphone 15/16',
  store_id = 'a0000000-0000-0000-0000-000000000001';

-- STEP 3: Verification Query (Ensures 100% MATCH across stock & stock_lots)
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
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND s.code = '1214'
GROUP BY s.code, s.name, s.qty, s.purchase_price;
