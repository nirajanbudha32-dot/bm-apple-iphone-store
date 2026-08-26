-- ============================================
-- LINK VENDOR TO PURCHASE HEADERS
-- Run in Supabase SQL Editor
-- ============================================

ALTER TABLE public.purchase_headers ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id);
CREATE INDEX IF NOT EXISTS idx_purchase_headers_vendor ON public.purchase_headers(vendor_id);
