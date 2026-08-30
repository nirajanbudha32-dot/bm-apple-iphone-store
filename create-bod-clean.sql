-- Create BOD profile for existing auth user (skip if profile exists)

INSERT INTO public.profiles (id, email, role, store_id)
SELECT id, 'bod@bmstore.com', 'bod', NULL
FROM auth.users
WHERE email = 'bod@bmstore.com'
ON CONFLICT (id) DO NOTHING;

SELECT 'BOD profile ready: bod@bmstore.com / bod123' AS result;
