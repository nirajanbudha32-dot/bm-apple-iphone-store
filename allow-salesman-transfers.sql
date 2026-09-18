-- Allow salesmen to create stock transfers from their store
-- Run in Supabase SQL Editor

-- stock_transfers INSERT: allow if from_store matches user's store OR user is admin (store_id NULL)
DROP POLICY IF EXISTS "st_insert" ON public.stock_transfers;
CREATE POLICY "st_insert" ON public.stock_transfers
  FOR INSERT TO authenticated
  WITH CHECK (
    from_store_id = public.user_store_id()
    OR public.user_store_id() IS NULL
  );

-- stock_transfer_items INSERT: parent transfer already RLS-gated
DROP POLICY IF EXISTS "sti_insert" ON public.stock_transfer_items;
CREATE POLICY "sti_insert" ON public.stock_transfer_items
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- stock_transfers DELETE: allow own store transfers + admin
DROP POLICY IF EXISTS "st_delete" ON public.stock_transfers;
CREATE POLICY "st_delete" ON public.stock_transfers
  FOR DELETE TO authenticated
  USING (
    from_store_id = public.user_store_id()
    OR public.user_store_id() IS NULL
    OR public.is_admin()
  );

-- stock_transfer_items DELETE: parent gated
DROP POLICY IF EXISTS "sti_delete" ON public.stock_transfer_items;
CREATE POLICY "sti_delete" ON public.stock_transfer_items
  FOR DELETE TO authenticated
  USING (true);

SELECT 'RLS policies updated: salesmen can now create transfers from their store' AS result;
