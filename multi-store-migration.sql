-- ============================================================
-- MULTI-STORE MIGRATION
-- Run this ONCE on Supabase SQL Editor
-- ============================================================

-- PART 1: Create stores table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  pan text DEFAULT '',
  vat_number text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Seed 3 stores
INSERT INTO public.stores (id, name, address, phone, pan, vat_number) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'BM Store - Main', 'Birendranagar, Surkhet', '9800000001', '123456789', '123456789'),
  ('a0000000-0000-0000-0000-000000000002', 'BM Store - Branch 1', 'New Road, Kathmandu', '9800000002', '987654321', '987654321'),
  ('a0000000-0000-0000-0000-000000000003', 'BM Store - Branch 2', 'Lakeside, Pokhara', '9800000003', '456789123', '456789123')
ON CONFLICT (id) DO NOTHING;

-- PART 2: Add store_id to profiles
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- PART 3: Add store_id to ALL data tables
-- ============================================================

-- Stock
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Purchases (legacy)
DO $$ BEGIN
  ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Stock lots
ALTER TABLE public.stock_lots ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Sale lot allocations
ALTER TABLE public.sale_lot_allocations ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Stock adjustments
ALTER TABLE public.stock_adjustments ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Purchase headers
ALTER TABLE public.purchase_headers ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Purchase items (inherits from header, but add for RLS)
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Purchase item IMEIs
ALTER TABLE public.purchase_item_imeis ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Purchase attachments
ALTER TABLE public.purchase_attachments ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Vendors
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Vendor transactions
ALTER TABLE public.vendor_transactions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Vendor payments
ALTER TABLE public.vendor_payments ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Vendor payment allocations
ALTER TABLE public.vendor_payment_allocations ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Vendor documents
ALTER TABLE public.vendor_documents ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Purchase returns
ALTER TABLE public.purchase_returns ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Sales returns
ALTER TABLE public.sales_returns ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- Sale item IMEIs
ALTER TABLE public.sale_item_imeis ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);

-- PART 4: Backfill existing data to default store
-- ============================================================

-- Assign all existing data to the main store
UPDATE public.profiles SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.stock SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.sales SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.stock_lots SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.sale_lot_allocations SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.stock_adjustments SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.purchase_headers SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.purchase_items SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.purchase_item_imeis SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.purchase_attachments SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.vendors SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.vendor_transactions SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.vendor_payments SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.vendor_payment_allocations SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.vendor_documents SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
UPDATE public.purchase_returns SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;

DO $$ BEGIN
  UPDATE public.sales_returns SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE public.sale_item_imeis SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  UPDATE public.purchases SET store_id = 'a0000000-0000-0000-0000-000000000001' WHERE store_id IS NULL;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- PART 5: Create helper functions
-- ============================================================

-- Get current user's store_id
CREATE OR REPLACE FUNCTION public.user_store_id()
RETURNS uuid AS $$
  SELECT store_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if store_owner or above (store_owner or super_admin)
