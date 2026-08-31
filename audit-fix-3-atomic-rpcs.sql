-- ============================================
-- AUDIT FIX 3: Atomic RPC Functions
-- Replaces all read-modify-write anti-patterns with atomic operations
-- Run in Supabase SQL Editor AFTER audit-fix-2
-- ============================================

-- ============================================
-- adjust_lot_qty: Atomic lot quantity increment/decrement
-- Replaces: SELECT qty -> JS compute -> UPDATE qty
-- ============================================
CREATE OR REPLACE FUNCTION public.adjust_lot_qty(
  p_lot_id uuid,
  p_delta integer
)
RETURNS void AS $$
BEGIN
  UPDATE public.stock_lots
  SET qty = GREATEST(0, qty + p_delta)
  WHERE id = p_lot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- reconcile_stock_from_lots: Atomic stock qty reconciliation
-- Replaces: SELECT all lots -> sum in JS -> UPDATE stock
-- ============================================
CREATE OR REPLACE FUNCTION public.reconcile_stock_from_lots(
  p_item_name text,
  p_store_id uuid
)
RETURNS void AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT COALESCE(SUM(qty), 0) INTO v_total
  FROM public.stock_lots
  WHERE item_name = p_item_name
    AND (p_store_id IS NULL OR store_id = p_store_id);

  UPDATE public.stock
  SET qty = GREATEST(0, v_total), updated_at = now()
  WHERE name = p_item_name
    AND (p_store_id IS NULL OR store_id = p_store_id);

  -- If stock row doesn't exist but lots have qty > 0, create it
  IF NOT FOUND AND v_total > 0 THEN
    INSERT INTO public.stock (code, name, category, sub_category, brand, sub_brand,
      model, unit, qty, purchase_price, selling_price, store_id)
    VALUES (
      LPAD(nextval('public.stock_code_seq')::text, 6, '0'),
      p_item_name, 'General', '', '', '', '', 'PCS',
      v_total, 0, 0, p_store_id
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- adjust_purchase_balance: Atomic purchase header balance update
-- Replaces: SELECT remaining/paid -> JS compute -> UPDATE
-- ============================================
CREATE OR REPLACE FUNCTION public.adjust_purchase_balance(
  p_header_id uuid,
  p_paid_delta numeric,
  p_remaining_delta numeric
)
RETURNS void AS $$
BEGIN
  UPDATE public.purchase_headers
  SET paid_amount = paid_amount + p_paid_delta,
      remaining_balance = GREATEST(0, remaining_balance + p_remaining_delta)
  WHERE id = p_header_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- insert_vendor_txn: Atomic vendor transaction with computed balance
-- Replaces: getVendorBalance() -> compute in JS -> INSERT with stale balance
-- ============================================
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
  -- Compute previous balance atomically within the same transaction
  SELECT COALESCE(
    SUM(CASE
      WHEN transaction_type IN ('PURCHASE', 'OPENING_BALANCE', 'ADVANCE_APPLIED')
      THEN debit ELSE 0
    END)
    - SUM(CASE
      WHEN transaction_type NOT IN ('PURCHASE', 'OPENING_BALANCE', 'ADVANCE_APPLIED')
      THEN credit ELSE 0
    END),
    0
  ) INTO v_prev_balance
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

-- ============================================
-- adjust_stock_by_code: Atomic stock qty adjustment by item code
-- ============================================
CREATE OR REPLACE FUNCTION public.adjust_stock_by_code(
  p_code text,
  p_delta integer
)
RETURNS void AS $$
BEGIN
  UPDATE public.stock
  SET qty = GREATEST(0, qty + p_delta), updated_at = now()
  WHERE code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- GRANT/REVOKE
-- ============================================

GRANT EXECUTE ON FUNCTION public.adjust_lot_qty(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_stock_from_lots(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_purchase_balance(uuid, numeric, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_vendor_txn(uuid, text, text, uuid, text, numeric, numeric, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock_by_code(text, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.adjust_lot_qty(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reconcile_stock_from_lots(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.adjust_purchase_balance(uuid, numeric, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.insert_vendor_txn(uuid, text, text, uuid, text, numeric, numeric, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.adjust_stock_by_code(text, integer) FROM anon;

-- ============================================
-- AUDIT FIX 3 COMPLETE
-- ============================================
