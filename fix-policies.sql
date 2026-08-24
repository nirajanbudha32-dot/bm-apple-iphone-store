-- Fix infinite recursion in profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON public.profiles;

-- Simple policies without recursion
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Allow service role to manage all profiles (for admin functions)
CREATE POLICY "Service role can do all"
  ON public.profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to read all profiles (for user management)
CREATE POLICY "Authenticated can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');
