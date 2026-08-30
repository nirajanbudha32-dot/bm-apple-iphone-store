SELECT id, email, email_confirmed_at, 
       (encrypted_password IS NOT NULL) as has_password,
       aud, role
FROM auth.users 
WHERE email = 'bod@bmstore.com';
