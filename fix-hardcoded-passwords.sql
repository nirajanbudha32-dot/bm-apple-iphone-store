-- ============================================
-- CLEANUP: Remove hardcoded passwords from SQL files
-- Run in Supabase SQL Editor
-- ============================================

-- The following files contain hardcoded plaintext passwords:
--   - FINAL-setup.sql (admin123, sales123)
--   - quick-fix-admin.sql (admin123 in crypt)
--   - create-users.sql
--   - add-default-admin-user.sql
--
-- These are one-time setup scripts. For production:
-- 1. Change passwords via Supabase Dashboard > Auth > Users
-- 2. Remove these files from the repo
-- 3. Optionally use BFG Repo Cleaner to scrub from git history:
--    bfg --delete-files FINAL-setup.sql
--    bfg --delete-files quick-fix-admin.sql
--    bfg --delete-files create-users.sql
--    bfg --delete-files add-default-admin-user.sql
--    git reflog expire --expire=now --all && git gc --prune=now --aggressive

-- Verify current admin password hashes are strong
SELECT id, email,
  CASE
    WHEN encrypted_password = crypt('admin123', encrypted_password) THEN 'WEAK - admin123'
    WHEN encrypted_password = crypt('sales123', encrypted_password) THEN 'WEAK - sales123'
    ELSE 'OK (custom password)'
  END as password_strength
FROM auth.users;
