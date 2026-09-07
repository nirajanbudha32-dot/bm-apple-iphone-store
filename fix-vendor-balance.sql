-- ============================================
-- FIX VENDOR BALANCE: insert_vendor_txn RPC + backfill
-- Run in Supabase SQL Editor
-- ============================================

-- Step 1: Fix insert_vendor_txn RPC — simple SUM(debit) - SUM(credit) without type filtering
CREATE OR REPLACE FUNCTION public.insert_vendor_txn(
  p_vendor_id uuid,
  p_txn_type text,
  p_ref_no text,
  p_ref_id uuid,
  p_txn_date text,
  p_debit numeric,
  p_credit numeric,
  p_remarks text,
  p_store_id uuid
)
RETURNS void AS $$
DECLARE
  v_prev_balance numeric;
  v_new_balance numeric;
BEGIN
  -- Compute previous balance: sum of ALL debits - sum of ALL credits
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

-- Step 2: Backfill all vendor_transactions.balance using running sum per vendor
-- This fixes any stale balance values from the old incorrect RPC
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

SELECT 'insert_vendor_txn RPC fixed + all balances backfilled' as result;
