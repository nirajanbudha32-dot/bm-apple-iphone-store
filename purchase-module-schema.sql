-- ============================================================
-- DO NOT RUN - This file is SUPERSEDED.
-- Running this will break multi-store data isolation.
-- Use: multi-store-migration.sql + create-accounts.sql + security-harden.sql
-- ============================================================

-- 1. Purchase Headers (one row per purchase bill)
CREATE TABLE IF NOT EXISTS public.purchase_headers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_no           text NOT NULL UNIQUE,
  supplier_invoice_no   text DEFAULT '',
  date                  text NOT NULL,
  supplier_name         text NOT NULL DEFAULT '',
  supplier_address      text DEFAULT '',
  supplier_pan          text DEFAULT '',
  supplier_vat          text DEFAULT '',
  purchase_type         text NOT NULL DEFAULT 'Cash',
  due_date              text DEFAULT '',
  remarks               text DEFAULT '',
  payment_method        text NOT NULL DEFAULT 'Cash',
  gross_amount          numeric NOT NULL DEFAULT 0,
  discount              numeric NOT NULL DEFAULT 0,
  taxable_amount        numeric NOT NULL DEFAULT 0,
  vat_rate              numeric NOT NULL DEFAULT 13,
  vat_amount            numeric NOT NULL DEFAULT 0,
  other_charges         numeric NOT NULL DEFAULT 0,
  grand_total           numeric NOT NULL DEFAULT 0,
  paid_amount           numeric NOT NULL DEFAULT 0,
  remaining_balance     numeric NOT NULL DEFAULT 0,
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now()
);

-- 2. Purchase Items (one row per line item in a purchase bill)
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_header_id    uuid REFERENCES public.purchase_headers(id) ON DELETE CASCADE,
  sn                    integer NOT NULL DEFAULT 1,
  item_code             text NOT NULL DEFAULT '',
  item_name             text NOT NULL,
  category              text DEFAULT '',
  sub_category          text DEFAULT '',
  brand                 text DEFAULT '',
  model                 text DEFAULT '',
  unit                  text DEFAULT 'PCS',
  qty                   integer NOT NULL DEFAULT 0,
  rate                  numeric NOT NULL DEFAULT 0,
  discount              numeric NOT NULL DEFAULT 0,
  amount                numeric NOT NULL DEFAULT 0,
  taxable_amount        numeric NOT NULL DEFAULT 0,
  vat_rate              numeric NOT NULL DEFAULT 13,
  vat_amount            numeric NOT NULL DEFAULT 0,
  total                 numeric NOT NULL DEFAULT 0,
  lot_no                text DEFAULT '',
  created_at            timestamptz DEFAULT now()
);

-- 3. Purchase Item IMEIs (for serialized items like phones)
CREATE TABLE IF NOT EXISTS public.purchase_item_imeis (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_item_id      uuid REFERENCES public.purchase_items(id) ON DELETE CASCADE,
  imei                  text NOT NULL,
  created_at            timestamptz DEFAULT now()
);

-- 4. Purchase Attachments
CREATE TABLE IF NOT EXISTS public.purchase_attachments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_header_id    uuid REFERENCES public.purchase_headers(id) ON DELETE CASCADE,
  file_name             text NOT NULL,
  file_type             text DEFAULT '',
  file_size             integer DEFAULT 0,
  file_data             text DEFAULT '',
  created_at            timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_purchase_headers_date ON public.purchase_headers(date);
CREATE INDEX IF NOT EXISTS idx_purchase_headers_purchase_no ON public.purchase_headers(purchase_no);
CREATE INDEX IF NOT EXISTS idx_purchase_headers_supplier ON public.purchase_headers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_purchase_items_header ON public.purchase_items(purchase_header_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_item_code ON public.purchase_items(item_code);
CREATE INDEX IF NOT EXISTS idx_purchase_item_imeis_item ON public.purchase_item_imeis(purchase_item_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_header ON public.purchase_attachments(purchase_header_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE public.purchase_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_item_imeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_attachments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_headers_all' AND tablename = 'purchase_headers') THEN
    CREATE POLICY purchase_headers_all ON public.purchase_headers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_items_all' AND tablename = 'purchase_items') THEN
    CREATE POLICY purchase_items_all ON public.purchase_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_item_imeis_all' AND tablename = 'purchase_item_imeis') THEN
    CREATE POLICY purchase_item_imeis_all ON public.purchase_item_imeis FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'purchase_attachments_all' AND tablename = 'purchase_attachments') THEN
    CREATE POLICY purchase_attachments_all ON public.purchase_attachments FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- GRANTS
-- ============================================================
GRANT ALL ON public.purchase_headers TO authenticated, anon, service_role;
GRANT ALL ON public.purchase_items TO authenticated, anon, service_role;
GRANT ALL ON public.purchase_item_imeis TO authenticated, anon, service_role;
GRANT ALL ON public.purchase_attachments TO authenticated, anon, service_role;

-- ============================================================
-- FUNCTION: Generate next purchase number (PUR-0001, PUR-0002, ...)
-- ============================================================
CREATE OR REPLACE FUNCTION public.next_purchase_no()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'PUR-' || LPAD(
    (COALESCE(
      (SELECT MAX(CAST(SUBSTRING(purchase_no FROM 5) AS integer)) FROM public.purchase_headers),
      0
    ) + 1)::text,
    4, '0'
  );
$$;

-- ============================================================
-- FUNCTION: Delete purchase header and restore stock/lots
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_purchase_cascade(p_header_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_rec RECORD;
  lot_rec RECORD;
BEGIN
  -- For each purchase item, restore stock and delete lots
  FOR item_rec IN
    SELECT pi.item_code, pi.item_name, pi.qty, pi.id as item_id
    FROM public.purchase_items pi
    WHERE pi.purchase_header_id = p_header_id
  LOOP
    -- Find and delete associated lots
    FOR lot_rec IN
      SELECT l.id
      FROM public.stock_lots l
      WHERE l.purchase_id = item_rec.item_id
    LOOP
      -- Delete sale_lot_allocations for this lot (if any)
      DELETE FROM public.sale_lot_allocations WHERE lot_id = lot_rec.id;
      -- Delete the lot
      DELETE FROM public.stock_lots WHERE id = lot_rec.id;
    END LOOP;

    -- Restore stock qty
    UPDATE public.stock
    SET qty = GREATEST(0, qty - item_rec.qty),
        updated_at = now()
    WHERE code = item_rec.item_code;
  END LOOP;

  -- Delete IMEIs
  DELETE FROM public.purchase_item_imeis
  WHERE purchase_item_id IN (
    SELECT id FROM public.purchase_items WHERE purchase_header_id = p_header_id
  );

  -- Delete purchase items
  DELETE FROM public.purchase_items WHERE purchase_header_id = p_header_id;

  -- Delete attachments
  DELETE FROM public.purchase_attachments WHERE purchase_header_id = p_header_id;

  -- Delete the header
  DELETE FROM public.purchase_headers WHERE id = p_header_id;
END;
$$;
