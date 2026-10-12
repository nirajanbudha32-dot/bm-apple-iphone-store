-- =========================================================================
-- BM APPLE IPHONE STORE: Update Code 1285 (Old Iphone 13) Quantity from 0 to 1
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
-- Lot:   AIS-1285
--
-- Item Details:
--   Item Code:    1285
--   Item Name:    Old Iphone 13
--   Category:     Old Iphone
--   Sub-Category: Iphone
--   Brand:        Apple
--   Model:        Iphone 13
--   Target Qty:   1 (updated from 0 to 1)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- STEP 1: Update public.stock
UPDATE public.stock
SET
  qty        = 1,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND code     = '1285';

-- STEP 2: Zero out any secondary lots for code 1285
UPDATE public.stock_lots
SET qty = 0
WHERE store_id  = 'a0000000-0000-0000-0000-000000000001'
  AND item_code = '1285'
  AND lot_no   != 'AIS-1285';

-- STEP 3: Upsert primary FIFO lot AIS-1285 with qty = 1
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'AIS-1285', NULL, '1285', 'Old Iphone 13',
  CURRENT_DATE::text, 'IMPORT', 1, 0.00,
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- STEP 4: Sync Sequences Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- STEP 5: Verification Check (Confirms status = 'MATCH' with qty = 1)
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
  st.category,
  st.sub_category,
  st.brand,
  st.model,
  st.qty                   AS stock_qty,
  COALESCE(SUM(sl.qty), 0) AS total_lot_qty,
  CASE
    WHEN st.qty = COALESCE(SUM(sl.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END                      AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl
  ON  sl.item_code = st.code
  AND sl.store_id  = st.store_id
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND st.code = '1285'
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.qty;
