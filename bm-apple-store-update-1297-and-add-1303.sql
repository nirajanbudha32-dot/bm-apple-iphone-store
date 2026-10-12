-- =========================================================================
-- BM APPLE IPHONE STORE: Update Code 1297 + Add New Code 1303
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Items:
-- 1. Code 1297 | Clear Case Iphone 18 Pro     | Qty: 5  | Lot: AIS-1297 (UPDATE)
-- 2. Code 1303 | Clear Case Iphone 18 Pro Max | Qty: 18 | Lot: AIS-1303 (NEW)
-- =========================================================================

-- STEP 1: Upsert Items into public.stock
INSERT INTO public.stock (
  code,
  name,
  category,
  sub_category,
  brand,
  sub_brand,
  model,
  unit,
  qty,
  purchase_price,
  selling_price,
  store_id
)
VALUES 
  (
    '1297',
    'Clear Case Iphone 18 Pro',
    'Accessory',
    'Cover',
    'Clear Case',
    'Clear Case',
    'Iphone 18 Pro',
    'Pcs',
    5,
    98.31,
    0.00,
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '1303',
    'Clear Case Iphone 18 Pro Max',
    'Accessory',
    'Cover',
    'Clear Case',
    'Clear Case',
    'Iphone 18 Pro Max',
    'Pcs',
    18,
    98.31,
    0.00,
    'a0000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  sub_category = EXCLUDED.sub_category,
  brand = EXCLUDED.brand,
  sub_brand = EXCLUDED.sub_brand,
  model = EXCLUDED.model,
  unit = EXCLUDED.unit,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  selling_price = EXCLUDED.selling_price,
  store_id = EXCLUDED.store_id,
  updated_at = NOW();


-- STEP 2: Upsert FIFO Stock Lots in public.stock_lots
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
VALUES 
  (
    'AIS-1297',
    NULL,
    '1297',
    'Clear Case Iphone 18 Pro',
    CURRENT_DATE::text,
    'IMPORT',
    5,
    98.31,
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'AIS-1303',
    NULL,
    '1303',
    'Clear Case Iphone 18 Pro Max',
    CURRENT_DATE::text,
    'IMPORT',
    18,
    98.31,
    'a0000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty,
  purchase_price = EXCLUDED.purchase_price,
  store_id = EXCLUDED.store_id;


-- STEP 3: Sync sequence generators safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^AIS-\d+$')));


-- STEP 4: Verification - Verify side-by-side match for both items
SELECT 
  s.code,
  s.name,
  s.qty AS stock_qty,
  COALESCE(SUM(l.qty), 0) AS total_active_lots_qty,
  s.purchase_price,
  CASE 
    WHEN s.qty = COALESCE(SUM(l.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock s
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000001'
  AND s.code IN ('1297', '1303')
GROUP BY s.code, s.name, s.qty, s.purchase_price
ORDER BY CAST(s.code AS integer);
