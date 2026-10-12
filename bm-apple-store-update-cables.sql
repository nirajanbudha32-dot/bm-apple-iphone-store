-- =========================================================================
-- BM Apple Iphone Store: Update Stock Quantities for Cables
-- Store: BM Apple Iphone Store (Store ID: a0000000-0000-0000-0000-000000000001)
--
-- Item 1: Code 1248 (Lighting Cable Mango wala(200)) -> Qty 0 to 4
-- Item 2: Code 1251 (USB C to C Cable)               -> Qty 35 to 36
-- =========================================================================

-- 1. Update quantities in public.stock
UPDATE public.stock
SET qty = 4
WHERE code = '1248' 
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock
SET qty = 36
WHERE code = '1251' 
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Update matching FIFO stock lots in public.stock_lots
UPDATE public.stock_lots
SET qty = 4
WHERE item_code = '1248' 
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.stock_lots
SET qty = 36
WHERE item_code = '1251' 
  AND store_id = 'a0000000-0000-0000-0000-000000000001';

-- 3. Verification query
SELECT code, name, qty, store_id 
FROM public.stock 
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND code IN ('1248', '1251');

SELECT id, lot_no, item_code, item_name, qty, store_id 
FROM public.stock_lots 
WHERE store_id = 'a0000000-0000-0000-0000-000000000001'
  AND item_code IN ('1248', '1251');
