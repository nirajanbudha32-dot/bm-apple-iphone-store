-- Fix store names to Pokhara locations
-- Run this in Supabase SQL Editor

UPDATE stores SET name = 'BM Store - Lakeside', address = 'Lakeside, Pokhara'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE stores SET name = 'BM Store - Newroad', address = 'Newroad, Pokhara'
WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE stores SET name = 'BM Store - Airport', address = 'Airport, Pokhara'
WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- Verify
SELECT id, name, address FROM stores ORDER BY name;
