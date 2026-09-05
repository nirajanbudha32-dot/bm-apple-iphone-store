-- ============================================
-- BM Apple Iphone Store - Sheet2 Stock Import
-- 14 accessory items (codes 1253-1266, lots AIS-1253 to AIS-1266)
-- Store: BM Apple Iphone Store (a0000000-0000-0000-0000-000000000001)
-- Run in Supabase SQL Editor
-- ============================================

-- Step 1: Insert stock items
INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id, updated_at) VALUES
('1253', 'Silicon Case Cover Iphone XR', 'Accessory', 'Cover', 'Silicon Case', 'Silicon Case Cover', 'Iphone XR', 'Pcs', 3, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1254', 'Stand Case Cover Iphone XR', 'Accessory', 'Cover', 'Stand Case', 'Stand Case Cover', 'Iphone XR', 'Pcs', 9, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1255', 'Carbon Cover Iphone XR', 'Accessory', 'Cover', 'Carbon', 'Carbon Cover', 'Iphone XR', 'Pcs', 3, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1256', 'Silicon Case Cover Iphone X/XS', 'Accessory', 'Cover', 'Silicon Case', 'Silicon Case Cover', 'Iphone X/XS', 'Pcs', 4, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1257', 'Carbon Cover Iphone X/XS', 'Accessory', 'Cover', 'Carbon', 'Carbon Cover', 'Iphone X/XS', 'Pcs', 5, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1258', 'Ladises Case Cover Iphone XS Max', 'Accessory', 'Cover', 'Ladises', 'Ladises Case Cover', 'Iphone XS Max', 'Pcs', 2, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1259', 'Carbon Cover 6+/7+/8+', 'Accessory', 'Cover', 'Carbon', 'Carbon Cover', '6+/7+/8+', 'Pcs', 5, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1260', 'Leather Case Cover 6+/7+/8+', 'Accessory', 'Cover', 'Leather Case', 'Leather Case Cover', '6+/7+/8+', 'Pcs', 4, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1261', 'Clear Case Cover 6+/7+/8+', 'Accessory', 'Cover', 'Clear Case', 'Clear Case Cover', '6+/7+/8+', 'Pcs', 2, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1262', 'Stand Case Cover 6+/7+/8+', 'Accessory', 'Cover', 'Stand Case', 'Stand Case Cover', '6+/7+/8+', 'Pcs', 1, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1263', 'Phone Case Cover Iphone 14 Plus/15 Plus', 'Accessory', 'Cover', 'Phone Case', 'Phone Case Cover', 'Iphone 14 Plus/15 Plus', 'Pcs', 7, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1264', 'Nimeny Case Cover Iphone 12 Min', 'Accessory', 'Cover', 'Nimeny Case', 'Nimeny Case Cover', 'Iphone 12 Min', 'Pcs', 1, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1265', 'Watch Glass Apple', 'Accessory', 'Watch Glass', 'Watch Glass', 'Watch Glass', 'Apple Watch', 'Pcs', 42, 0, 0, 'a0000000-0000-0000-0000-000000000001', now()),
('1266', 'Watch Cover Apple', 'Accessory', 'Watch Cover', 'Watch Cover', 'Watch Cover', 'Apple Watch', 'Pcs', 4, 0, 0, 'a0000000-0000-0000-0000-000000000001', now())
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id, updated_at=EXCLUDED.updated_at;

-- Step 2: Insert stock lots
INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id) VALUES
('AIS-1253', NULL, '1253', 'Silicon Case Cover Iphone XR', '2026-08-31', 'IMPORT', 3, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1254', NULL, '1254', 'Stand Case Cover Iphone XR', '2026-08-31', 'IMPORT', 9, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1255', NULL, '1255', 'Carbon Cover Iphone XR', '2026-08-31', 'IMPORT', 3, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1256', NULL, '1256', 'Silicon Case Cover Iphone X/XS', '2026-08-31', 'IMPORT', 4, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1257', NULL, '1257', 'Carbon Cover Iphone X/XS', '2026-08-31', 'IMPORT', 5, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1258', NULL, '1258', 'Ladises Case Cover Iphone XS Max', '2026-08-31', 'IMPORT', 2, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1259', NULL, '1259', 'Carbon Cover 6+/7+/8+', '2026-08-31', 'IMPORT', 5, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1260', NULL, '1260', 'Leather Case Cover 6+/7+/8+', '2026-08-31', 'IMPORT', 4, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1261', NULL, '1261', 'Clear Case Cover 6+/7+/8+', '2026-08-31', 'IMPORT', 2, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1262', NULL, '1262', 'Stand Case Cover 6+/7+/8+', '2026-08-31', 'IMPORT', 1, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1263', NULL, '1263', 'Phone Case Cover Iphone 14 Plus/15 Plus', '2026-08-31', 'IMPORT', 7, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1264', NULL, '1264', 'Nimeny Case Cover Iphone 12 Min', '2026-08-31', 'IMPORT', 1, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1265', NULL, '1265', 'Watch Glass Apple', '2026-08-31', 'IMPORT', 42, 0, 'a0000000-0000-0000-0000-000000000001'),
('AIS-1266', NULL, '1266', 'Watch Cover Apple', '2026-08-31', 'IMPORT', 4, 0, 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Step 3: Verify
SELECT code, name, qty, store_id FROM public.stock WHERE code IN ('1253','1254','1255','1256','1257','1258','1259','1260','1261','1262','1263','1264','1265','1266') ORDER BY code;
SELECT lot_no, item_code, item_name, qty, store_id FROM public.stock_lots WHERE lot_no IN ('AIS-1253','AIS-1254','AIS-1255','AIS-1256','AIS-1257','AIS-1258','AIS-1259','AIS-1260','AIS-1261','AIS-1262','AIS-1263','AIS-1264','AIS-1265','AIS-1266') ORDER BY lot_no;
