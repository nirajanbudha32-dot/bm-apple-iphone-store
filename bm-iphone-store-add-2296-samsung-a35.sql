-- =========================================================================
-- MOVE ITEM TO BM IPHONE STORE: Samsung A35 (Code 2296)
--
-- 1. Remove accidental Code 1311 from BM Apple Iphone Store
-- 2. Add Samsung A35 as Code 2296 to BM Iphone Store
--    Store ID: a0000000-0000-0000-0000-000000000002
--    Code:     2296 (Next sequential code after 2295)
--    Lot No:   IPH-2296 (Qty: 1)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- STEP 1: Remove accidental Code 1311 from BM Apple Iphone Store
DELETE FROM public.stock_lots
WHERE lot_no = 'AIS-1311'
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

DELETE FROM public.stock
WHERE code = '1311'
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- STEP 2: Insert into public.stock for BM Iphone Store
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES (
  '2296',
  'Samsung A35',
  'Phone',
  'Samsung',
  'Samsung',
  'Samsung',
  'A35',
  'Pcs',
  1, 0.00, 0.00,
  'a0000000-0000-0000-0000-000000000002'
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

-- STEP 3: Upsert FIFO Lot for BM Iphone Store
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'IPH-2296', NULL, '2296', 'Samsung A35',
  CURRENT_DATE::text, 'IMPORT', 1, 0.00,
  'a0000000-0000-0000-0000-000000000002'
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

-- STEP 5: Verification Query for BM Iphone Store
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000002'
  AND st.code = '2296'
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty;
