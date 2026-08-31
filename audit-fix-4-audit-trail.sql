-- ============================================
-- AUDIT FIX 4: Audit Trail Table
-- Run in Supabase SQL Editor AFTER audit-fix-1
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admin can read audit logs
DROP POLICY IF EXISTS "audit_admin_select" ON public.audit_log;
CREATE POLICY "audit_admin_select" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Any authenticated user can insert (for their own actions)
DROP POLICY IF EXISTS "audit_insert" ON public.audit_log;
CREATE POLICY "audit_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
REVOKE ALL ON public.audit_log FROM anon;

-- ============================================
-- AUDIT FIX 4 COMPLETE
-- ============================================
