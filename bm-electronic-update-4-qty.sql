-- =========================================================================
-- BM ELECTRONIC: Update Item 4 (17 Pro Max Adapter 3 Pin) Qty from 3 to 0
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  qty = 0,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '4';

-- 2. Update public.stock_lots
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '4' OR lot_no = 'ELC-4');

-- 3. Verification Queries
SELECT id, code, name, category, sub_category, brand, model, unit, qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '4';

SELECT id, lot_no, item_code, item_name, qty, purchase_price, supplier, store_id
FROM public.stock_lots
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '4' OR lot_no = 'ELC-4');
