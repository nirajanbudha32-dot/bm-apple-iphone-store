-- ================================================================
-- FIX VENDOR TRANSACTIONS & RPC
-- Run this in your Supabase SQL Editor
-- ================================================================

-- 1. Drop existing overloaded functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.insert_vendor_txn(uuid, text, text, uuid, text, numeric, numeric, text);
DROP FUNCTION IF EXISTS public.insert_vendor_txn(uuid, text, text, uuid, text, numeric, numeric, text, uuid);

-- 2. Create the robust, atomic insert_vendor_txn RPC
CREATE OR REPLACE FUNCTION public.insert_vendor_txn(
  p_vendor_id uuid,
  p_txn_type text,
  p_ref_no text DEFAULT '',
  p_ref_id uuid DEFAULT NULL,
  p_txn_date text DEFAULT CURRENT_DATE::text,
  p_debit numeric DEFAULT 0,
  p_credit numeric DEFAULT 0,
  p_remarks text DEFAULT '',
  p_store_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_prev_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Compute previous balance: sum of all debits minus sum of all credits
  SELECT COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0)
  INTO v_prev_balance
  FROM public.vendor_transactions
  WHERE vendor_id = p_vendor_id;

  v_new_balance := COALESCE(v_prev_balance, 0) + COALESCE(p_debit, 0) - COALESCE(p_credit, 0);

  INSERT INTO public.vendor_transactions (
    vendor_id, transaction_type, reference_no, reference_id,
    transaction_date, debit, credit, balance, remarks, store_id
  ) VALUES (
    p_vendor_id, p_txn_type, COALESCE(p_ref_no, ''), p_ref_id,
    p_txn_date, COALESCE(p_debit, 0), COALESCE(p_credit, 0), v_new_balance, COALESCE(p_remarks, ''), p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant execute permissions to both authenticated and anon
GRANT EXECUTE ON FUNCTION public.insert_vendor_txn(uuid, text, text, uuid, text, numeric, numeric, text, uuid) TO authenticated, anon, service_role;

-- 4. Ensure table permissions & RLS on vendor_transactions
GRANT ALL ON public.vendor_transactions TO authenticated, anon, service_role;

ALTER TABLE public.vendor_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendor_tx_all" ON public.vendor_transactions;
DROP POLICY IF EXISTS "vendor_tx_authenticated" ON public.vendor_transactions;

CREATE POLICY "vendor_tx_all" ON public.vendor_transactions
  FOR ALL TO public USING (true) WITH CHECK (true);

-- 5. Backfill existing running balances in vendor_transactions (if any exist)
WITH ranked AS (
  SELECT id,
    SUM(debit - credit) OVER (
      PARTITION BY vendor_id
      ORDER BY transaction_date, created_at
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance
  FROM public.vendor_transactions
)
UPDATE public.vendor_transactions vt
SET balance = r.running_balance
FROM ranked r
WHERE vt.id = r.id;

SELECT 'Vendor transaction RPC and permissions successfully fixed!' AS status;
