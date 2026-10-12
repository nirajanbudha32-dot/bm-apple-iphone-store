-- =========================================================================
-- BM IPHONE STORE: Update Item 2279 (Iphone 12 64 GB) Quantity from 0 to 1
-- Store: BM Iphone Store (Store ID: a0000000-0000-0000-0000-000000000002)
-- Lot No: IPH-2279
-- =========================================================================

-- STEP 1: Update public.stock
UPDATE public.stock
SET 
  qty = 1,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000002'
  AND code = '2279';

-- STEP 2: Normalize and update public.stock_lots
-- 2a. Zero out any older duplicate lots if present (protects historical sales allocations)
WITH ranked_lots AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000002'
    AND item_code = '2279'
)
UPDATE public.stock_lots sl
SET qty = 0
FROM ranked_lots rl
WHERE sl.id = rl.id AND rl.rn > 1;

-- 2b. Upsert the active lot IPH-2279 to qty = 1
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'IPH-2279', NULL, '2279', 'Iphone 12 64 GB', CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000002'
)
ON CONFLICT (lot_no) DO UPDATE SET 
  qty = 1,
  item_code = '2279',
  store_id = 'a0000000-0000-0000-0000-000000000002';

-- STEP 3: Verification Query
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
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000002'
  AND s.code = '2279'
GROUP BY s.code, s.name, s.qty, s.purchase_price;
