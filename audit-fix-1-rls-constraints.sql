-- ============================================
-- AUDIT FIX 1: RLS Policies + Constraints
-- Run in Supabase SQL Editor AFTER all prior migrations
-- ============================================

-- ============================================
-- PART A: Missing RLS UPDATE/DELETE Policies
-- ============================================

-- sales: add UPDATE policy (needed for addSalesReturn status updates)
DROP POLICY IF EXISTS "sales_update" ON public.sales;
CREATE POLICY "sales_update" ON public.sales
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- stock_adjustments: add UPDATE + DELETE
DROP POLICY IF EXISTS "adj_update" ON public.stock_adjustments;
DROP POLICY IF EXISTS "adj_delete" ON public.stock_adjustments;
CREATE POLICY "adj_update" ON public.stock_adjustments
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "adj_delete" ON public.stock_adjustments
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- sale_item_imeis: add UPDATE + DELETE
DROP POLICY IF EXISTS "sale_imei_update" ON public.sale_item_imeis;
DROP POLICY IF EXISTS "sale_imei_delete" ON public.sale_item_imeis;
CREATE POLICY "sale_imei_update" ON public.sale_item_imeis
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "sale_imei_delete" ON public.sale_item_imeis
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- purchase_items: add UPDATE
DROP POLICY IF EXISTS "pi_update" ON public.purchase_items;
CREATE POLICY "pi_update" ON public.purchase_items
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- sales_returns: add UPDATE + DELETE
DROP POLICY IF EXISTS "sr_update" ON public.sales_returns;
DROP POLICY IF EXISTS "sr_delete" ON public.sales_returns;
CREATE POLICY "sr_update" ON public.sales_returns
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "sr_delete" ON public.sales_returns
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- purchase_returns: add UPDATE + DELETE
DROP POLICY IF EXISTS "pr_update" ON public.purchase_returns;
DROP POLICY IF EXISTS "pr_delete" ON public.purchase_returns;
CREATE POLICY "pr_update" ON public.purchase_returns
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "pr_delete" ON public.purchase_returns
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- vendor_transactions: add UPDATE + DELETE
DROP POLICY IF EXISTS "vendor_tx_update" ON public.vendor_transactions;
DROP POLICY IF EXISTS "vendor_tx_delete" ON public.vendor_transactions;
CREATE POLICY "vendor_tx_update" ON public.vendor_transactions
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendor_tx_delete" ON public.vendor_transactions
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- vendor_payments: add UPDATE + DELETE
DROP POLICY IF EXISTS "vp_update" ON public.vendor_payments;
DROP POLICY IF EXISTS "vp_delete" ON public.vendor_payments;
CREATE POLICY "vp_update" ON public.vendor_payments
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vp_delete" ON public.vendor_payments
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- vendor_payment_allocations: add UPDATE + DELETE
DROP POLICY IF EXISTS "vpa_update" ON public.vendor_payment_allocations;
DROP POLICY IF EXISTS "vpa_delete" ON public.vendor_payment_allocations;
CREATE POLICY "vpa_update" ON public.vendor_payment_allocations
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vpa_delete" ON public.vendor_payment_allocations
  FOR DELETE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- purchase_attachments: add UPDATE
DROP POLICY IF EXISTS "attach_update" ON public.purchase_attachments;
CREATE POLICY "attach_update" ON public.purchase_attachments
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- vendor_documents: add UPDATE
DROP POLICY IF EXISTS "vendor_docs_update" ON public.vendor_documents;
CREATE POLICY "vendor_docs_update" ON public.vendor_documents
  FOR UPDATE TO authenticated
  USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- ============================================
-- PART B: Role-Based DELETE Restrictions
-- Only admin (store_id=NULL) can DELETE records
-- ============================================

-- sales
DROP POLICY IF EXISTS "sales_delete" ON public.sales;
CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- stock
DROP POLICY IF EXISTS "stock_delete" ON public.stock;
CREATE POLICY "stock_delete" ON public.stock
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- stock_lots
DROP POLICY IF EXISTS "stock_lots_delete" ON public.stock_lots;
CREATE POLICY "stock_lots_delete" ON public.stock_lots
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- sale_lot_allocations
DROP POLICY IF EXISTS "alloc_delete" ON public.sale_lot_allocations;
CREATE POLICY "alloc_delete" ON public.sale_lot_allocations
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- stock_adjustments
DROP POLICY IF EXISTS "adj_delete" ON public.stock_adjustments;
CREATE POLICY "adj_delete" ON public.stock_adjustments
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- purchase_headers
DROP POLICY IF EXISTS "ph_delete" ON public.purchase_headers;
CREATE POLICY "ph_delete" ON public.purchase_headers
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- purchase_items
DROP POLICY IF EXISTS "pi_delete" ON public.purchase_items;
CREATE POLICY "pi_delete" ON public.purchase_items
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- purchase_item_imeis
DROP POLICY IF EXISTS "imei_delete" ON public.purchase_item_imeis;
CREATE POLICY "imei_delete" ON public.purchase_item_imeis
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- purchase_attachments
DROP POLICY IF EXISTS "attach_delete" ON public.purchase_attachments;
CREATE POLICY "attach_delete" ON public.purchase_attachments
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- vendors
DROP POLICY IF EXISTS "vendors_delete" ON public.vendors;
CREATE POLICY "vendors_delete" ON public.vendors
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- sale_item_imeis
DROP POLICY IF EXISTS "sale_imei_delete" ON public.sale_item_imeis;
CREATE POLICY "sale_imei_delete" ON public.sale_item_imeis
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- sales_returns
DROP POLICY IF EXISTS "sr_delete" ON public.sales_returns;
CREATE POLICY "sr_delete" ON public.sales_returns
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- purchase_returns
DROP POLICY IF EXISTS "pr_delete" ON public.purchase_returns;
CREATE POLICY "pr_delete" ON public.purchase_returns
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- vendor_documents
DROP POLICY IF EXISTS "vendor_docs_delete" ON public.vendor_documents;
CREATE POLICY "vendor_docs_delete" ON public.vendor_documents
  FOR DELETE TO authenticated
  USING (
    (public.is_admin() AND user_store_id() IS NULL)
    OR store_id = user_store_id()
  );

