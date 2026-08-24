-- Fix RLS policies to use auth.uid() instead of current_setting
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "Authenticated users can read stock" ON public.stock;
CREATE POLICY "Authenticated users can read stock"
  ON public.stock FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read sales" ON public.sales;
CREATE POLICY "Authenticated users can read sales"
  ON public.sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;
CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete sales" ON public.sales;
CREATE POLICY "Authenticated users can delete sales"
  ON public.sales FOR DELETE
  USING (auth.uid() IS NOT NULL);
