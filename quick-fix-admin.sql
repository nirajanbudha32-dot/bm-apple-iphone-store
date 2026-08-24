-- ============================================
-- QUICK FIX: Fix RLS Recursion + Set Admin Role
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop bad trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Create SECURITY DEFINER function for admin check (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Fix RLS Policies on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users or admin can update profiles" ON public.profiles;

CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users or admin can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- 4. Fix RLS Policies on stock table
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can insert stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can update stock" ON public.stock;
DROP POLICY IF EXISTS "Admin can delete stock" ON public.stock;

CREATE POLICY "Authenticated users can read stock"
  ON public.stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert stock"
  ON public.stock FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update stock"
  ON public.stock FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can delete stock"
  ON public.stock FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Fix RLS Policies on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;

CREATE POLICY "Authenticated users can read sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sales"
  ON public.sales FOR DELETE
  TO authenticated
  USING (true);

-- 6. Set correct roles for both accounts
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@bmstore.com';
UPDATE public.profiles SET role = 'salesman' WHERE email != 'admin@bmstore.com';

-- 7. Verify result - MUST show admin@bmstore.com = admin, salesman@bmstore.com = salesman
SELECT id, email, role FROM public.profiles;

