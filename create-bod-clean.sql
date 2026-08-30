-- Create BOD auth user + profile from scratch

-- 1. Create auth user
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

-- 2. Create profile linked to auth user
INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, 'bod@bmstore.com', 'bod', NULL
FROM auth.users
WHERE email = 'bod@bmstore.com';

SELECT 'BOD created: bod@bmstore.com / bod123' AS result;
