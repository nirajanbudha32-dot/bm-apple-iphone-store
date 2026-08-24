-- Allow anyone to read stock (even before login)
DROP POLICY IF EXISTS "Authenticated users can read stock" ON public.stock;
CREATE POLICY "Anyone can read stock"
  ON public.stock FOR SELECT
  USING (true);

-- Allow anyone to read sales
DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
CREATE POLICY "Anyone can read sales"
  ON public.sales FOR SELECT
  USING (true);

-- Allow anyone to insert sales
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
CREATE POLICY "Anyone can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (true);

-- Allow anyone to delete sales
DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
CREATE POLICY "Anyone can delete sales"
  ON public.sales FOR DELETE
  USING (true);
