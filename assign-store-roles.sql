-- Assign roles and store_ids to all 4 accounts
-- Run AFTER creating all accounts via the app (Sign Up)

-- Step 1: Super Admin (sees ALL stores)
UPDATE profiles SET role = 'super_admin', store_id = NULL
WHERE email = 'superadmin@bmstore.com';

-- Step 2: Salesman - Main Store
UPDATE profiles SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000001'
WHERE email = 'sales.main@bmstore.com';

-- Step 3: Salesman - Branch 1
UPDATE profiles SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000002'
WHERE email = 'sales.branch1@bmstore.com';

-- Step 4: Salesman - Branch 2
UPDATE profiles SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000003'
WHERE email = 'sales.branch2@bmstore.com';

-- Verify all accounts
SELECT p.email, p.role, s.name as store_name
FROM profiles p
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.email IN ('superadmin@bmstore.com', 'sales.main@bmstore.com', 'sales.branch1@bmstore.com', 'sales.branch2@bmstore.com')
ORDER BY p.email;
