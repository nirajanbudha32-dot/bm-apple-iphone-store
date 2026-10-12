-- =========================================================================
-- BM ELECTRONIC: Update Qty for 4 Items
-- Store: BM Eletronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items Updated:
--   Code 405 | Iphone 12 64 GB    | Qty -> 2
--   Code 395 | Iphone 13 128 GB   | Qty -> 5
--   Code 423 | Iphone 13 256GB    | Qty -> 1
--   Code 403 | Iphone 15 128 GB   | Qty -> 3
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Update qty in public.stock
-- =========================================================
UPDATE public.stock SET qty = 2, updated_at = NOW()
WHERE code = '405' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 5, updated_at = NOW()
WHERE code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 1, updated_at = NOW()
WHERE code = '423' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 3, updated_at = NOW()
WHERE code = '403' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 2: Zero out ALL existing lots for these 4 items
-- =========================================================
UPDATE public.stock_lots SET qty = 0
WHERE item_code IN ('405','395','423','403')
  AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 3: Upsert FIFO lots with correct quantities
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  ('ELC-405', NULL, '405', 'Iphone 12 64 GB',  CURRENT_DATE::text, 'IMPORT', 2, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-395', NULL, '395', 'Iphone 13 128 GB', CURRENT_DATE::text, 'IMPORT', 5, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-423', NULL, '423', 'Iphone 13 256GB',  CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-403', NULL, '403', 'Iphone 15 128 GB', CURRENT_DATE::text, 'IMPORT', 3, 0.00, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- =========================================================
-- STEP 4: Sync Sequences Safely
-- =========================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================
-- STEP 5: Verification (SUM all lots to handle old LOT-XXXX)
-- All 4 items should show MATCH
-- =========================================================
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
  AND st.code IN ('405','395','423','403')
GROUP BY s.name, st.code, st.name, st.qty
ORDER BY CAST(st.code AS integer);
