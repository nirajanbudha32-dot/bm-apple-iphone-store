-- ============================================
-- VENDOR DOCUMENTS
-- Run in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text DEFAULT '',
  file_size integer DEFAULT 0,
  file_data text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vd_vendor ON public.vendor_documents(vendor_id);

ALTER TABLE public.vendor_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vd_authenticated" ON public.vendor_documents;
CREATE POLICY "vd_authenticated" ON public.vendor_documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.vendor_documents TO authenticated;
REVOKE ALL ON public.vendor_documents FROM anon;
