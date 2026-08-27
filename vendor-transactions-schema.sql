-- ============================================
-- DO NOT RUN - This file is SUPERSEDED.
-- Running this will break multi-store data isolation.
-- Use: multi-store-migration.sql + create-accounts.sql + security-harden.sql
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendor_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE RESTRICT,
  transaction_type text NOT NULL,
  reference_no text DEFAULT '',
  reference_id uuid,
  transaction_date text NOT NULL,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_tx_vendor ON public.vendor_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_tx_date ON public.vendor_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_vendor_tx_type ON public.vendor_transactions(transaction_type);

ALTER TABLE public.vendor_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_tx_authenticated" ON public.vendor_transactions;
CREATE POLICY "vendor_tx_authenticated" ON public.vendor_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON public.vendor_transactions TO authenticated;
REVOKE ALL ON public.vendor_transactions FROM anon;
