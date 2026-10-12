-- =========================================================================
-- GLOBAL FIX: Reconcile Stock by ITEM CODE Across ALL Stores
--
-- Fixes the auto-inflating stock quantity issue where items with 
-- identical or similar names (e.g. Case Pro Cover Iphone 16 Pro Max)
-- had their lot quantities merged and doubled.
--
-- Applies to:
-- 1. BM Apple Iphone Store  (a0000000-0000-0000-0000-000000000001)
-- 2. BM Iphone Store        (a0000000-0000-0000-0000-000000000002)
-- 3. BM Electronic          (a0000000-0000-0000-0000-000000000003)
-- 4. Central Warehouse      (a0000000-0000-0000-0000-000000000004)
-- and any future store created in public.stores
-- =========================================================================

-- STEP 1: Replace reconcile_store_stock to join on item_code (not item_name)
CREATE OR REPLACE FUNCTION public.reconcile_store_stock(p_store_id uuid)
RETURNS void AS $$
BEGIN
  -- 1a. Update stock rows where lot has a matching item_code
  UPDATE public.stock s
  SET 
    qty = COALESCE(sub.q, 0),
    updated_at = NOW()
  FROM (
    SELECT 
      item_code, 
      SUM(qty) AS q
    FROM public.stock_lots
    WHERE store_id = p_store_id
      AND item_code IS NOT NULL
      AND item_code != ''
    GROUP BY item_code
  ) sub
  WHERE s.code = sub.item_code 
    AND s.store_id = p_store_id;

  -- 1b. Fallback: for any older lots without item_code, match by item_name
  -- ONLY if that item_name is unique within the store (prevents multi-code collisions)
  UPDATE public.stock s
  SET 
    qty = COALESCE(sub.q, 0),
    updated_at = NOW()
  FROM (
    SELECT 
      item_name, 
      SUM(qty) AS q
    FROM public.stock_lots
    WHERE store_id = p_store_id
      AND (item_code IS NULL OR item_code = '')
    GROUP BY item_name
  ) sub
  WHERE s.name = sub.item_name 
    AND s.store_id = p_store_id
    AND (
      SELECT COUNT(*) 
      FROM public.stock 
      WHERE name = sub.item_name 
        AND store_id = p_store_id
    ) = 1;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.reconcile_store_stock(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_store_stock(uuid) FROM anon;


-- STEP 2: Function to reconcile ALL stores in one shot
CREATE OR REPLACE FUNCTION public.reconcile_all_stores_stock()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.stores LOOP
    PERFORM public.reconcile_store_stock(r.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.reconcile_all_stores_stock() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_all_stores_stock() FROM anon;


-- STEP 3: Execute the global reconciliation right now for all stores
SELECT public.reconcile_all_stores_stock();


-- STEP 4: Verification - Check for any remaining mismatches across ALL stores
SELECT 
  st.name AS store_name,
  s.code,
  s.name AS item_name,
  s.qty AS stock_qty,
  COALESCE(SUM(l.qty), 0) AS lots_qty,
  CASE 
    WHEN s.qty = COALESCE(SUM(l.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END AS status
FROM public.stock s
JOIN public.stores st ON s.store_id = st.id
LEFT JOIN public.stock_lots l 
  ON s.store_id = l.store_id 
  AND s.code = l.item_code
GROUP BY st.name, s.code, s.name, s.qty
HAVING s.qty != COALESCE(SUM(l.qty), 0)
ORDER BY st.name, CAST(NULLIF(regexp_replace(s.code, '\D', '', 'g'), '') AS integer);
