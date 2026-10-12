-- =========================================================================
-- BM ELECTRONIC: Update Item Code 393 Qty 0 -> 2
-- Store: BM Eletronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Item Details (from sheet):
--   Code:         393
--   Name:         Iphone 12 128 GB
--   Category:     old iphone
--   Sub-Category: Iphone
--   Brand:        Apple
--   Model:        Iphone 12 128 GB
--   Unit:         Pcs
--   Qty:          2  (was 0)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- Step 1: Update qty in public.stock (0 -> 2)
UPDATE public.stock
SET
  qty        = 2,
  updated_at = NOW()
WHERE code     = '393'
  AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- Step 2: Zero out ALL existing lots for code 393 (prevent MISMATCH)
UPDATE public.stock_lots
SET qty = 0
WHERE item_code = '393'
  AND store_id  = 'a0000000-0000-0000-0000-000000000003';

-- Step 3: Upsert the primary lot ELC-393 with qty = 2
INSERT INTO public.stock_lots (
  lot_no,
  purchase_id,
  item_code,
  item_name,
  date,
  supplier,
  qty,
  purchase_price,
  store_id
)
VALUES (
  'ELC-393',
  NULL,
  '393',
  'Iphone 12 128 GB',
  CURRENT_DATE::text,
  'IMPORT',
  2,
  0.00,
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

-- Step 4: Sync Sequence Generators Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- Step 5: Verification Check (should show MATCH)
SELECT
  s.name  AS store_name,
  st.code,
  st.name AS item_name,
  st.category,
  st.sub_category,
  st.brand,
  st.model,
  st.unit,
  st.qty  AS stock_qty,
  sl.lot_no,
  COALESCE(sl.qty, 0) AS lot_qty,
  CASE
    WHEN st.qty = COALESCE(sl.qty, 0) THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END AS status
FROM public.stock st
JOIN public.stores s  ON s.id = st.store_id
LEFT JOIN public.stock_lots sl
  ON  sl.item_code = st.code
  AND sl.store_id  = st.store_id
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code     = '393'
ORDER BY sl.lot_no;
