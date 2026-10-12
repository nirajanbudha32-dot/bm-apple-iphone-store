-- =========================================================================
-- BM ELECTRONIC: Update Qty for Code 395 (Qty: 2) and Code 398 (Qty: 3)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items Summary:
--  1. Code 395 | Iphone 13 128 GB | Qty: 2 (updated from 1) | Lot: ELC-395
--  2. Code 398 | Iphone 14 128 Gb | Qty: 3                 | Lot: ELC-398
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  qty = CASE code
    WHEN '395' THEN 2
    WHEN '398' THEN 3
  END,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code IN ('395', '398');

-- 2. Upsert primary FIFO Stock Lots in public.stock_lots
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES 
  ('ELC-395', NULL, '395', 'Iphone 13 128 GB', CURRENT_DATE::text, 'IMPORT', 2, 46000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-398', NULL, '398', 'Iphone 14 128 Gb', CURRENT_DATE::text, 'IMPORT', 3, 46250.00, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (lot_no) DO UPDATE SET
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  qty = EXCLUDED.qty,
  store_id = EXCLUDED.store_id;

-- 3. Zero out any secondary / non-standard lots if any exist
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND item_code IN ('395', '398')
  AND lot_no NOT IN ('ELC-395', 'ELC-398');

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
  AND sl.lot_no IN ('ELC-395', 'ELC-398')
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN ('395', '398')
ORDER BY CAST(st.code AS integer);
