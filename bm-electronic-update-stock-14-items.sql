-- =========================================================================
-- BM ELECTRONIC: Update Quantities & Prices for 14 iPhone Items
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- Synchronizes BOTH public.stock and public.stock_lots
-- =========================================================================

-- STEP 1: Update public.stock
UPDATE public.stock SET qty = 2, purchase_price = 45250.00, updated_at = NOW() WHERE code = '391' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 27000.00, updated_at = NOW() WHERE code = '392' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 61000.00, updated_at = NOW() WHERE code = '394' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 46000.00, updated_at = NOW() WHERE code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 46000.00, updated_at = NOW() WHERE code = '423' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 70000.00, updated_at = NOW() WHERE code = '397' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 65000.00, updated_at = NOW() WHERE code = '424' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 2, purchase_price = 46250.00, updated_at = NOW() WHERE code = '398' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 3, purchase_price = 55000.00, updated_at = NOW() WHERE code = '399' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 75000.00, updated_at = NOW() WHERE code = '401' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 84000.00, updated_at = NOW() WHERE code = '402' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 2, purchase_price = 64666.67, updated_at = NOW() WHERE code = '403' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 73000.00, updated_at = NOW() WHERE code = '404' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock SET qty = 1, purchase_price = 7000.00,  updated_at = NOW() WHERE code = '414' AND store_id = 'a0000000-0000-0000-0000-000000000003';


-- STEP 2: Update public.stock_lots
UPDATE public.stock_lots SET qty = 2, purchase_price = 45250.00 WHERE item_code = '391' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 27000.00 WHERE item_code = '392' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 61000.00 WHERE item_code = '394' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 3, purchase_price = 46000.00 WHERE item_code = '395' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 46000.00 WHERE item_code = '423' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 70000.00 WHERE item_code = '397' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 65000.00 WHERE item_code = '424' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 2, purchase_price = 46250.00 WHERE item_code = '398' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 3, purchase_price = 55000.00 WHERE item_code = '399' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 75000.00 WHERE item_code = '401' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 84000.00 WHERE item_code = '402' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 2, purchase_price = 64666.67 WHERE item_code = '403' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 73000.00 WHERE item_code = '404' AND store_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.stock_lots SET qty = 1, purchase_price = 7000.00  WHERE item_code = '414' AND store_id = 'a0000000-0000-0000-0000-000000000003';


-- STEP 3: Verification Query to check both tables side-by-side
SELECT 
  s.code,
  s.name,
  s.qty AS stock_qty,
  COALESCE(l.qty, 0) AS lot_qty,
  s.purchase_price,
  CASE 
    WHEN s.qty = COALESCE(l.qty, 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock s
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
WHERE s.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND s.code IN ('391','392','394','395','423','397','424','398','399','401','402','403','404','414')
ORDER BY CAST(s.code AS integer);
