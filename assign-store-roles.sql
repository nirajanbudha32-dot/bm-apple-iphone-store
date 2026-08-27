-- Assign roles and store_ids to all 4 accounts
-- Run AFTER creating all accounts via the app (Sign Up)

-- Step 1: Admin (sees ALL stores — store_id = NULL)
UPDATE profiles SET role = 'admin', store_id = NULL
WHERE email = 'admin@bmstore.com';

-- Step 2: Salesman - Lakeside (Store 1)
UPDATE profiles SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000001'
WHERE email = 'sales1@bmstore.com';

-- Step 3: Salesman - Newroad (Store 2)
UPDATE profiles SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000002'
WHERE email = 'sales2@bmstore.com';

-- Step 4: Salesman - Airport (Store 3)
UPDATE profiles SET role = 'salesman', store_id = 'a0000000-0000-0000-0000-000000000003'
WHERE email = 'sales3@bmstore.com';

-- Verify all accounts
SELECT p.email, p.role, s.name as store_name
FROM profiles p
LEFT JOIN stores s ON s.id = p.store_id
WHERE p.email IN ('admin@bmstore.com', 'sales1@bmstore.com', 'sales2@bmstore.com', 'sales3@bmstore.com')
ORDER BY p.email;
