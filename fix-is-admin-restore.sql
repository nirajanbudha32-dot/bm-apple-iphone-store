-- Restore is_admin() to original (admin only, no bod)
-- BOD gets access via store_id = NULL in profiles (RLS passes via user_store_id() IS NULL)

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND store_id IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
