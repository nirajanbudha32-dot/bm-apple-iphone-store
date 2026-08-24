-- ============================================
-- BM iPhone Store - Create Accounts
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- 1. Fix profiles policies (remove recursion)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do all" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Authenticated can read all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Allow anyone to read stock
DROP POLICY IF EXISTS "Authenticated users can read stock" ON public.stock;
DROP POLICY IF EXISTS "Anyone can read stock" ON public.stock;
CREATE POLICY "Anyone can read stock" ON public.stock FOR SELECT USING (true);

-- 3. Allow anyone to read/insert/delete sales
DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can read sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can delete sales" ON public.sales;
CREATE POLICY "Anyone can read sales" ON public.sales FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sales" ON public.sales FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete sales" ON public.sales FOR DELETE USING (true);

-- 4. Create Admin account
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, confirmation_token, 
  recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@bmstore.com',
  crypt('admin123', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', ''
);

-- 5. Create Salesman account
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, created_at, updated_at, confirmation_token, 
  recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'sales@bmstore.com',
  crypt('sales123', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', ''
);

-- 6. Set Admin role
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'admin@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 7. Set Salesman role
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'salesman' FROM auth.users WHERE email = 'sales@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'salesman';
