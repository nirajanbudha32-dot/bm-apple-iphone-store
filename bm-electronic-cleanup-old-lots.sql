-- =========================================================================
-- BM ELECTRONIC: Verify Stock Quantities (6 Items)
-- Store: BM Eletronic (Store ID: a0000000-0000-0000-0000-000000000003)
--
-- NOTE: Old LOT-XXXX lots CANNOT be deleted — they are referenced by
--       stock_transfer_items (FK constraint). They are already zeroed (qty=0).
--       The query below uses SUM of all lots to correctly show MATCH status.
--
-- Items:
--   Code 391 | Iphone 11 Pro Max 256 GB   | Expected Qty: 2
--   Code 395 | Iphone 13 128 GB           | Expected Qty: 3
--   Code 397 | Iphone 13 Pro Max 128 GB   | Expected Qty: 2
--   Code 398 | Iphone 14 128 Gb           | Expected Qty: 3
--   Code 399 | Iphone 14 Plus 128 GB      | Expected Qty: 2
--   Code 403 | Iphone 15 128 GB           | Expected Qty: 2
--
-- Run this in your Supabase SQL Editor.
-- =========================================================================

-- =========================================================
-- Verification: SUM all lots per item (handles old LOT-XXXX
-- records with qty=0 that cannot be deleted due to FK refs)
-- All 6 items should show MATCH
-- =========================================================
SELECT
  s.name                      AS store_name,
  st.code,
  st.name                     AS item_name,
  st.qty                      AS stock_qty,
  COALESCE(SUM(sl.qty), 0)    AS total_lot_qty,
  CASE
    WHEN st.qty = COALESCE(SUM(sl.qty), 0) THEN 'MATCH'
    ELSE 'MISMATCH'
  END                         AS status
FROM public.stock st
JOIN public.stores s ON s.id = st.store_id
LEFT JOIN public.stock_lots sl
  ON  sl.item_code = st.code
  AND sl.store_id  = st.store_id
WHERE st.store_id = 'a0000000-0000-0000-0000-000000000003'
  AND st.code IN ('391','395','397','398','399','403')
GROUP BY s.name, st.code, st.name, st.qty
ORDER BY CAST(st.code AS integer);
