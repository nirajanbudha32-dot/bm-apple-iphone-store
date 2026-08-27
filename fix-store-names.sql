-- Fix store names and addresses
-- Run this in Supabase SQL Editor

UPDATE stores SET name = 'BM Apple Iphone Store', address = 'B.N.N.P 10 - Surkhet'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE stores SET name = 'BM Iphone Store', address = 'B.N.N.P 10 - Surkhet'
WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE stores SET name = 'BM Electronic', address = 'B.N.N.P 10 - Surkhet'
WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- Verify
SELECT id, name, address FROM stores ORDER BY name;
