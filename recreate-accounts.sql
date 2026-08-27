-- ============================================================
-- RECREATE ALL ACCOUNTS (run AFTER remove-all-data.sql)
-- ============================================================

-- Admin
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@bmstore.com';
  IF uid IS NOT NULL THEN
    UPDATE auth.users SET encrypted_password = crypt('admin123', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid;
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@bmstore.com', crypt('admin123', gen_salt('bf')), now(), now(), now(), '', '', '', '');
    SELECT id INTO uid FROM auth.users WHERE email = 'admin@bmstore.com';
  END IF;
  INSERT INTO public.profiles (id, email, role, store_id) VALUES (uid, 'admin@bmstore.com', 'admin', NULL) ON CONFLICT (id) DO UPDATE SET role = 'admin', store_id = NULL;
END $$;

-- BM Apple Iphone Store
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'apple@bmstore.com';
  IF uid IS NOT NULL THEN
    UPDATE auth.users SET encrypted_password = crypt('apple123', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid;
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'apple@bmstore.com', crypt('apple123', gen_salt('bf')), now(), now(), now(), '', '', '', '');
    SELECT id INTO uid FROM auth.users WHERE email = 'apple@bmstore.com';
  END IF;
  INSERT INTO public.profiles (id, email, role, store_id) VALUES (uid, 'apple@bmstore.com', 'salesman', 'a0000000-0000-0000-0000-000000000001') ON CONFLICT (id) DO UPDATE SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000001';
END $$;

-- BM Iphone Store
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'iphone@bmstore.com';
  IF uid IS NOT NULL THEN
    UPDATE auth.users SET encrypted_password = crypt('iphone123', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid;
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'iphone@bmstore.com', crypt('iphone123', gen_salt('bf')), now(), now(), now(), '', '', '', '');
    SELECT id INTO uid FROM auth.users WHERE email = 'iphone@bmstore.com';
  END IF;
  INSERT INTO public.profiles (id, email, role, store_id) VALUES (uid, 'iphone@bmstore.com', 'salesman', 'a0000000-0000-0000-0000-000000000002') ON CONFLICT (id) DO UPDATE SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000002';
END $$;

-- BM Electronic
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'electronic@bmstore.com';
  IF uid IS NOT NULL THEN
    UPDATE auth.users SET encrypted_password = crypt('electronic123', gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE id = uid;
  ELSE
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'electronic@bmstore.com', crypt('electronic123', gen_salt('bf')), now(), now(), now(), '', '', '', '');
    SELECT id INTO uid FROM auth.users WHERE email = 'electronic@bmstore.com';
  END IF;
  INSERT INTO public.profiles (id, email, role, store_id) VALUES (uid, 'electronic@bmstore.com', 'salesman', 'a0000000-0000-0000-0000-000000000003') ON CONFLICT (id) DO UPDATE SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000003';
END $$;

-- Verify
SELECT
  u.email,
  p.role,
  s.name AS store_name,
  CASE WHEN p.store_id IS NULL THEN 'ALL STORES' ELSE s.name END AS access
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.stores s ON s.id = p.store_id
WHERE u.email IN ('admin@bmstore.com', 'apple@bmstore.com', 'iphone@bmstore.com', 'electronic@bmstore.com')
ORDER BY u.email;
