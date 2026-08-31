-- ============================================
-- CLEAN ALL DATA — Keep profiles & stores
-- Run in: https://supabase.com/dashboard/project/moavwfubvalkxgfcntmy/sql/new
-- ============================================

-- 1. DELETE all data (child tables first)
DELETE FROM sale_item_imeis;
DELETE FROM sale_lot_allocations;
DELETE FROM sales_returns;
DELETE FROM sales;

DELETE FROM purchase_item_imeis;
DELETE FROM purchase_attachments;
DELETE FROM purchase_items;
DELETE FROM purchase_returns;
DELETE FROM purchase_headers;
DELETE FROM purchases;

DELETE FROM stock_adjustments;
DELETE FROM stock_transfer_items;
DELETE FROM stock_transfers;
DELETE FROM stock_lots;
DELETE FROM stock;

DELETE FROM vendor_payment_allocations;
DELETE FROM vendor_payments;
DELETE FROM vendor_documents;
DELETE FROM vendor_transactions;
DELETE FROM vendors;

DELETE FROM audit_log;

-- 2. RESET sequences to 1
ALTER SEQUENCE public.invoice_no_seq RESTART WITH 1;
ALTER SEQUENCE public.purchase_no_seq RESTART WITH 1;
ALTER SEQUENCE public.lot_no_seq RESTART WITH 1;
ALTER SEQUENCE public.stock_code_seq RESTART WITH 1;
ALTER SEQUENCE public.vendor_code_seq RESTART WITH 1;
ALTER SEQUENCE public.vendor_payment_no_seq RESTART WITH 1;
ALTER SEQUENCE public.purchase_return_no_seq RESTART WITH 1;
ALTER SEQUENCE public.return_no_seq RESTART WITH 1;
ALTER SEQUENCE public.transfer_no_seq RESTART WITH 1;
