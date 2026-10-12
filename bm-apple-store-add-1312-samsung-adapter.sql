-- =========================================================================
-- BM APPLE IPHONE STORE: Add New Item "Samsung 45 W PD Adapter" (Code 1312)
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Item Details:
--   Code:         1312  (Next sequential code for BM Apple Iphone Store)
--   Name:         Samsung 45 W PD Adapter
--   Category:     Accessory
--   Sub-Category: Adapter
--   Brand:        Samsung
--   Sub-Brand:    Samsung
--   Model:        Samsung
--   Unit:         Pcs
--   Qty:          2
--   Lot No:       AIS-1312 (Qty: 2)
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- Step 1: Insert into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES (
  '1312',
  'Samsung 45 W PD Adapter',
  'Accessory',
  'Adapter',
  'Samsung',
  'Samsung',
  'Samsung',
  'Pcs',
  2, 0.00, 0.00,
  'a0000000-0000-0000-0000-000000000001'
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

-- Step 2: Upsert FIFO Stock Lot
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'AIS-1312', NULL, '1312', 'Samsung 45 W PD Adapter',
  CURRENT_DATE::text, 'IMPORT', 2, 0.00,
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

-- Step 3: Sync Sequences Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- Step 4: Verification (should show MATCH)
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND st.code = '1312'
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty;
