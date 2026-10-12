-- =========================================================================
-- BM ELECTRONIC: Update Code 395 (Iphone 13 128 GB) Qty to 3
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Lot: ELC-395
--
-- Details:
--   Item Code:      395
--   Item Name:      Iphone 13 128 GB
--   Category:       old iphone
--   Sub-Category:   Iphone
--   Brand:          Apple
--   Model:          Iphone 13 128 GB
--   Unit:           Pcs
--   Qty:            3 (updated to 3)
--   Purchase Price: 46,000.00
--   Selling Price:  0.00
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  qty = 3,
  purchase_price = 46000.00,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '395';

-- 2. Upsert primary FIFO Stock Lot in public.stock_lots
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-395', NULL, '395', 'Iphone 13 128 GB',
  CURRENT_DATE::text, 'IMPORT', 3, 46000.00, 'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id = EXCLUDED.store_id;

-- 3. Zero out any secondary lots if any exist for code 395
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND item_code = '395'
  AND lot_no != 'ELC-395';

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
  st.purchase_price,
  CASE 
    WHEN st.qty = COALESCE(sl.qty, 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl 
  ON sl.item_code = st.code 
  AND sl.store_id = st.store_id
  AND sl.lot_no = 'ELC-395'
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code = '395';
