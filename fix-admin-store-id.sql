-- Fix admin account: reset store_id to NULL so isAdmin evaluates to true
-- Run AFTER multi-store-migration.sql and create-accounts.sql

-- Step 1: Fix admin profile
UPDATE profiles SET store_id = NULL WHERE email = 'admin@bmstore.com';

-- Step 2: Verify
SELECT email, role, store_id,
  CASE WHEN store_id IS NULL THEN 'OK - sees ALL stores' ELSE 'BROKEN - locked to one store' END AS status
FROM profiles
WHERE email IN ('admin@bmstore.com', 'sales1@bmstore.com', 'sales2@bmstore.com', 'sales3@bmstore.com')
ORDER BY email;
