-- ============================================================
-- Migration: Store-Scoped Item Codes + Global Vendors
-- Run this SQL in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: Store-Scoped Item Codes
-- Each store gets its own independent item code sequence.
-- ─────────────────────────────────────────────────────────────

-- 1a. Create store-scoped function to get next stock code
CREATE OR REPLACE FUNCTION public.next_stock_code_for_store(p_store_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num integer;
  candidate integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('next_stock_code'));

  SELECT COALESCE(MAX(
    CASE
      WHEN code ~ '^\d+$' THEN code::integer
      ELSE 0
    END
  ), 0) INTO max_num
  FROM public.stock
  WHERE store_id = p_store_id;

  candidate := max_num + 1;

  WHILE EXISTS (SELECT 1 FROM public.stock WHERE code = candidate::text AND store_id = p_store_id) LOOP
    candidate := candidate + 1;
  END LOOP;

  RETURN candidate::text;
END;
$$;

-- 1b. Drop the global unique constraint on stock.code
-- and replace with a composite unique on (code, store_id)
ALTER TABLE public.stock DROP CONSTRAINT IF EXISTS stock_code_key;
ALTER TABLE public.stock ADD CONSTRAINT stock_code_store_unique UNIQUE (code, store_id);

-- ─────────────────────────────────────────────────────────────
-- PART 2: Global Vendors (shared across all stores)
-- ─────────────────────────────────────────────────────────────

-- 2a. Alter insert_vendor_txn RPC to default store_id to NULL
CREATE OR REPLACE FUNCTION public.insert_vendor_txn(
  p_vendor_id uuid,
  p_txn_type text,
  p_ref_no text,
  p_ref_id uuid,
  p_txn_date text,
  p_debit numeric,
  p_credit numeric,
  p_remarks text,
  p_store_id uuid DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_prev_balance numeric;
  v_new_balance numeric;
BEGIN
  SELECT COALESCE(SUM(debit), 0) - COALESCE(SUM(credit), 0), 0
  INTO v_prev_balance
  FROM public.vendor_transactions
  WHERE vendor_id = p_vendor_id;

  v_new_balance := v_prev_balance + p_debit - p_credit;

  INSERT INTO public.vendor_transactions (
    vendor_id, transaction_type, reference_no, reference_id,
    transaction_date, debit, credit, balance, remarks, store_id
  ) VALUES (
    p_vendor_id, p_txn_type, p_ref_no, p_ref_id,
    p_txn_date, p_debit, p_credit, v_new_balance, p_remarks, p_store_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2b. Set all existing vendor store_ids to NULL (make them global)
UPDATE public.vendors SET store_id = NULL;
UPDATE public.vendor_transactions SET store_id = NULL;
UPDATE public.vendor_payments SET store_id = NULL;
UPDATE public.vendor_payment_allocations SET store_id = NULL;
UPDATE public.vendor_documents SET store_id = NULL;

-- 2b. Drop store-scoped RLS policies on vendor tables
DROP POLICY IF EXISTS vendors_select ON public.vendors;
DROP POLICY IF EXISTS vendors_insert ON public.vendors;
DROP POLICY IF EXISTS vendors_update ON public.vendors;
DROP POLICY IF EXISTS vendors_delete ON public.vendors;

DROP POLICY IF EXISTS vendor_transactions_select ON public.vendor_transactions;
DROP POLICY IF EXISTS vendor_transactions_insert ON public.vendor_transactions;
DROP POLICY IF EXISTS vendor_transactions_update ON public.vendor_transactions;
DROP POLICY IF EXISTS vendor_transactions_delete ON public.vendor_transactions;

DROP POLICY IF EXISTS vendor_payments_select ON public.vendor_payments;
DROP POLICY IF EXISTS vendor_payments_insert ON public.vendor_payments;
DROP POLICY IF EXISTS vendor_payments_update ON public.vendor_payments;
DROP POLICY IF EXISTS vendor_payments_delete ON public.vendor_payments;

DROP POLICY IF EXISTS vendor_payment_allocations_select ON public.vendor_payment_allocations;
DROP POLICY IF EXISTS vendor_payment_allocations_insert ON public.vendor_payment_allocations;
DROP POLICY IF EXISTS vendor_payment_allocations_update ON public.vendor_payment_allocations;
DROP POLICY IF EXISTS vendor_payment_allocations_delete ON public.vendor_payment_allocations;

DROP POLICY IF EXISTS vendor_documents_select ON public.vendor_documents;
DROP POLICY IF EXISTS vendor_documents_insert ON public.vendor_documents;
DROP POLICY IF EXISTS vendor_documents_update ON public.vendor_documents;
DROP POLICY IF EXISTS vendor_documents_delete ON public.vendor_documents;

-- 2c. Create global RLS policies (all authenticated users see all vendors)
-- vendors
CREATE POLICY vendors_select ON public.vendors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY vendors_insert ON public.vendors
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendors_update ON public.vendors
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY vendors_delete ON public.vendors
  FOR DELETE TO authenticated USING (true);

-- vendor_transactions
CREATE POLICY vendor_transactions_select ON public.vendor_transactions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY vendor_transactions_insert ON public.vendor_transactions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendor_transactions_update ON public.vendor_transactions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY vendor_transactions_delete ON public.vendor_transactions
  FOR DELETE TO authenticated USING (true);

-- vendor_payments
CREATE POLICY vendor_payments_select ON public.vendor_payments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY vendor_payments_insert ON public.vendor_payments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendor_payments_update ON public.vendor_payments
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY vendor_payments_delete ON public.vendor_payments
  FOR DELETE TO authenticated USING (true);

-- vendor_payment_allocations
CREATE POLICY vendor_payment_allocations_select ON public.vendor_payment_allocations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY vendor_payment_allocations_insert ON public.vendor_payment_allocations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendor_payment_allocations_update ON public.vendor_payment_allocations
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY vendor_payment_allocations_delete ON public.vendor_payment_allocations
  FOR DELETE TO authenticated USING (true);

-- vendor_documents
CREATE POLICY vendor_documents_select ON public.vendor_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY vendor_documents_insert ON public.vendor_documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY vendor_documents_update ON public.vendor_documents
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY vendor_documents_delete ON public.vendor_documents
  FOR DELETE TO authenticated USING (true);
