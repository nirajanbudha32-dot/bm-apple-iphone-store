-- =========================================================================
-- BM Electronic: Update Stock Quantities for Filtered Items
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- =========================================================================

-- STEP 1: Update quantities in public.stock
UPDATE public.stock SET qty = 2, purchase_price = 45250.00 WHERE code = '391' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 27000.00 WHERE code = '392' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 61000.00 WHERE code = '394' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 46000.00 WHERE code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 70000.00 WHERE code = '397' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 2, purchase_price = 46250.00 WHERE code = '398' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 2, purchase_price = 55000.00 WHERE code = '399' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 59000.00 WHERE code = '400' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 75000.00 WHERE code = '401' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 84000.00 WHERE code = '402' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 64666.67 WHERE code = '403' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 73000.00 WHERE code = '404' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 0 WHERE code = '414' AND store_id = 'a0000000-0000-0000-0000-000000000003';

-- STEP 2: Update matching FIFO stock lots in public.stock_lots
UPDATE public.stock_lots SET qty = 2, purchase_price = 45250.00 WHERE lot_no = 'ELC-391' OR (item_code = '391' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 27000.00 WHERE lot_no = 'ELC-392' OR (item_code = '392' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 61000.00 WHERE lot_no = 'ELC-394' OR (item_code = '394' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 3, purchase_price = 46000.00 WHERE lot_no = 'ELC-395' OR (item_code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 3, purchase_price = 70000.00 WHERE lot_no = 'ELC-397' OR (item_code = '397' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 2, purchase_price = 46250.00 WHERE lot_no = 'ELC-398' OR (item_code = '398' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 2, purchase_price = 55000.00 WHERE lot_no = 'ELC-399' OR (item_code = '399' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 59000.00 WHERE lot_no = 'ELC-400' OR (item_code = '400' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 75000.00 WHERE lot_no = 'ELC-401' OR (item_code = '401' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 84000.00 WHERE lot_no = 'ELC-402' OR (item_code = '402' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 3, purchase_price = 64666.67 WHERE lot_no = 'ELC-403' OR (item_code = '403' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 73000.00 WHERE lot_no = 'ELC-404' OR (item_code = '404' AND store_id = 'a0000000-0000-0000-0000-000000000003');
UPDATE public.stock_lots SET qty = 1, purchase_price = 0 WHERE lot_no = 'ELC-414' OR (item_code = '414' AND store_id = 'a0000000-0000-0000-0000-000000000003');

-- STEP 3: Verification
SELECT code, name, qty, purchase_price 
FROM public.stock 
WHERE store_id = 'a0000000-0000-0000-0000-000000000003' 
  AND code IN ('391','392','394','395','397','398','399','400','401','402','403','404','414')
ORDER BY CAST(code AS integer) ASC;
