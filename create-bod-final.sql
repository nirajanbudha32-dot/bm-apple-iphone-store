-- Step 1: Create auth user (ignore if exists)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'bod@bmstore.com',
  crypt('bod123', gen_salt('bf')),
  now(), now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'bod@bmstore.com'
);

-- Step 2: Upsert profile (insert or update if exists)
INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, 'bod@bmstore.com', 'bod', NULL
FROM auth.users
WHERE email = 'bod@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'bod', store_id = NULL;

-- Step 3: Verify both exist
SELECT 'auth_user' as tbl, id, email FROM auth.users WHERE email = 'bod@bmstore.com'
UNION ALL
SELECT 'profile' as tbl, id, email FROM public.profiles WHERE email = 'bod@bmstore.com';
