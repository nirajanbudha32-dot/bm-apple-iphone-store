-- =========================================================================
-- BM APPLE IPHONE STORE: Fix Code 1297 Lots (Align 25 to 5)
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Why total_active_lots_qty was 25:
-- An older lot existed with 20 pcs, plus the new lot AIS-1297 with 5 pcs (20 + 5 = 25).
-- This script sets the older lot to 0 and keeps AIS-1297 at exactly 5 pcs.
-- =========================================================================

-- 1. Set all older lots for 1297 to qty = 0
WITH ranked_lots AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY store_id, item_code ORDER BY created_at DESC, id DESC) as rn
  FROM public.stock_lots
  WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
    AND item_code = '1297'
)
UPDATE public.stock_lots sl
SET qty = 0
FROM ranked_lots rl
WHERE sl.id = rl.id AND rl.rn > 1;

-- 2. Ensure the active lot AIS-1297 is exactly 5
UPDATE public.stock_lots
SET qty = 5
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND lot_no = 'AIS-1297';

-- 3. Ensure public.stock is 5
UPDATE public.stock
SET qty = 5, updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND code = '1297';

-- 4. Verification Check: Confirm Code 1297 and 1303 now MATCH
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
  AND s.code IN ('1297', '1303')
GROUP BY s.code, s.name, s.qty, s.purchase_price
ORDER BY CAST(s.code AS integer);
