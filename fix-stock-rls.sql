-- Fix: Add INSERT and UPDATE policies on stock table
-- Purchases need to update stock qty, but RLS blocks it

-- Allow inserts on stock
DROP POLICY IF EXISTS "Anyone can insert stock" ON public.stock;
CREATE POLICY "Anyone can insert stock"
  ON public.stock FOR INSERT
  WITH CHECK (true);

-- Allow updates on stock
DROP POLICY IF EXISTS "Anyone can update stock" ON public.stock;
CREATE POLICY "Anyone can update stock"
  ON public.stock FOR UPDATE
  USING (true)
  WITH CHECK (true);
