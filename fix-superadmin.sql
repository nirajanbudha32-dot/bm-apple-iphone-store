-- Fix admin account: ensure role = 'admin', store_id = NULL
-- Run AFTER multi-store-migration.sql

UPDATE profiles SET role = 'admin', store_id = NULL
WHERE email = 'admin@bmstore.com';

-- Verify
SELECT p.email, p.role, p.store_id, s.name as store_name
FROM profiles p
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.email = 'admin@bmstore.com';
