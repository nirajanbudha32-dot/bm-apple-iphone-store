-- =========================================================================
-- BM ELECTRONIC: Add 2 New Items (Qty: 0)
-- Store: BM Eletronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items:
--   Code 438 | ELC-438 | Qty: 0 | Nothing Adapter
--   Code 439 | ELC-439 | Qty: 0 | Iphone 16 Pro Max
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- Step 1: Insert into public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit,
  qty, purchase_price, selling_price, store_id
)
VALUES
  (
    '438',
    'Nothing Adapter',
    'Accessory',
    'Adapter',
    'Nothing',
    'Nothing',
    'Nothing',
    'Pcs',
    0, 0.00, 0.00,
    'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '439',
    'Iphone 16 Pro Max',
    'Old Iphone',
    'Iphone',
    'Apple',
    'Apple',
    'Iphone 16 Pro Max',
    'Pcs',
    0, 0.00, 0.00,
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

-- Step 2: Upsert FIFO Stock Lots
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES
  (
    'ELC-438', NULL, '438', 'Nothing Adapter',
    CURRENT_DATE::text, 'IMPORT', 0, 0.00,
    'a0000000-0000-0000-0000-000000000003'
  ),
  (
    'ELC-439', NULL, '439', 'Iphone 16 Pro Max',
    CURRENT_DATE::text, 'IMPORT', 0, 0.00,
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

-- Step 3: Sync Sequences Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- Step 4: Verification
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
    WHEN st.qty = COALESCE(sl.qty, 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl
  ON  sl.item_code = st.code
  AND sl.store_id  = st.store_id
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN ('438', '439')
ORDER BY CAST(st.code AS integer);
