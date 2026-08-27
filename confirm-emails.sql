-- Confirm all unconfirmed emails
-- Run AFTER creating accounts via the app

UPDATE auth.users SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- Verify
SELECT email, email_confirmed_at IS NOT NULL as confirmed
FROM auth.users
WHERE email IN ('admin@bmstore.com', 'sales1@bmstore.com', 'sales2@bmstore.com', 'sales3@bmstore.com');
