-- =========================================================================
-- BM Electronic: Set Qty = 0 for the 21 Selected Items
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- =========================================================================

-- STEP 1: Set qty = 0 in public.stock
UPDATE public.stock
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND code IN (
    '390', '391', '392', '393', '394', '395', '396', '397', '398', '399',
    '400', '401', '402', '403', '404', '405', '414', '418', '423', '424', '425'
  );

-- STEP 2: Set qty = 0 in public.stock_lots
UPDATE public.stock_lots
SET qty = 0
WHERE store_id = 'a0000000-0000-0000-0000-000000000003'
  AND (
    item_code IN (
      '390', '391', '392', '393', '394', '395', '396', '397', '398', '399',
      '400', '401', '402', '403', '404', '405', '414', '418', '423', '424', '425'
    )
    OR lot_no IN (
      'ELC-390', 'ELC-391', 'ELC-392', 'ELC-393', 'ELC-394', 'ELC-395', 'ELC-396', 'ELC-397', 'ELC-398', 'ELC-399',
      'ELC-400', 'ELC-401', 'ELC-402', 'ELC-403', 'ELC-404', 'ELC-405', 'ELC-414', 'ELC-418', 'ELC-423', 'ELC-424', 'ELC-425'
    )
  );

-- STEP 3: Verification query
SELECT code, name, qty, purchase_price 
FROM public.stock 
WHERE store_id = 'a0000000-0000-0000-0000-000000000003' 
  AND code IN (
    '390', '391', '392', '393', '394', '395', '396', '397', '398', '399',
    '400', '401', '402', '403', '404', '405', '414', '418', '423', '424', '425'
  )
ORDER BY CAST(code AS integer) ASC;
