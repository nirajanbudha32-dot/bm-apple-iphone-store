-- Fix Super Admin account
-- Run this in Supabase SQL Editor

-- Step 1: Check what exists
SELECT u.id, u.email, p.role, p.store_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'superadmin@bmstore.com';

-- Step 2: Create or update the super admin profile
INSERT INTO profiles (id, email, role, store_id)
SELECT id, email, 'super_admin', NULL
FROM auth.users
WHERE email = 'superadmin@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin', store_id = NULL;

-- Step 3: Also fix admin account to be store_owner for Main store
INSERT INTO profiles (id, email, role, store_id)
SELECT id, email, 'store_owner', 'a0000000-0000-0000-0000-000000000001'
FROM auth.users
WHERE email = 'admin@bmstore.com'
ON CONFLICT (id) DO UPDATE SET role = 'store_owner', store_id = 'a0000000-0000-0000-0000-000000000001';
