-- =========================================================================
-- BM APPLE IPHONE STORE: Add New Item (Code 1310) + Update Qty (Code 1248)
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Actions:
--   ADD    Code 1310 | AIS-1310 | KARERTE 360 Lens Iphone 18 Pro/18 Pro Max | Qty: 23
--   UPDATE Code 1248 | AIS-1248 | Lighting Cable Mango wala(200)            | Qty: 49
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- PART A: Add New Item Code 1310
-- =========================================================

-- A1: Insert into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES (
  '1310',
  'KARERTE 360 Lens Iphone 18 Pro/18 Pro Max',
  'Accessory',
  'Camera Lens',
  'KARERTE 360',
  'KARERTE 360',
  'Iphone 18 Pro/18 Pro Max',
  'Pcs',
  23, 0.00, 0.00,
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

-- A2: Upsert FIFO Lot for code 1310
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'AIS-1310', NULL, '1310', 'KARERTE 360 Lens Iphone 18 Pro/18 Pro Max',
  CURRENT_DATE::text, 'IMPORT', 23, 0.00,
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

-- =========================================================
-- PART B: Update Qty for Code 1248 (Lighting Cable Mango wala(200))
-- =========================================================

-- B1: Update qty in public.stock
UPDATE public.stock
SET qty        = 49,
    updated_at = NOW()
WHERE code     = '1248'
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- B2: Zero out ALL existing lots for code 1248
UPDATE public.stock_lots SET qty = 0
WHERE item_code = '1248'
  AND store_id  = 'a0000000-0000-0000-0000-000000000001';

-- B3: Upsert primary lot AIS-1248 with qty = 49
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'AIS-1248', NULL, '1248', 'Lighting Cable Mango wala(200)',
  CURRENT_DATE::text, 'IMPORT', 49, 0.00,
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

-- =========================================================
-- STEP: Sync Sequences Safely
-- =========================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- =========================================================
-- VERIFICATION: Both items should show MATCH
-- (SUM used to handle old zeroed lots)
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
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND st.code IN ('1310', '1248')
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty
ORDER BY CAST(st.code AS integer);
