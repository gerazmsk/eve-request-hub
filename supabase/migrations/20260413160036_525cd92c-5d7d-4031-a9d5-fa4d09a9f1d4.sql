ALTER TABLE public.provider_profiles
  ADD CONSTRAINT provider_profiles_profile_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;