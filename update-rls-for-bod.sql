-- Update is_admin() to include BOD role for read access
-- Run this BEFORE create-bod.sql

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (role = 'admin' AND store_id IS NULL)
      OR (role = 'bod' AND store_id IS NULL)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

SELECT 'is_admin() updated to include BOD role' AS result;
