-- =========================================================================
-- BM ELECTRONIC: Add New Item (Code 443) + Update Qty for 3 Items (427, 395, 418)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Actions:
--   UPDATE Code 427 | Iphone 11 64 GB    | Lot: ELC-427 | Qty: 1
--   ADD    Code 443 | Iphone XR 128GB    | Lot: ELC-443 | Qty: 3 (NEW ITEM)
--   UPDATE Code 395 | Iphone 13 128 GB   | Lot: ELC-395 | Qty: 7
--   UPDATE Code 418 | Iphone 16 Pro Max  | Lot: ELC-418 | Qty: 1
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- STEP 1: Add New Item Code 443 (Iphone XR 128GB)
-- =========================================================
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES (
  '443',
  'Iphone XR 128GB',
  'Old Iphone',
  'Iphone',
  'Apple',
  'Apple',
  'Iphone XR 128 GB',
  'Pcs',
  3, 0.00, 0.00,
  'a0000000-0000-0000-0000-000000000003'
)
ON CONFLICT (code) DO UPDATE SET
  name           = EXCLUDED.name,
  category       = EXCLUDED.category,
  sub_category   = EXCLUDED.sub_category,
  brand          = EXCLUDED.brand,
  sub_brand      = EXCLUDED.sub_brand,
  model          = EXCLUDED.model,
  unit           = EXCLUDED.unit,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  selling_price  = EXCLUDED.selling_price,
  store_id       = EXCLUDED.store_id,
  updated_at     = NOW();

-- =========================================================
-- STEP 2: Update Quantities for Existing Items (427, 395, 418)
-- =========================================================
UPDATE public.stock SET qty = 1, updated_at = NOW()
WHERE code = '427' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 7, updated_at = NOW()
WHERE code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';

UPDATE public.stock SET qty = 1, updated_at = NOW()
WHERE code = '418' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 3: Zero out ALL existing lots for these 4 items
-- =========================================================
UPDATE public.stock_lots SET qty = 0
WHERE item_code IN ('427', '443', '395', '418')
  AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- =========================================================
-- STEP 4: Upsert FIFO lots with correct quantities
-- =========================================================
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  ('ELC-427', NULL, '427', 'Iphone 11 64 GB',   CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-443', NULL, '443', 'Iphone XR 128GB',   CURRENT_DATE::text, 'IMPORT', 3, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-395', NULL, '395', 'Iphone 13 128 GB',  CURRENT_DATE::text, 'IMPORT', 7, 0.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-418', NULL, '418', 'Iphone 16 Pro Max', CURRENT_DATE::text, 'IMPORT', 1, 0.00, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (lot_no) DO UPDATE SET
  item_code      = EXCLUDED.item_code,
  item_name      = EXCLUDED.item_name,
  date           = EXCLUDED.date,
  supplier       = EXCLUDED.supplier,
  qty            = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id       = EXCLUDED.store_id;

-- =========================================================
-- STEP 5: Sync Sequences Safely
-- =========================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================
-- STEP 6: Verification Query (All 4 items should show MATCH)
-- =========================================================
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
  AND st.code IN ('427', '443', '395', '418')
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty
ORDER BY CAST(st.code AS integer);
