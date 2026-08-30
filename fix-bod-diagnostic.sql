-- Diagnostic: Check BOD auth user and profile
SELECT 'auth_user' as tbl, id, email, email_confirmed_at, encrypted_password IS NOT NULL as has_password
FROM auth.users WHERE email = 'bod@bmstore.com'
UNION ALL
SELECT 'profile' as tbl, id, email, NULL, NULL
FROM public.profiles WHERE email = 'bod@bmstore.com';
