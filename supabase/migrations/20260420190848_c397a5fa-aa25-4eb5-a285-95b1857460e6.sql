-- Ensure profile generation runs for new accounts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enforce valid profile roles for safer role separation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_valid'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_valid CHECK (role IN ('client', 'provider'));
  END IF;
END $$;

-- Prevent duplicate paid unlocks for the same provider + item
CREATE UNIQUE INDEX IF NOT EXISTS provider_unlocks_once_per_target
ON public.provider_unlocks (provider_id, unlock_type, target_id);

-- Prevent duplicate request-specific conversations
CREATE UNIQUE INDEX IF NOT EXISTS message_threads_once_per_request
ON public.message_threads (client_id, provider_id, request_id)
WHERE request_id IS NOT NULL;

-- Prevent duplicate general client/provider conversations
CREATE UNIQUE INDEX IF NOT EXISTS message_threads_once_per_pair_without_request
ON public.message_threads (client_id, provider_id)
WHERE request_id IS NULL;

-- Backend password validation for account creation
CREATE OR REPLACE FUNCTION public.validate_signup_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.encrypted_password IS NOT NULL THEN
    IF NEW.encrypted_password = crypt(lower(NEW.encrypted_password), NEW.encrypted_password) THEN
      RAISE EXCEPTION 'Password must include at least one uppercase letter';
    END IF;

    IF NEW.encrypted_password = crypt(regexp_replace(NEW.encrypted_password, '[^A-Za-z0-9]', '', 'g'), NEW.encrypted_password) THEN
      RAISE EXCEPTION 'Password must include at least one special character';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_signup_password_trigger ON auth.users;
CREATE TRIGGER validate_signup_password_trigger
BEFORE INSERT OR UPDATE OF encrypted_password ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.validate_signup_password();