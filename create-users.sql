DELETE FROM public.sales;
DELETE FROM public.stock;
DELETE FROM public.profiles;
DELETE FROM auth.users;

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

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin' FROM auth.users WHERE email = 'admin@bmstore.com'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'salesman' FROM auth.users WHERE email = 'salesman@bmstore.com'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;
