-- ============================================
-- New Items Import from up stoclk.xlsx
-- Source: C:\Users\DELL\Desktop\up stoclk.xlsx
-- Total Items: 6 (2 for BM Iphone Store, 4 for BM Electronic)
-- Run this in Supabase SQL Editor
-- ============================================

-- =======================================================
-- PART 1: BM Iphone Store Items (Codes: 2282, 2283)
-- Store ID: a0000000-0000-0000-0000-000000000002
-- =======================================================

INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('2282', 'Case Pro Iphone 12', 'Accessory', 'Cover', 'Case Pro', 'Case Pro', 'Iphone 12', 'Pcs', 1, 0, 0, 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;

INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('2283', 'Camera Lens Iphone 12', 'Accessory', 'Camera Lens', 'Lens Iphone 12', 'Lens Iphone 12', 'Iphone 12', 'Pcs', 0, 0, 0, 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;

-- BM Iphone Store FIFO Lots
INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id)
SELECT 'IPH-' || code, NULL, code, name, CURRENT_DATE, 'IMPORT', qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000002' 
  AND code IN ('2282', '2283')
ON CONFLICT DO NOTHING;


-- =======================================================
-- PART 2: BM Electronic Items (Codes: 410, 411, 412, 413)
-- Store ID: a0000000-0000-0000-0000-000000000003
-- =======================================================

INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('410', 'Zone Power Bnak 65W Fast Charger', 'ASSERICESS', 'Power Bank', 'Zone Power Bnak', 'Zone Power Bnak', '65W Fast Charger', 'Pcs', 2, 0, 0, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;

INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('411', 'Airpods Orginal No Name', 'ASSERICESS', 'Airpods', 'No Name', 'No Name', 'Airpods', 'Pcs', 4, 0, 0, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;

INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('412', 'Orginal Certified Type C Airpods', 'ASSERICESS', 'Airpods', 'Orginal Certified', 'Orginal Certified', 'Type C Airpods', 'Pcs', 10, 0, 0, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;

INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand, model, unit, qty, purchase_price, selling_price, store_id)
VALUES ('413', 'Zone Usb Type C to Lighting 35W Super Fast Cable', 'ASSERICESS', 'Cable', 'Zone Usb Type C to Lighting 35W Fast Cable', 'Zone Usb Type C to Lighting 35W Fast Cable', 'Zone Usb Type C to Lighting 35W Fast Cable', 'Pcs', 45, 0, 0, 'a0000000-0000-0000-0000-000000000003')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, sub_category=EXCLUDED.sub_category, brand=EXCLUDED.brand, sub_brand=EXCLUDED.sub_brand, model=EXCLUDED.model, unit=EXCLUDED.unit, qty=EXCLUDED.qty, purchase_price=EXCLUDED.purchase_price, selling_price=EXCLUDED.selling_price, store_id=EXCLUDED.store_id;

-- BM Electronic FIFO Lots
INSERT INTO public.stock_lots (lot_no, purchase_id, item_code, item_name, date, supplier, qty, purchase_price, store_id)
SELECT 'ELC-' || code, NULL, code, name, CURRENT_DATE, 'IMPORT', qty, purchase_price, store_id
FROM public.stock
WHERE store_id = 'a0000000-0000-0000-0000-000000000003' 
  AND code IN ('410', '411', '412', '413')
ON CONFLICT DO NOTHING;


-- =======================================================
-- PART 3: Sequence Synchronization
-- =======================================================
SELECT setval('public.stock_code_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(code AS integer)), 0) FROM public.stock)));
SELECT setval('public.lot_no_seq', GREATEST(1, (SELECT COALESCE(MAX(CAST(SUBSTRING(lot_no FROM 5) AS integer)), 0) FROM public.stock_lots)));
