-- =========================================================================
-- BM APPLE IPHONE STORE: Update Qty for Code 1253 (Silicon Case Cover Iphone XR)
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Target:
--   Code 1253 | Silicon Case Cover Iphone XR | Lot: AIS-1253 | Qty: 4
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- Step 1: Update qty in public.stock
UPDATE public.stock
SET qty            = 4,
    name           = 'Silicon Case Cover Iphone XR',
    category       = 'Accessory',
    sub_category   = 'Cover',
    brand          = 'Silicon Case',
    sub_brand      = 'Silicon Case',
    model          = 'Iphone XR',
    unit           = 'Pcs',
    updated_at     = NOW()
WHERE code     = '1253'
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- Step 2: Zero out ALL existing lots for code 1253 in BM Apple Iphone Store
UPDATE public.stock_lots
SET qty = 0
WHERE item_code = '1253'
  AND store_id  = 'a0000000-0000-0000-0000-000000000001';

-- Step 3: Upsert primary lot AIS-1253 with qty = 4
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name,
  date, supplier, qty, purchase_price, store_id
)
VALUES (
  'AIS-1253', NULL, '1253', 'Silicon Case Cover Iphone XR',
  CURRENT_DATE::text, 'IMPORT', 4, 0.00,
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

-- Step 4: Sync Sequences Safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock WHERE code ~ '^\d+$')));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^[A-Z]+-[0-9]+$')));

-- Step 5: Verification Query
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
  AND st.code = '1253'
GROUP BY s.name, st.code, st.name, st.category, st.sub_category, st.brand, st.model, st.unit, st.qty;
