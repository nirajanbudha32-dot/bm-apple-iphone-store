-- ============================================================
-- REMOVE ALL DATA FROM SUPABASE
-- Run this in Supabase SQL Editor
-- Keeps: stores table structure and data
-- Removes: all users, all transactions, all stock, all sales
-- ============================================================

-- Disable triggers temporarily to avoid cascade issues
SET session_replication_role = 'replica';

-- Delete all auth users (this cascades to profiles via trigger)
DELETE FROM auth.users;

-- Delete all data tables (order matters for foreign keys)
DELETE FROM public.sale_item_imeis;
DELETE FROM public.sales_returns;
DELETE FROM public.purchase_returns;
DELETE FROM public.vendor_documents;
DELETE FROM public.vendor_payment_allocations;
DELETE FROM public.vendor_payments;
DELETE FROM public.vendor_transactions;
DELETE FROM public.vendors;
DELETE FROM public.purchase_item_imeis;
DELETE FROM public.purchase_attachments;
DELETE FROM public.purchase_items;
DELETE FROM public.purchase_headers;
DELETE FROM public.sale_lot_allocations;
DELETE FROM public.stock_adjustments;
DELETE FROM public.stock_lots;
DELETE FROM public.sales;
DELETE FROM public.stock;
DELETE FROM public.purchases;
DELETE FROM public.profiles;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify: all tables should be empty
SELECT 'profiles' AS tbl, COUNT(*) AS rows FROM public.profiles
UNION ALL SELECT 'stock', COUNT(*) FROM public.stock
UNION ALL SELECT 'sales', COUNT(*) FROM public.sales
UNION ALL SELECT 'stock_lots', COUNT(*) FROM public.stock_lots
UNION ALL SELECT 'purchase_headers', COUNT(*) FROM public.purchase_headers
UNION ALL SELECT 'vendors', COUNT(*) FROM public.vendors
UNION ALL SELECT 'vendor_transactions', COUNT(*) FROM public.vendor_transactions
UNION ALL SELECT 'vendor_payments', COUNT(*) FROM public.vendor_payments
UNION ALL SELECT 'stores', COUNT(*) FROM public.stores;

-- Auth users
SELECT COUNT(*) AS auth_users_remaining FROM auth.users;
