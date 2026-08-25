-- ============================================================
-- FIX: Next Stock Code Generator Function
-- Run this in Supabase SQL Editor
-- Safely finds the true numeric maximum stock code and returns next code
-- ============================================================

CREATE OR REPLACE FUNCTION public.next_stock_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num integer;
BEGIN
  -- Extract and cast only numeric codes to integer to find the true mathematical maximum
  SELECT COALESCE(MAX(
    CASE 
      WHEN code ~ '^\d+$' THEN code::integer 
      ELSE 0 
    END
  ), 0) INTO max_num
  FROM public.stock;

  RETURN (max_num + 1)::text;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.next_stock_code() TO anon, authenticated, service_role;
