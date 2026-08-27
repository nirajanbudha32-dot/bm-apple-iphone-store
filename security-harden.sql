-- ============================================
-- SECURITY HARDENING: RLS + Function Access
-- Run in Supabase SQL Editor
-- Run AFTER multi-store-migration.sql
-- ============================================

-- Ensure is_admin() helper exists (used by profiles RLS policy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND store_id IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- PART A: REVOKE anon FROM ALL TABLES
-- ============================================

REVOKE ALL ON public.stock FROM anon;
REVOKE ALL ON public.sales FROM anon;
REVOKE ALL ON public.purchases FROM anon;
REVOKE ALL ON public.stock_lots FROM anon;
REVOKE ALL ON public.sale_lot_allocations FROM anon;
REVOKE ALL ON public.stock_adjustments FROM anon;
REVOKE ALL ON public.purchase_headers FROM anon;
REVOKE ALL ON public.purchase_items FROM anon;
REVOKE ALL ON public.purchase_item_imeis FROM anon;
REVOKE ALL ON public.purchase_attachments FROM anon;
REVOKE ALL ON public.vendors FROM anon;
REVOKE ALL ON public.vendor_transactions FROM anon;
REVOKE ALL ON public.vendor_payments FROM anon;
REVOKE ALL ON public.vendor_payment_allocations FROM anon;
REVOKE ALL ON public.vendor_documents FROM anon;
REVOKE ALL ON public.purchase_returns FROM anon;

-- Ensure authenticated can still do everything the app needs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_lots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_lot_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_adjustments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_headers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_item_imeis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_payment_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_returns TO authenticated;

-- ============================================
-- PART B: REVOKE anon FROM ALL FUNCTIONS
-- ============================================

REVOKE EXECUTE ON FUNCTION public.fifo_deduct(text, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_stock(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stock(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_stock_by_code(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_lot_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_purchase_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_stock_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_purchase_cascade(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_invoice_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_vendor_code() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_vendor_payment_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_purchase_return_no() FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_store_id() FROM anon;

-- Grant EXECUTE only to authenticated + service_role
GRANT EXECUTE ON FUNCTION public.fifo_deduct(text, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stock(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stock_by_code(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_lot_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_purchase_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_stock_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_purchase_cascade(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_invoice_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_vendor_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_vendor_payment_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_purchase_return_no() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_store_id() TO authenticated;

-- ============================================
-- PART C: RECREATE RLS WITH STORE ISOLATION
-- ============================================
-- Pattern: store_id = user_store_id() OR user_store_id() IS NULL
-- Admin (store_id=NULL) sees ALL stores; Salesman sees own store only

-- --- profiles ---
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users or admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert stock" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

-- --- stock ---
DROP POLICY IF EXISTS "stock_select" ON public.stock;
DROP POLICY IF EXISTS "stock_insert" ON public.stock;
DROP POLICY IF EXISTS "stock_update" ON public.stock;
DROP POLICY IF EXISTS "stock_delete" ON public.stock;
DROP POLICY IF EXISTS "Authenticated users can read stock" ON public.stock;
DROP POLICY IF EXISTS "Anyone can read stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can insert stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can update stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can delete stock" ON public.stock;
DROP POLICY IF EXISTS "stock_all" ON public.stock;

CREATE POLICY "stock_select" ON public.stock
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "stock_insert" ON public.stock
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "stock_update" ON public.stock
  FOR UPDATE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "stock_delete" ON public.stock
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- sales ---
DROP POLICY IF EXISTS "sales_select" ON public.sales;
DROP POLICY IF EXISTS "sales_insert" ON public.sales;
DROP POLICY IF EXISTS "sales_delete" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can read sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can delete sales" ON public.sales;
DROP POLICY IF EXISTS "sales_all" ON public.sales;

CREATE POLICY "sales_select" ON public.sales
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "sales_insert" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- purchases (legacy) ---
DROP POLICY IF EXISTS "purchases_select" ON public.purchases;
DROP POLICY IF EXISTS "purchases_insert" ON public.purchases;
DROP POLICY IF EXISTS "purchases_delete" ON public.purchases;
DROP POLICY IF EXISTS "Anyone can read purchases" ON public.purchases;
DROP POLICY IF EXISTS "purchases_all" ON public.purchases;

CREATE POLICY "purchases_select" ON public.purchases
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "purchases_insert" ON public.purchases
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "purchases_delete" ON public.purchases
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- stock_lots ---
DROP POLICY IF EXISTS "stock_lots_select" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_insert" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_update" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_delete" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can read stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can insert stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can update stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can delete stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_all" ON public.stock_lots;

CREATE POLICY "stock_lots_select" ON public.stock_lots
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "stock_lots_insert" ON public.stock_lots
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "stock_lots_update" ON public.stock_lots
  FOR UPDATE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "stock_lots_delete" ON public.stock_lots
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- sale_lot_allocations ---
DROP POLICY IF EXISTS "alloc_select" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "alloc_insert" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "alloc_delete" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "Anyone can read sale_lot_allocations" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "Anyone can insert sale_lot_allocations" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "Anyone can delete sale_lot_allocations" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "sale_lot_allocations_all" ON public.sale_lot_allocations;

CREATE POLICY "alloc_select" ON public.sale_lot_allocations
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "alloc_insert" ON public.sale_lot_allocations
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "alloc_delete" ON public.sale_lot_allocations
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- stock_adjustments ---
DROP POLICY IF EXISTS "adj_select" ON public.stock_adjustments;
DROP POLICY IF EXISTS "adj_insert" ON public.stock_adjustments;
DROP POLICY IF EXISTS "Anyone can read stock_adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "stock_adjustments_all" ON public.stock_adjustments;

CREATE POLICY "adj_select" ON public.stock_adjustments
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "adj_insert" ON public.stock_adjustments
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- purchase_headers ---
DROP POLICY IF EXISTS "ph_select" ON public.purchase_headers;
DROP POLICY IF EXISTS "ph_insert" ON public.purchase_headers;
DROP POLICY IF EXISTS "ph_update" ON public.purchase_headers;
DROP POLICY IF EXISTS "ph_delete" ON public.purchase_headers;
DROP POLICY IF EXISTS "purchase_headers_all" ON public.purchase_headers;

CREATE POLICY "ph_select" ON public.purchase_headers
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "ph_insert" ON public.purchase_headers
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "ph_update" ON public.purchase_headers
  FOR UPDATE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "ph_delete" ON public.purchase_headers
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- purchase_items ---
DROP POLICY IF EXISTS "pi_select" ON public.purchase_items;
DROP POLICY IF EXISTS "pi_insert" ON public.purchase_items;
DROP POLICY IF EXISTS "pi_delete" ON public.purchase_items;
DROP POLICY IF EXISTS "purchase_items_all" ON public.purchase_items;

CREATE POLICY "pi_select" ON public.purchase_items
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "pi_insert" ON public.purchase_items
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "pi_delete" ON public.purchase_items
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- purchase_item_imeis ---
DROP POLICY IF EXISTS "imei_select" ON public.purchase_item_imeis;
DROP POLICY IF EXISTS "imei_insert" ON public.purchase_item_imeis;
DROP POLICY IF EXISTS "imei_delete" ON public.purchase_item_imeis;
DROP POLICY IF EXISTS "purchase_item_imeis_all" ON public.purchase_item_imeis;

CREATE POLICY "imei_select" ON public.purchase_item_imeis
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "imei_insert" ON public.purchase_item_imeis
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "imei_delete" ON public.purchase_item_imeis
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- purchase_attachments ---
DROP POLICY IF EXISTS "attach_select" ON public.purchase_attachments;
DROP POLICY IF EXISTS "attach_insert" ON public.purchase_attachments;
DROP POLICY IF EXISTS "attach_delete" ON public.purchase_attachments;
DROP POLICY IF EXISTS "purchase_attachments_all" ON public.purchase_attachments;

CREATE POLICY "attach_select" ON public.purchase_attachments
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "attach_insert" ON public.purchase_attachments
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "attach_delete" ON public.purchase_attachments
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- vendors ---
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete" ON public.vendors;
DROP POLICY IF EXISTS "vendors_authenticated" ON public.vendors;

CREATE POLICY "vendors_select" ON public.vendors
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendors_insert" ON public.vendors
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendors_update" ON public.vendors
  FOR UPDATE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendors_delete" ON public.vendors
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- vendor_transactions ---
DROP POLICY IF EXISTS "vendor_tx_select" ON public.vendor_transactions;
DROP POLICY IF EXISTS "vendor_tx_insert" ON public.vendor_transactions;
DROP POLICY IF EXISTS "vendor_tx_authenticated" ON public.vendor_transactions;

CREATE POLICY "vendor_tx_select" ON public.vendor_transactions
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendor_tx_insert" ON public.vendor_transactions
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- vendor_payments ---
DROP POLICY IF EXISTS "vp_select" ON public.vendor_payments;
DROP POLICY IF EXISTS "vp_insert" ON public.vendor_payments;
DROP POLICY IF EXISTS "vp_authenticated" ON public.vendor_payments;

CREATE POLICY "vp_select" ON public.vendor_payments
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vp_insert" ON public.vendor_payments
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- vendor_payment_allocations ---
DROP POLICY IF EXISTS "vpa_select" ON public.vendor_payment_allocations;
DROP POLICY IF EXISTS "vpa_insert" ON public.vendor_payment_allocations;
DROP POLICY IF EXISTS "vpa_authenticated" ON public.vendor_payment_allocations;

CREATE POLICY "vpa_select" ON public.vendor_payment_allocations
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vpa_insert" ON public.vendor_payment_allocations
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- vendor_documents ---
DROP POLICY IF EXISTS "vendor_docs_select" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_insert" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_delete" ON public.vendor_documents;
DROP POLICY IF EXISTS "vendor_docs_authenticated" ON public.vendor_documents;

CREATE POLICY "vendor_docs_select" ON public.vendor_documents
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendor_docs_insert" ON public.vendor_documents
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "vendor_docs_delete" ON public.vendor_documents
  FOR DELETE TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- purchase_returns ---
DROP POLICY IF EXISTS "pr_select" ON public.purchase_returns;
DROP POLICY IF EXISTS "pr_insert" ON public.purchase_returns;
DROP POLICY IF EXISTS "pr_authenticated" ON public.purchase_returns;

CREATE POLICY "pr_select" ON public.purchase_returns
  FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
CREATE POLICY "pr_insert" ON public.purchase_returns
  FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);

-- --- sales_returns (may not exist) ---
DO $$ BEGIN
  DROP POLICY IF EXISTS "sr_select" ON public.sales_returns;
  DROP POLICY IF EXISTS "sr_insert" ON public.sales_returns;
  DROP POLICY IF EXISTS "sr_authenticated" ON public.sales_returns;

  CREATE POLICY "sr_select" ON public.sales_returns
    FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
  CREATE POLICY "sr_insert" ON public.sales_returns
    FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- --- sale_item_imeis (may not exist) ---
DO $$ BEGIN
  DROP POLICY IF EXISTS "sale_imei_select" ON public.sale_item_imeis;
  DROP POLICY IF EXISTS "sale_imei_insert" ON public.sale_item_imeis;
  DROP POLICY IF EXISTS "sale_imei_authenticated" ON public.sale_item_imeis;

  CREATE POLICY "sale_imei_select" ON public.sale_item_imeis
    FOR SELECT TO authenticated USING (store_id = user_store_id() OR user_store_id() IS NULL);
  CREATE POLICY "sale_imei_insert" ON public.sale_item_imeis
    FOR INSERT TO authenticated WITH CHECK (store_id = user_store_id() OR user_store_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================
-- SECURITY HARDENING COMPLETE
-- ============================================
