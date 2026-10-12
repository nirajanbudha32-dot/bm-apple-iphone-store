-- =========================================================================
-- BM ELECTRONIC: Update Code 395 (Iphone 13 128 GB) Qty from 1 to 5
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Lot:   ELC-395
--
-- Item Details:
--   Code:         395
--   Name:         Iphone 13 128 GB
--   Category:     old iphone
--   Sub-Category: Iphone
--   Brand:        Apple
--   Model:        Iphone 13 128 GB
--   Unit:         Pcs
--   Qty:          5 (updated from 1 to 5)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- Step 1: Update public.stock
UPDATE public.stock
SET
  qty        = 5,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code     = '395';

-- Step 2: Zero out any secondary lots for code 395
UPDATE public.stock_lots
SET qty = 0
WHERE store_id  = 'a0000000-0000-0000-0000-000000000003'
  AND item_code = '395'
  AND lot_no   != 'ELC-395';

-- Step 3: Upsert primary FIFO Stock Lot with qty = 5
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-395', NULL, '395', 'Iphone 13 128 GB',
  CURRENT_DATE::text, 'IMPORT', 5, 46000.00,
  'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- Step 4: Sync Sequences Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- Step 5: Verification (Confirms status = 'MATCH' with qty = 5)
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
  st.category,
  st.sub_category,
  st.brand,
  st.model,
  st.unit,
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code = '395'
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty;
