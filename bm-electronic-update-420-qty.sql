-- =========================================================================
-- BM ELECTRONIC: Update Item 420 (Super X 12/12 Pro) Quantity from 0 to 1
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- =========================================================================

-- 1. Update public.stock
UPDATE public.stock
SET 
  qty = 1,
  updated_at = NOW()
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '420';

-- 2. Update or Insert into public.stock_lots
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.stock_lots
    WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
      AND (item_code = '420' OR lot_no = 'ELC-420')
  ) THEN
    UPDATE public.stock_lots
    SET 
      qty = 1,
      item_name = 'Super X 12/12 Pro',
      date = CURRENT_DATE::text,
      supplier = 'IMPORT'
    WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
      AND (item_code = '420' OR lot_no = 'ELC-420');
  ELSE
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
    VALUES (
      'ELC-420',
      NULL,
      '420',
      'Super X 12/12 Pro',
      CURRENT_DATE::text,
      'IMPORT',
      1,
      0.00,
      'a0000000-0000-0000-0000-000000000003'
    );
  END IF;
END $$;

-- 3. Verification Queries
SELECT id, code, name, category, sub_category, brand, model, unit, qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code = '420';

SELECT id, lot_no, item_code, item_name, qty, purchase_price, supplier, store_id
FROM public.stock_lots
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (item_code = '420' OR lot_no = 'ELC-420');