CREATE OR REPLACE FUNCTION public.is_store_owner_or_above()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'store_owner')
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Keep is_admin() for backward compatibility (treats super_admin as admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- PART 6: Drop ALL old RLS policies
-- ============================================================

-- Profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

-- Stock
DROP POLICY IF EXISTS stock_select ON public.stock;
DROP POLICY IF EXISTS stock_insert ON public.stock;
DROP POLICY IF EXISTS stock_update ON public.stock;
DROP POLICY IF EXISTS stock_delete ON public.stock;

-- Sales
DROP POLICY IF EXISTS sales_select ON public.sales;
DROP POLICY IF EXISTS sales_insert ON public.sales;
DROP POLICY IF EXISTS sales_delete ON public.sales;

-- Purchases (legacy)
DROP POLICY IF EXISTS purchases_select ON public.purchases;
DROP POLICY IF EXISTS purchases_insert ON public.purchases;
DROP POLICY IF EXISTS purchases_delete ON public.purchases;

-- Stock lots
DROP POLICY IF EXISTS stock_lots_select ON public.stock_lots;
DROP POLICY IF EXISTS stock_lots_insert ON public.stock_lots;
DROP POLICY IF EXISTS stock_lots_update ON public.stock_lots;
DROP POLICY IF EXISTS stock_lots_delete ON public.stock_lots;

-- Sale lot allocations
DROP POLICY IF EXISTS alloc_select ON public.sale_lot_allocations;
DROP POLICY IF EXISTS alloc_insert ON public.sale_lot_allocations;
DROP POLICY IF EXISTS alloc_delete ON public.sale_lot_allocations;

-- Stock adjustments
DROP POLICY IF EXISTS adj_select ON public.stock_adjustments;
DROP POLICY IF EXISTS adj_insert ON public.stock_adjustments;

-- Purchase headers
DROP POLICY IF EXISTS ph_select ON public.purchase_headers;
DROP POLICY IF EXISTS ph_insert ON public.purchase_headers;
DROP POLICY IF EXISTS ph_update ON public.purchase_headers;
DROP POLICY IF EXISTS ph_delete ON public.purchase_headers;

-- Purchase items
DROP POLICY IF EXISTS pi_select ON public.purchase_items;
DROP POLICY IF EXISTS pi_insert ON public.purchase_items;
DROP POLICY IF EXISTS pi_delete ON public.purchase_items;

-- Purchase item IMEIs
DROP POLICY IF EXISTS imei_select ON public.purchase_item_imeis;
DROP POLICY IF EXISTS imei_insert ON public.purchase_item_imeis;
DROP POLICY IF EXISTS imei_delete ON public.purchase_item_imeis;

-- Purchase attachments
DROP POLICY IF EXISTS attach_select ON public.purchase_attachments;
DROP POLICY IF EXISTS attach_insert ON public.purchase_attachments;
DROP POLICY IF EXISTS attach_delete ON public.purchase_attachments;

-- Vendors
DROP POLICY IF EXISTS vendors_authenticated ON public.vendors;

-- Vendor transactions
DROP POLICY IF EXISTS vendor_tx_authenticated ON public.vendor_transactions;

-- Vendor payments
DROP POLICY IF EXISTS vp_authenticated ON public.vendor_payments;

-- Vendor payment allocations
DROP POLICY IF EXISTS vpa_authenticated ON public.vendor_payment_allocations;

-- Vendor documents
DROP POLICY IF EXISTS vendor_docs_authenticated ON public.vendor_documents;

-- Purchase returns
DROP POLICY IF EXISTS pr_authenticated ON public.purchase_returns;

-- Sales returns
DROP POLICY IF EXISTS sr_authenticated ON public.sales_returns;

-- Sale item IMEIs
DROP POLICY IF EXISTS sale_imei_authenticated ON public.sale_item_imeis;

-- PART 7: Create new per-store RLS policies
-- ============================================================

-- Helper: policy that checks store_id match or super_admin
-- Pattern: USING (is_super_admin() OR store_id = user_store_id())

-- PROFILES
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- STOCK
CREATE POLICY stock_select ON public.stock FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY stock_insert ON public.stock FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

CREATE POLICY stock_update ON public.stock FOR UPDATE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY stock_delete ON public.stock FOR DELETE TO authenticated
  USING (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- SALES
CREATE POLICY sales_select ON public.sales FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY sales_insert ON public.sales FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY sales_delete ON public.sales FOR DELETE TO authenticated
  USING (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- PURCHASES (legacy)
CREATE POLICY purchases_select ON public.purchases FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY purchases_insert ON public.purchases FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY purchases_delete ON public.purchases FOR DELETE TO authenticated
  USING (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- STOCK LOTS
CREATE POLICY stock_lots_select ON public.stock_lots FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY stock_lots_insert ON public.stock_lots FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY stock_lots_update ON public.stock_lots FOR UPDATE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY stock_lots_delete ON public.stock_lots FOR DELETE TO authenticated
  USING (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- SALE LOT ALLOCATIONS
CREATE POLICY alloc_select ON public.sale_lot_allocations FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY alloc_insert ON public.sale_lot_allocations FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY alloc_delete ON public.sale_lot_allocations FOR DELETE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

-- STOCK ADJUSTMENTS
CREATE POLICY adj_select ON public.stock_adjustments FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY adj_insert ON public.stock_adjustments FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- PURCHASE HEADERS
CREATE POLICY ph_select ON public.purchase_headers FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY ph_insert ON public.purchase_headers FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY ph_update ON public.purchase_headers FOR UPDATE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY ph_delete ON public.purchase_headers FOR DELETE TO authenticated
  USING (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- PURCHASE ITEMS
CREATE POLICY pi_select ON public.purchase_items FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY pi_insert ON public.purchase_items FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY pi_delete ON public.purchase_items FOR DELETE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

-- PURCHASE ITEM IMEIs
CREATE POLICY imei_select ON public.purchase_item_imeis FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY imei_insert ON public.purchase_item_imeis FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY imei_delete ON public.purchase_item_imeis FOR DELETE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

-- PURCHASE ATTACHMENTS
CREATE POLICY attach_select ON public.purchase_attachments FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY attach_insert ON public.purchase_attachments FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY attach_delete ON public.purchase_attachments FOR DELETE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

-- VENDORS
CREATE POLICY vendors_select ON public.vendors FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vendors_insert ON public.vendors FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

CREATE POLICY vendors_update ON public.vendors FOR UPDATE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vendors_delete ON public.vendors FOR DELETE TO authenticated
  USING (is_super_admin() OR (store_id = user_store_id() AND is_store_owner_or_above()));

-- VENDOR TRANSACTIONS
CREATE POLICY vendor_tx_select ON public.vendor_transactions FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vendor_tx_insert ON public.vendor_transactions FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

-- VENDOR PAYMENTS
CREATE POLICY vp_select ON public.vendor_payments FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vp_insert ON public.vendor_payments FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

-- VENDOR PAYMENT ALLOCATIONS
CREATE POLICY vpa_select ON public.vendor_payment_allocations FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vpa_insert ON public.vendor_payment_allocations FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

-- VENDOR DOCUMENTS
CREATE POLICY vendor_docs_select ON public.vendor_documents FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vendor_docs_insert ON public.vendor_documents FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

CREATE POLICY vendor_docs_delete ON public.vendor_documents FOR DELETE TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

-- PURCHASE RETURNS
CREATE POLICY pr_select ON public.purchase_returns FOR SELECT TO authenticated
  USING (is_super_admin() OR store_id = user_store_id());

CREATE POLICY pr_insert ON public.purchase_returns FOR INSERT TO authenticated
  WITH CHECK (is_super_admin() OR store_id = user_store_id());

-- SALES RETURNS (may not exist yet)
DO $$ BEGIN
  CREATE POLICY sr_select ON public.sales_returns FOR SELECT TO authenticated
    USING (is_super_admin() OR store_id = user_store_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sr_insert ON public.sales_returns FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR store_id = user_store_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- SALE ITEM IMEIs (may not exist yet)
DO $$ BEGIN
  CREATE POLICY sale_imei_select ON public.sale_item_imeis FOR SELECT TO authenticated
    USING (is_super_admin() OR store_id = user_store_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY sale_imei_insert ON public.sale_item_imeis FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR store_id = user_store_id());
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- PART 8: Add store_id indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stock_store ON public.stock(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_store ON public.sales(store_id);
CREATE INDEX IF NOT EXISTS idx_stock_lots_store ON public.stock_lots(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_headers_store ON public.purchase_headers(store_id);
CREATE INDEX IF NOT EXISTS idx_vendors_store ON public.vendors(store_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_store ON public.vendor_transactions(store_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_store ON public.vendor_payments(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store ON public.profiles(store_id);

-- PART 9: Update handle_new_user trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, store_id)
  VALUES (new.id, new.email, 'salesman', NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PART 10: Create super admin account
-- ============================================================

-- The super admin user will be created via the app or manually:
-- Email: superadmin@bmstore.com
-- Password: SuperAdmin2026!
-- Role: super_admin (set in profiles after signup)
-- Store: NULL (sees all stores)

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
