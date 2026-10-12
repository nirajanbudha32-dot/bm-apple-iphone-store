-- =========================================================================
-- BM ELECTRONIC: Update Item 415 (CVR Super HD Glass Iphone 13) Qty from 2 to 0
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  qty = 0,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '415';

-- 2. Update public.stock_lots
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '415' OR lot_no = 'ELC-415');

-- 3. Verification Queries
SELECT id, code, name, category, sub_category, brand, model, unit, qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '415';

SELECT id, lot_no, item_code, item_name, qty, purchase_price, supplier, store_id
FROM public.stock_lots
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '415' OR lot_no = 'ELC-415');
