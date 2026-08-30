-- Fix: Reset BOD password and confirm account
UPDATE auth.users
SET encrypted_password = crypt('bod123', gen_salt('bf')),
    email_confirmed_at = now(),
    confirmation_token = ''
WHERE email = 'bod@bmstore.com';

SELECT 'Password reset done. Login: bod@bmstore.com / bod123' AS result;
