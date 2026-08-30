-- Step 1: Clean up any old profile
DELETE FROM public.profiles WHERE email = 'bod@bmstore.com';

-- Step 2: Create auth user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'bod@bmstore.com',
  crypt('bod123', gen_salt('bf')),
  now(), now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
);

-- Step 3: Create profile
INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, 'bod@bmstore.com', 'bod', NULL
FROM auth.users
WHERE email = 'bod@bmstore.com';

-- Step 4: Verify
SELECT 'auth_user' as tbl, id, email FROM auth.users WHERE email = 'bod@bmstore.com'
UNION ALL
SELECT 'profile' as tbl, id, email FROM public.profiles WHERE email = 'bod@bmstore.com';
