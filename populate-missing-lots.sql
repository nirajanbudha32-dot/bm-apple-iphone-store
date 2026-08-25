-- ============================================================
-- AUTO-GENERATE LOTS FOR EXISTING PURCHASES MISSING LOTS
-- Run this in Supabase SQL Editor
-- Creates lots for purchase items that don't have a lot yet
-- ============================================================

DO $$
DECLARE
  r RECORD;
  next_num integer;
  new_lot text;
BEGIN
  -- Get current max lot number
  SELECT COALESCE(MAX(
    CASE 
      WHEN lot_no ~ '^LOT-\d+$' THEN CAST(SUBSTRING(lot_no FROM 5) AS integer)
      ELSE 0 
    END
  ), 0) INTO next_num
  FROM public.stock_lots;

  -- Loop through purchase items that don't have an associated stock lot
  FOR r IN 
    SELECT 
      pi.id AS item_id,
      pi.item_code,
      pi.item_name,
      ph.date,
      ph.supplier_name,
      pi.qty,
      pi.rate
    FROM public.purchase_items pi
    JOIN public.purchase_headers ph ON ph.id = pi.purchase_header_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.stock_lots sl WHERE sl.purchase_id = pi.id::text OR sl.purchase_id = ph.id::text
    )
    ORDER BY ph.date, ph.purchase_no, pi.sn
  LOOP
    next_num := next_num + 1;
    new_lot := 'LOT-' || LPAD(next_num::text, 4, '0');

    -- Insert into stock_lots
    INSERT INTO public.stock_lots (
      lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price
    ) VALUES (
      new_lot, r.item_id::text, r.item_code, r.item_name, r.date, r.supplier_name, r.qty, r.rate
    );

    -- Update purchase_items with the lot number
    UPDATE public.purchase_items
    SET lot_no = new_lot
    WHERE id = r.item_id;

    RAISE NOTICE 'Created lot % for % (Purchase Date: %)', new_lot, r.item_name, r.date;
  END LOOP;

  -- Also update any purchase_items where lot_no is blank but stock_lots exists
  UPDATE public.purchase_items pi
  SET lot_no = sl.lot_no
  FROM public.stock_lots sl
  WHERE (sl.purchase_id = pi.id::text OR sl.purchase_id = pi.purchase_header_id::text)
    AND (pi.lot_no IS NULL OR pi.lot_no = '');

END $$;

-- Verify all lots
SELECT lot_no, item_name, supplier, qty, purchase_price, date 
FROM public.stock_lots 
ORDER BY date DESC, lot_no DESC;
