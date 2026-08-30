-- Fix: Create profile for existing BOD auth user
-- Run this ONLY if create-bod.sql failed with duplicate key error

INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, 'bod@bmstore.com', 'bod', NULL
FROM auth.users
WHERE email = 'bod@bmstore.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'bod@bmstore.com'
);

UPDATE auth.users
SET email_confirmed_at = now(),
    confirmation_token = ''
WHERE email = 'bod@bmstore.com';

SELECT 'BOD profile created: bod@bmstore.com / bod123' AS result;
