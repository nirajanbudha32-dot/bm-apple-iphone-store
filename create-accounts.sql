-- ============================================================
-- CREATE ALL ACCOUNTS
-- Run AFTER multi-store-migration.sql in Supabase SQL Editor
-- Creates 4 users in auth.users + profiles with roles/stores
-- ============================================================

-- Step 1: Admin (sees ALL stores — store_id = NULL)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@bmstore.com',
  crypt('admin123', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', ''
);

INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, email, 'admin', NULL
FROM auth.users WHERE email = 'admin@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', store_id = NULL;

-- Step 2: Salesman - Lakeside (Store 1)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'sales1@bmstore.com',
  crypt('sales123', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', ''
);

INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, email, 'salesman', 'a0000000-0000-0000-0000-000000000001'
FROM auth.users WHERE email = 'sales1@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000001';

-- Step 3: Salesman - Newroad (Store 2)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'sales2@bmstore.com',
  crypt('sales123', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', ''
);

INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, email, 'salesman', 'a0000000-0000-0000-0000-000000000002'
FROM auth.users WHERE email = 'sales2@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000002';

-- Step 4: Salesman - Airport (Store 3)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'sales3@bmstore.com',
  crypt('sales123', gen_salt('bf')),
  now(), now(), now(),
  '', '', '', ''
);

INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, email, 'salesman', 'a0000000-0000-0000-0000-000000000003'
FROM auth.users WHERE email = 'sales3@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000003';

-- ============================================================
-- VERIFY: All 4 accounts
-- ============================================================
SELECT
  u.email,
  p.role,
  s.name AS store_name,
  CASE WHEN u.email_confirmed_at IS NOT NULL THEN 'Yes' ELSE 'No' END AS confirmed
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.stores s ON s.id = p.store_id
WHERE u.email IN ('admin@bmstore.com', 'sales1@bmstore.com', 'sales2@bmstore.com', 'sales3@bmstore.com')
ORDER BY u.email;
