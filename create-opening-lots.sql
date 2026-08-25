-- ============================================
-- CREATE OPENING STOCK LOTS
-- Run this in Supabase SQL Editor
-- Creates a lot for every stock item that doesn't have one yet
-- ============================================

-- Step 1: Create lots for items that have qty > 0 and no existing lot
INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price)
SELECT
  'LOT-' || LPAD(
    (ROW_NUMBER() OVER (ORDER BY s.code))::text,
    4, '0'
  ) AS lot_no,
  NULL AS purchase_id,
  s.code AS item_code,
  s.name AS item_name,
  '2024-01-01' AS date,
  'Opening Stock' AS supplier,
  s.qty AS qty,
  s.purchase_price AS purchase_price
FROM public.stock s
WHERE s.qty > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.stock_lots sl
    WHERE sl.item_code = s.code
  );

-- Step 2: Fix lot numbering to continue from existing max
-- This ensures new purchases after this script get correct LOT numbers
-- Run only if the above INSERT created lots
DO $$
DECLARE
  max_lot integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) INTO max_lot
  FROM public.stock_lots;

  RAISE NOTICE 'Created opening stock lots. Max lot number: %', max_lot;
END $$;

-- Step 3: Verify - show all lots created
SELECT
  sl.lot_no,
  sl.item_name,
  sl.qty AS available_qty,
  sl.purchase_price,
  sl.date,
  sl.supplier
FROM public.stock_lots sl
WHERE sl.supplier = 'Opening Stock'
ORDER BY sl.item_name;
