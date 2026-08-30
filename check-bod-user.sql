-- Check if auth user exists
SELECT 'auth_user' as tbl, id, email, email_confirmed_at, aud, role
FROM auth.users WHERE email = 'bod@bmstore.com';
