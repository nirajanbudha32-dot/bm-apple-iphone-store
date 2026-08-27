-- Stock Transfer tables
-- Run AFTER multi-store-migration.sql and security-harden.sql

CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_no text UNIQUE NOT NULL,
  date text NOT NULL,
  from_store_id uuid REFERENCES public.stores(id),
  to_store_id uuid REFERENCES public.stores(id),
  status text NOT NULL DEFAULT 'COMPLETED',
  remarks text DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  item_name text NOT NULL,
  lot_id uuid REFERENCES public.stock_lots(id),
  qty integer NOT NULL CHECK (qty > 0),
  imei text,
  purchase_price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Sequence for transfer numbers
CREATE SEQUENCE IF NOT EXISTS public.transfer_no_seq START 1;

CREATE OR REPLACE FUNCTION public.next_transfer_no()
RETURNS text AS $$
  SELECT 'TRF-' || lpad(nextval('public.transfer_no_seq')::text, 4, '0');
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS: admin-only access
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "st_select" ON public.stock_transfers;
DROP POLICY IF EXISTS "st_insert" ON public.stock_transfers;
DROP POLICY IF EXISTS "st_delete" ON public.stock_transfers;
DROP POLICY IF EXISTS "sti_select" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "sti_insert" ON public.stock_transfer_items;
DROP POLICY IF EXISTS "sti_delete" ON public.stock_transfer_items;

CREATE POLICY "st_select" ON public.stock_transfers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "st_insert" ON public.stock_transfers
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "st_delete" ON public.stock_transfers
  FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "sti_select" ON public.stock_transfer_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sti_insert" ON public.stock_transfer_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "sti_delete" ON public.stock_transfer_items
  FOR DELETE TO authenticated USING (public.is_admin());

-- Grants
GRANT SELECT, INSERT, DELETE ON public.stock_transfers TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.stock_transfer_items TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_transfer_no() TO authenticated;

REVOKE ALL ON public.stock_transfers FROM anon;
REVOKE ALL ON public.stock_transfer_items FROM anon;
REVOKE EXECUTE ON FUNCTION public.next_transfer_no() FROM anon;
