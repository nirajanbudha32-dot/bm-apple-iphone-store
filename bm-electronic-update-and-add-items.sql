-- =========================================================================
-- BM Electronic: Update Existing Items & Add New Items (Codes 423, 424, 425)
-- Store: BM Electronic (Store ID: a0000000-0000-0000-0000-000000000003)
-- =========================================================================

-- STEP 1: Insert or Update items in public.stock
INSERT INTO public.stock (
  code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id
)
VALUES
  ('390', 'Iphone 11 Pro Max 64 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 11 Pro Max 64 GB', 'Pcs', 0, 32000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('391', 'Iphone 11 Pro Max 256 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 11 Pro Max 256 GB', 'Pcs', 2, 45250.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('392', 'Iphone 12 Min 64 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 12 Min 64 GB', 'Pcs', 1, 27000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('393', 'Iphone 12 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 12 128 GB', 'Pcs', 0, 35000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('394', 'Iphone 12 Pro Max 512 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 12 Pro Max 512 GB', 'Pcs', 1, 61000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('395', 'Iphone 13 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 128 GB', 'Pcs', 3, 46000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('396', 'Iphone 13 Pro 256 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 Pro 256 GB', 'Pcs', 0, 69000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('397', 'Iphone 13 Pro Max 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 Pro Max 128 Gb', 'Pcs', 3, 70000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('398', 'Iphone 14 128 Gb', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 128 Gb', 'Pcs', 2, 46250.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('399', 'Iphone 14 Plus 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 Plus 128 GB', 'Pcs', 1, 55000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('400', 'Iphone 14 Plus 256 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 Plus 256 GB', 'Pcs', 1, 59000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('401', 'Iphone 14 Pro 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 Pro 128 GB', 'Pcs', 1, 75000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('402', 'Iphone 14 Pro Max 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 14 Pro Max 128 GB', 'Pcs', 1, 84000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('403', 'Iphone 15 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 15 128 GB', 'Pcs', 3, 64666.67, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('404', 'Iphone 15 Plus 128 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 15 Plus 128 GB', 'Pcs', 1, 73000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('405', 'Iphone 12 64 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 12 64 GB', 'Pcs', 0, 0, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('414', 'Iphone 7 Plus 128GB', 'Old Iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 7 Plus 128GB', 'Pcs', 1, 0, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('418', 'Iphone 16 Pro Max', 'Old Iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 16 Pro Max', 'Pcs', 1, 0, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('423', 'Iphone 13 256GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 256GB', 'Pcs', 1, 46000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('424', 'Iphone 13 Pro Max 256GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 13 Pro Max 256GB', 'Pcs', 1, 65000.00, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('425', 'Iphone 15 Pro Max 256 GB', 'old iphone', 'Iphone', 'Apple', 'Apple', 'Iphone 15 Pro Max 256 GB', 'Pcs', 1, 95000.00, 0, 'a0000000-0000-0000-0000-000000000003')
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
  store_id = EXCLUDED.store_id;

-- STEP 2: Insert or Update stock lots in public.stock_lots
INSERT INTO public.stock_lots (
  lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id
)
VALUES
  ('ELC-390', NULL, '390', 'Iphone 11 Pro Max 64 GB', CURRENT_DATE::text, 'IMPORT', 0, 32000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-391', NULL, '391', 'Iphone 11 Pro Max 256 GB', CURRENT_DATE::text, 'IMPORT', 2, 45250.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-392', NULL, '392', 'Iphone 12 Min 64 GB', CURRENT_DATE::text, 'IMPORT', 1, 27000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-393', NULL, '393', 'Iphone 12 128 GB', CURRENT_DATE::text, 'IMPORT', 0, 35000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-394', NULL, '394', 'Iphone 12 Pro Max 512 GB', CURRENT_DATE::text, 'IMPORT', 1, 61000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-395', NULL, '395', 'Iphone 13 128 GB', CURRENT_DATE::text, 'IMPORT', 3, 46000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-396', NULL, '396', 'Iphone 13 Pro 256 GB', CURRENT_DATE::text, 'IMPORT', 0, 69000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-397', NULL, '397', 'Iphone 13 Pro Max 128 GB', CURRENT_DATE::text, 'IMPORT', 3, 70000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-398', NULL, '398', 'Iphone 14 128 Gb', CURRENT_DATE::text, 'IMPORT', 2, 46250.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-399', NULL, '399', 'Iphone 14 Plus 128 GB', CURRENT_DATE::text, 'IMPORT', 1, 55000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-400', NULL, '400', 'Iphone 14 Plus 256 GB', CURRENT_DATE::text, 'IMPORT', 1, 59000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-401', NULL, '401', 'Iphone 14 Pro 128 GB', CURRENT_DATE::text, 'IMPORT', 1, 75000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-402', NULL, '402', 'Iphone 14 Pro Max 128 GB', CURRENT_DATE::text, 'IMPORT', 1, 84000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-403', NULL, '403', 'Iphone 15 128 GB', CURRENT_DATE::text, 'IMPORT', 3, 64666.67, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-404', NULL, '404', 'Iphone 15 Plus 128 GB', CURRENT_DATE::text, 'IMPORT', 1, 73000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-405', NULL, '405', 'Iphone 12 64 GB', CURRENT_DATE::text, 'IMPORT', 0, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-414', NULL, '414', 'Iphone 7 Plus 128GB', CURRENT_DATE::text, 'IMPORT', 1, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-418', NULL, '418', 'Iphone 16 Pro Max', CURRENT_DATE::text, 'IMPORT', 1, 0, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-423', NULL, '423', 'Iphone 13 256GB', CURRENT_DATE::text, 'IMPORT', 1, 46000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-424', NULL, '424', 'Iphone 13 Pro Max 256GB', CURRENT_DATE::text, 'IMPORT', 1, 65000.00, 'a0000000-0000-0000-0000-000000000003'),
  ('ELC-425', NULL, '425', 'Iphone 15 Pro Max 256 GB', CURRENT_DATE::text, 'IMPORT', 1, 95000.00, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (lot_no) DO UPDATE SET 
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  date = EXCLUDED.date,
  supplier = EXCLUDED.supplier,
  qty = EXCLUDED.qty, 
  purchase_price = EXCLUDED.purchase_price, 
  store_id = EXCLUDED.store_id;

-- STEP 3: Sync sequence
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));

-- STEP 4: Verification query
SELECT code, name, qty, purchase_price 
FROM public.stock 
WHERE store_id = 'a0000000-0000-0000-0000-000000000003' 
  AND code IN ('390','391','392','393','394','395','396','397','398','399','400','401','402','403','404','405','414','418','423','424','425')
ORDER BY CAST(code AS integer) ASC;
