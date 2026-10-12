-- =========================================================================
-- BM ELECTRONIC: Add 2 New Items (Code 445 & Code 446)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- Items:
--   Code 445 | ELC-445 | Qty: 0 | Fashion Case Cover Iphone 13/ Iphone 14
--   Code 446 | ELC-446 | Qty: 0 | Kulits Cover Iphone 15 Pro Max
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
    '445',
    'Fashion Case Cover Iphone 13/ Iphone 14',
    'Accessory',
    'Cover',
    'Fashion Case',
    'Fashion Case',
    'Iphone 13/ Iphone 14',
    'Pcs',
    0, 0.00, 0.00,
    'a0000000-0000-0000-0000-000000000003'
  ),
  (
    '446',
    'Kulits Cover Iphone 15 Pro Max',
    'Accessory',
    'Cover',
    'Kulits',
    'Kulits',
    'Iphone 15 Pro Max',
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
    'ELC-445', NULL, '445',
    'Fashion Case Cover Iphone 13/ Iphone 14',
    CURRENT_DATE::text, 'IMPORT', 0, 0.00,
    'a0000000-0000-0000-0000-000000000003'
  ),
  (
    'ELC-446', NULL, '446',
    'Kulits Cover Iphone 15 Pro Max',
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

-- Step 4: Verification (Both items should show MATCH)
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
  AND st.code IN ('445', '446')
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty
ORDER BY CAST(st.code AS integer);
