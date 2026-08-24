-- Step 1: Find and drop ALL triggers on profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles' LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON public.profiles';
  END LOOP;
  FOR r IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users' AND event_object_schema = 'auth' LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON auth.users';
  END LOOP;
END $$;

-- Step 2: Also drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Clean slate
DELETE FROM public.sales;
DELETE FROM public.stock;
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Step 4: Create Admin user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'admin@bmstore.com',
  crypt('BM2026@', gen_salt('bf')),
  now(), now(), now(), '', '', '', ''
);

-- Step 5: Create Salesman user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
  'authenticated', 'authenticated', 'salesman@bmstore.com',
  crypt('Salesman@2026', gen_salt('bf')),
  now(), now(), now(), '', '', '', ''
);

-- Step 6: Create profiles
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'admin@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'salesman' FROM auth.users WHERE email = 'salesman@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'salesman';

-- Step 7: Verify
SELECT id, email, role FROM public.profiles;
