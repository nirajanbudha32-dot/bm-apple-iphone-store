-- ============================================
-- DO NOT RUN - This file is SUPERSEDED.
-- Running this will break multi-store data isolation.
-- Use: multi-store-migration.sql + create-accounts.sql + security-harden.sql
-- ============================================
CREATE POLICY "Anyone can insert stock"
  ON public.stock FOR INSERT
  WITH CHECK (true);

-- Allow updates on stock
DROP POLICY IF EXISTS "Anyone can update stock" ON public.stock;
CREATE POLICY "Anyone can update stock"
  ON public.stock FOR UPDATE
  USING (true)
  WITH CHECK (true);
