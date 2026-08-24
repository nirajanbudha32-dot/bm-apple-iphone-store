SELECT p.id, p.email, p.role, u.email as auth_email FROM public.profiles p LEFT JOIN auth.users u ON p.id = u.id;
