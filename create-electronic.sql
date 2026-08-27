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
