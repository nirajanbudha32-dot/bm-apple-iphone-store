-- Change default passwords for all accounts
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/moavwfubvalkxgfcntmy/sql/new

-- Admin
UPDATE auth.users
SET encrypted_password = encode(crypt('Bm@dm1n2026!', gen_salt('bf')), 'base64')
WHERE email = 'admin@bmstore.com';

-- BM Apple Iphone Store
UPDATE auth.users
SET encrypted_password = encode(crypt('Bm@ppl32026!', gen_salt('bf')), 'base64')
WHERE email = 'apple@bmstore.com';

-- BM Iphone Store
UPDATE auth.users
SET encrypted_password = encode(crypt('Bm!ph0n32026!', gen_salt('bf')), 'base64')
WHERE email = 'iphone@bmstore.com';

-- BM Electronic
UPDATE auth.users
SET encrypted_password = encode(crypt('Bm@l3ctr2026!', gen_salt('bf')), 'base64')
WHERE email = 'electronic@bmstore.com';

-- BOD (Board of Directors)
UPDATE auth.users
SET encrypted_password = encode(crypt('Bm@b0d2026!', gen_salt('bf')), 'base64')
WHERE email = 'bod@bmstore.com';
