DROP TRIGGER IF EXISTS validate_signup_password_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.validate_signup_password();