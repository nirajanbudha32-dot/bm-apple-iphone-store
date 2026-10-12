-- =========================================================================
-- BM ELECTRONIC: Update Code 132 (Fashion Case Cover Iphone 13 Pro) Qty 0 -> 2
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Lot: ELC-132
--
-- Details:
--   Item Code: 132
--   Item Name: Fashion Case Cover Iphone 13 Pro
--   Category:  ASSERICESS
--   Sub-Cat:   Cover
--   Brand:     Fashion Case
--   Model:     Iphone 13 Pro
--   Unit:      Pcs
--   Qty:       2 (updated from 0)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  qty = 2,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '132';

-- 2. Upsert FIFO Stock Lot in public.stock_lots
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-132', NULL, '132', 'Fashion Case Cover Iphone 13 Pro',
  CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  qty = EXCLUDED.qty,
  store_id = EXCLUDED.store_id;

-- 3. Zero out any secondary lots if any exist for code 132
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND item_code = '132'
  AND lot_no != 'ELC-132';

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
  AND sl.lot_no = 'ELC-132'
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code = '132';
