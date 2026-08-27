-- Create additional accounts for BM Store
-- Run AFTER multi-store-migration.sql

-- 1. Store Owner for Branch 1
-- Email: owner.branch1@bmstore.com
-- Password: Branch1@2026
-- (Run signup via app, then update profile):
-- UPDATE profiles SET role = 'store_owner', store_id = 'a0000000-0000-0000-0000-000000000002' WHERE email = 'owner.branch1@bmstore.com';

-- 2. Super Admin (sees ALL stores)
-- Email: superadmin@bmstore.com
-- Password: SuperAdmin2026!
-- (Run signup via app, then update profile):
-- UPDATE profiles SET role = 'super_admin', store_id = NULL WHERE email = 'superadmin@bmstore.com';

-- ============================================================
-- If accounts already exist, just update their roles:
-- ============================================================

-- Super Admin
UPDATE profiles SET role = 'super_admin', store_id = NULL
WHERE email = 'superadmin@bmstore.com';

-- Store Owner - Branch 1
UPDATE profiles SET role = 'store_owner', store_id = 'a0000000-0000-0000-0000-000000000002'
WHERE email = 'owner.branch1@bmstore.com';

-- Existing admin account - assign to Main store
UPDATE profiles SET role = 'store_owner', store_id = 'a0000000-0000-0000-0000-000000000001'
WHERE email = 'admin@bmstore.com';
