-- ============================================================
-- FIX: Stock Code Generator - Prevent Duplicate Key Violations
-- Run this in Supabase SQL Editor
-- Uses advisory lock to serialize code generation across
-- concurrent requests and verifies uniqueness before returning
-- ============================================================

CREATE OR REPLACE FUNCTION public.next_stock_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_num integer;
  candidate integer;
BEGIN
  -- Use advisory lock to serialize code generation across concurrent sessions
  PERFORM pg_advisory_xact_lock(hashtext('next_stock_code'));

  -- Extract and cast only numeric codes to integer to find the true mathematical maximum
  SELECT COALESCE(MAX(
    CASE 
      WHEN code ~ '^\d+$' THEN code::integer 
      ELSE 0 
    END
  ), 0) INTO max_num
  FROM public.stock;

  candidate := max_num + 1;

  -- Double-check: verify the candidate doesn't already exist (handles edge cases with non-numeric codes)
  WHILE EXISTS (SELECT 1 FROM public.stock WHERE code = candidate::text) LOOP
    candidate := candidate + 1;
  END LOOP;

  RETURN candidate::text;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.next_stock_code() TO anon, authenticated, service_role;