-- ============================================
-- PART C: UNIQUE Constraints on Business Keys
-- ============================================

-- sales: same item cannot appear twice in one invoice
DO $$ BEGIN
  ALTER TABLE public.sales ADD CONSTRAINT unique_invoice_item
    UNIQUE (invoice_no, item_code);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- purchase_returns.return_no
DO $$ BEGIN
  ALTER TABLE public.purchase_returns ADD CONSTRAINT unique_return_no
    UNIQUE (return_no);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- vendor_payments.payment_no
DO $$ BEGIN
  ALTER TABLE public.vendor_payments ADD CONSTRAINT unique_payment_no
    UNIQUE (payment_no);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- vendor_transactions: prevent duplicate ledger entries
DO $$ BEGIN
  ALTER TABLE public.vendor_transactions ADD CONSTRAINT unique_vendor_txn_ref
    UNIQUE (vendor_id, reference_no, transaction_type);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- stock_transfers.transfer_no
DO $$ BEGIN
  ALTER TABLE public.stock_transfers ADD CONSTRAINT unique_transfer_no
    UNIQUE (transfer_no);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ============================================
-- PART D: Missing Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sales_store ON public.sales(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_stock_store ON public.stock(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_item ON public.stock_lots(item_name);
CREATE INDEX IF NOT EXISTS idx_stock_lots_store ON public.stock_lots(store_id);
CREATE INDEX IF NOT EXISTS idx_alloc_sale ON public.sale_lot_allocations(sale_id);
CREATE INDEX IF NOT EXISTS idx_alloc_lot ON public.sale_lot_allocations(lot_id);
CREATE INDEX IF NOT EXISTS idx_pi_header ON public.purchase_items(purchase_header_id);
CREATE INDEX IF NOT EXISTS idx_vt_vendor ON public.vendor_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vp_vendor ON public.vendor_payments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pr_header ON public.purchase_returns(purchase_header_id);
CREATE INDEX IF NOT EXISTS idx_adj_lot ON public.stock_adjustments(lot_id);
CREATE INDEX IF NOT EXISTS idx_sai_sale ON public.sale_item_imeis(sale_id);

-- ============================================
-- PART E: CHECK Constraints
-- ============================================

DO $$ BEGIN
  ALTER TABLE public.sales ADD CONSTRAINT chk_sales_qty_positive CHECK (qty > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.sales ADD CONSTRAINT chk_sales_rate_nonneg CHECK (rate >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.sales ADD CONSTRAINT chk_sales_total_nonneg CHECK (total >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.stock ADD CONSTRAINT chk_stock_qty_nonneg CHECK (qty >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.stock_lots ADD CONSTRAINT chk_lot_qty_nonneg CHECK (qty >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.purchase_headers ADD CONSTRAINT chk_ph_grand_nonneg CHECK (grand_total >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.purchase_headers ADD CONSTRAINT chk_ph_paid_nonneg CHECK (paid_amount >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.purchase_items ADD CONSTRAINT chk_pi_qty_positive CHECK (qty > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.vendor_payments ADD CONSTRAINT chk_vp_amount_positive CHECK (amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================
-- PART F: NOT NULL on store_id
-- Run only after verifying no NULL store_id rows exist:
--   SELECT COUNT(*) FROM sales WHERE store_id IS NULL;
-- If count is 0, uncomment the ALTER statements below.
-- ============================================

-- ALTER TABLE public.sales ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.stock ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.stock_lots ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.sale_lot_allocations ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.purchase_headers ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.purchase_items ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.vendors ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.vendor_transactions ALTER COLUMN store_id SET NOT NULL;
-- ALTER TABLE public.vendor_payments ALTER COLUMN store_id SET NOT NULL;

-- ============================================
-- AUDIT FIX 1 COMPLETE
-- ============================================
