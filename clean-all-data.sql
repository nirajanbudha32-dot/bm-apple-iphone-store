-- ============================================
-- CLEAN ALL DATA — Keep accounts, profiles & stores
-- Run in: Supabase SQL Editor
-- ============================================

-- 1. Temporarily disable triggers/FK checks to prevent cascade errors
SET session_replication_role = 'replica';

BEGIN;

-- 2. Clear Sales Data
DELETE FROM public.sale_item_imeis;
DELETE FROM public.sale_lot_allocations;
DELETE FROM public.sales_returns;
DELETE FROM public.sales;

-- 3. Clear Vendor Data & Allocations (cleared before purchases)
DELETE FROM public.vendor_payment_allocations;
DELETE FROM public.vendor_payments;
DELETE FROM public.vendor_documents;
DELETE FROM public.vendor_transactions;
DELETE FROM public.vendors;

-- 4. Clear Purchases Data
DELETE FROM public.purchase_item_imeis;
DELETE FROM public.purchase_attachments;
DELETE FROM public.purchase_items;
DELETE FROM public.purchase_returns;
DELETE FROM public.purchase_headers;
DELETE FROM public.purchases;

-- 5. Clear Inventory & Stock
DELETE FROM public.stock_adjustments;
DELETE FROM public.stock_transfer_items;
DELETE FROM public.stock_transfers;
DELETE FROM public.stock_lots;
DELETE FROM public.stock;

-- 6. Clear Audit Logs
DELETE FROM public.audit_log;

-- 7. Reset all sequences back to 1
ALTER SEQUENCE IF EXISTS public.invoice_no_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.purchase_no_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.lot_no_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.stock_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.vendor_code_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.vendor_payment_no_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.purchase_return_no_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.return_no_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.transfer_no_seq RESTART WITH 1;

COMMIT;

-- 8. Re-enable triggers/FK checks
SET session_replication_role = 'origin';

-- 9. Verification (Check that accounts & profiles are still intact)
SELECT 'profiles (kept)' AS item, COUNT(*) AS count FROM public.profiles
UNION ALL
SELECT 'stores (kept)', COUNT(*) FROM public.stores
UNION ALL
SELECT 'auth.users (kept)', COUNT(*) FROM auth.users
UNION ALL
SELECT 'sales (wiped)', COUNT(*) FROM public.sales
UNION ALL
SELECT 'stock (wiped)', COUNT(*) FROM public.stock
UNION ALL
SELECT 'purchases (wiped)', COUNT(*) FROM public.purchase_headers;
