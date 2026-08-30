-- Step 1: Drop the trigger that auto-creates profiles (causes conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Delete any existing BOD data
DELETE FROM public.profiles WHERE email = 'bod@bmstore.com';
DELETE FROM auth.users WHERE email = 'bod@bmstore.com';

-- Step 3: Create BOD auth user (same pattern as admin/apple/iphone/electronic)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bod@bmstore.com', crypt('bod123', gen_salt('bf')), now(), now(), now(), '', '', '', '');

-- Step 4: Create BOD profile
INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, 'bod@bmstore.com', 'bod', NULL
FROM auth.users
WHERE email = 'bod@bmstore.com';

-- Step 5: Verify
SELECT 'auth_user' as tbl, id, email FROM auth.users WHERE email = 'bod@bmstore.com'
UNION ALL
SELECT 'profile' as tbl, id, email FROM public.profiles WHERE email = 'bod@bmstore.com';
