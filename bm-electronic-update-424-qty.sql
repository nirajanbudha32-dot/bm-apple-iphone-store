-- =========================================================================
-- BM ELECTRONIC: Update Qty for Code 424 (Iphone 13 Pro Max 256GB)
-- Store: BM Eletronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
--   Code 424 | Iphone 13 Pro Max 256GB | Qty: 0 -> 1
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- Step 1: Update qty in public.stock
UPDATE public.stock
SET qty        = 1,
    updated_at = NOW()
WHERE code     = '424'
  AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- Step 2: Zero out ALL existing lots for code 424
UPDATE public.stock_lots
SET qty = 0
WHERE item_code = '424'
  AND store_id  = 'a0000000-0000-0000-0000-000000000003';

-- Step 3: Upsert primary lot ELC-424 with qty = 1
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'ELC-424', NULL, '424', 'Iphone 13 Pro Max 256GB',
  CURRENT_DATE::text, 'IMPORT', 1, 0.00,
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

-- Step 5: Verification (SUM all lots to handle old LOT-XXXX records)
SELECT
  s.name                   AS store_name,
  st.code,
  st.name                  AS item_name,
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
  AND st.code = '424'
GROUP BY s.name, st.code, st.name, st.qty;
