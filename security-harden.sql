-- ============================================
-- SECURITY HARDENING: RLS + Function Access
-- Run in Supabase SQL Editor
-- ============================================

-- Ensure is_admin() helper exists (used by profiles RLS policy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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

-- ============================================
-- PART C: LOCK DOWN RLS POLICIES
-- ============================================
-- Strategy: Drop ALL old policies, recreate with TO authenticated
-- SELECT is open to all authenticated users
-- Mutations (INSERT/UPDATE/DELETE) restricted to authenticated

-- --- profiles ---
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
DROP POLICY IF EXISTS "Authenticated users can read stock" ON public.stock;
DROP POLICY IF EXISTS "Anyone can read stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can insert stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can update stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can delete stock" ON public.stock;
DROP POLICY IF EXISTS "stock_all" ON public.stock;

CREATE POLICY "stock_select" ON public.stock
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_insert" ON public.stock
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_update" ON public.stock
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "stock_delete" ON public.stock
  FOR DELETE TO authenticated USING (true);

-- --- sales ---
DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can read sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can delete sales" ON public.sales;
DROP POLICY IF EXISTS "sales_all" ON public.sales;

CREATE POLICY "sales_select" ON public.sales
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales_insert" ON public.sales
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sales_delete" ON public.sales
  FOR DELETE TO authenticated USING (true);

-- --- purchases (legacy) ---
DROP POLICY IF EXISTS "Anyone can read purchases" ON public.purchases;
DROP POLICY IF EXISTS "purchases_all" ON public.purchases;

CREATE POLICY "purchases_select" ON public.purchases
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "purchases_insert" ON public.purchases
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "purchases_delete" ON public.purchases
  FOR DELETE TO authenticated USING (true);

-- --- stock_lots ---
DROP POLICY IF EXISTS "Anyone can read stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can insert stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can update stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "Anyone can delete stock_lots" ON public.stock_lots;
DROP POLICY IF EXISTS "stock_lots_all" ON public.stock_lots;

CREATE POLICY "stock_lots_select" ON public.stock_lots
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_lots_insert" ON public.stock_lots
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_lots_update" ON public.stock_lots
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "stock_lots_delete" ON public.stock_lots
  FOR DELETE TO authenticated USING (true);

-- --- sale_lot_allocations ---
DROP POLICY IF EXISTS "Anyone can read sale_lot_allocations" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "Anyone can insert sale_lot_allocations" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "Anyone can delete sale_lot_allocations" ON public.sale_lot_allocations;
DROP POLICY IF EXISTS "sale_lot_allocations_all" ON public.sale_lot_allocations;

CREATE POLICY "alloc_select" ON public.sale_lot_allocations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "alloc_insert" ON public.sale_lot_allocations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "alloc_delete" ON public.sale_lot_allocations
  FOR DELETE TO authenticated USING (true);

-- --- stock_adjustments ---
DROP POLICY IF EXISTS "Anyone can read stock_adjustments" ON public.stock_adjustments;
DROP POLICY IF EXISTS "stock_adjustments_all" ON public.stock_adjustments;

CREATE POLICY "adj_select" ON public.stock_adjustments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "adj_insert" ON public.stock_adjustments
  FOR INSERT TO authenticated WITH CHECK (true);

-- --- purchase_headers ---
DROP POLICY IF EXISTS "purchase_headers_all" ON public.purchase_headers;

CREATE POLICY "ph_select" ON public.purchase_headers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ph_insert" ON public.purchase_headers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ph_update" ON public.purchase_headers
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ph_delete" ON public.purchase_headers
  FOR DELETE TO authenticated USING (true);

-- --- purchase_items ---
DROP POLICY IF EXISTS "purchase_items_all" ON public.purchase_items;

CREATE POLICY "pi_select" ON public.purchase_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pi_insert" ON public.purchase_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pi_delete" ON public.purchase_items
  FOR DELETE TO authenticated USING (true);

-- --- purchase_item_imeis ---
DROP POLICY IF EXISTS "purchase_item_imeis_all" ON public.purchase_item_imeis;

CREATE POLICY "imei_select" ON public.purchase_item_imeis
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "imei_insert" ON public.purchase_item_imeis
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "imei_delete" ON public.purchase_item_imeis
  FOR DELETE TO authenticated USING (true);

-- --- purchase_attachments ---
DROP POLICY IF EXISTS "purchase_attachments_all" ON public.purchase_attachments;

CREATE POLICY "attach_select" ON public.purchase_attachments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "attach_insert" ON public.purchase_attachments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attach_delete" ON public.purchase_attachments
  FOR DELETE TO authenticated USING (true);
