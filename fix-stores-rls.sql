ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stores_select" ON public.stores;
CREATE POLICY "stores_select" ON public.stores
  FOR SELECT TO authenticated USING (status = 'active');

DROP POLICY IF EXISTS "stores_admin_all" ON public.stores;
CREATE POLICY "stores_admin_all" ON public.stores
  FOR ALL TO authenticated USING (public.is_admin());

GRANT SELECT ON public.stores TO authenticated;
REVOKE ALL ON public.stores FROM anon;
