-- Fix is_admin() with correct parentheses
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (
        (role = 'admin' AND store_id IS NULL)
        OR (role = 'bod' AND store_id IS NULL)
      )
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
