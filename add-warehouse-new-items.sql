-- =========================================================================
-- WAREHOUSE STOCK: Add New Items & FIFO Lots
-- Store: Warehouse (Store ID: a0000000-0000-0000-0000-000000000004)
--
-- Items from Specification:
-- 1. Iphone 13 128GB | Qty: 2 | Category: Old Iphone | Model: Iphone 13 128GB
-- 2. Iphone 12 128GB | Qty: 1 | Category: Old Iphone | Model: Iphone 12 128GB
--
-- Code Convention: 4000-series for Warehouse (4001, 4002)
-- Lot Convention:  WH-4001, WH-4002
-- Purchase Prices: Standard purchase rates (46,000 for 13, 35,000 for 12)
-- =========================================================================

-- 0. Ensure Warehouse store exists in public.stores
INSERT INTO public.stores (id, name, address, phone, email, pan, vat_number, status)
VALUES ('a0000000-0000-0000-0000-000000000004', 'Warehouse', 'Central Storage', '', '', '', '', 'active')
ON CONFLICT (id) DO NOTHING;

-- 1. Insert/Update Items in public.stock
-- Delete existing item definitions with these codes in Warehouse if any, to avoid conflicts
DELETE FROM public.stock 
WHERE store_id = 'a0000000-0000-0000-0000-000000000004' 
  AND (code IN ('4001', '4002') OR name IN ('Iphone 13 128GB', 'Iphone 12 128GB'));

INSERT INTO public.stock (
  code,
  name,
  category,
  sub_category,
  brand,
  sub_brand,
  model,
  unit,
  qty,
  purchase_price,
  selling_price,
  store_id
)
VALUES
  (
    '4001',
    'Iphone 13 128GB',
    'Old Iphone',
    'Iphone',
    'Apple',
    'Apple',
    'Iphone 13 128GB',
    'Pcs',
    2,
    46000.00,
    0.00,
    'a0000000-0000-0000-0000-000000000004'
  ),
  (
    '4002',
    'Iphone 12 128GB',
    'Old Iphone',
    'Iphone',
    'Apple',
    'Apple',
    'Iphone 12 128GB',
    'Pcs',
    1,
    35000.00,
    0.00,
    'a0000000-0000-0000-0000-000000000004'
  );

-- 2. Insert/Update FIFO Stock Lots in public.stock_lots
-- (WarehouseView relies directly on active lots in stock_lots with store_id = WAREHOUSE_ID)
DELETE FROM public.stock_lots
WHERE store_id = 'a0000000-0000-0000-0000-000000000004'
  AND (lot_no IN ('WH-4001', 'WH-4002') OR item_code IN ('4001', '4002') OR item_name IN ('Iphone 13 128GB', 'Iphone 12 128GB'));

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
VALUES
  (
    'WH-4001',
    NULL,
    '4001',
    'Iphone 13 128GB',
    CURRENT_DATE::text,
    'IMPORT',
    2,
    46000.00,
    'a0000000-0000-0000-0000-000000000004'
  ),
  (
    'WH-4002',
    NULL,
    '4002',
    'Iphone 12 128GB',
    CURRENT_DATE::text,
    'IMPORT',
    1,
    35000.00,
    'a0000000-0000-0000-0000-000000000004'
  );

-- 3. Sync Sequence Generators safely
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 4) AS integer)), 0) FROM public.stock_lots WHERE lot_no ~ '^WH-\d+$')));

-- 4. Verification Queries
SELECT id, code, name, category, sub_category, brand, model, unit, qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000004';

SELECT id, lot_no, item_code, item_name, qty, purchase_price, supplier, store_id
FROM public.stock_lots
WHERE store_id = 'a0000000-0000-0000-0000-000000000004';
