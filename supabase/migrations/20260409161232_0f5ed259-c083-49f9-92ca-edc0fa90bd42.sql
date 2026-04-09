
-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('client', 'provider')),
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create provider_profiles table
CREATE TABLE public.provider_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'photographer',
  title TEXT NOT NULL DEFAULT 'Service Provider',
  location TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  price_label TEXT NOT NULL DEFAULT '',
  rating NUMERIC NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  gallery TEXT[] NOT NULL DEFAULT '{}',
  cover_image TEXT NOT NULL DEFAULT '',
  profile_image TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider profiles are viewable by everyone" ON public.provider_profiles FOR SELECT USING (true);
CREATE POLICY "Providers can insert their own profile" ON public.provider_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update their own profile" ON public.provider_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  budget TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own requests" ON public.service_requests FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "Clients can create requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Providers can update request status" ON public.service_requests FOR UPDATE USING (auth.uid() = provider_id);

-- Create message_threads table
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, provider_id)
);

ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their threads" ON public.message_threads FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "Users can create threads" ON public.message_threads FOR INSERT WITH CHECK (auth.uid() = client_id OR auth.uid() = provider_id);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their threads" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.message_threads t WHERE t.id = thread_id AND (auth.uid() = t.client_id OR auth.uid() = t.provider_id))
);
CREATE POLICY "Users can send messages in their threads" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.message_threads t WHERE t.id = thread_id AND (auth.uid() = t.client_id OR auth.uid() = t.provider_id))
);

-- Create provider_events table
CREATE TABLE public.provider_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  job_cost TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'canceled', 'completed')),
  address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own events" ON public.provider_events FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Providers can create their own events" ON public.provider_events FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update their own events" ON public.provider_events FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete their own events" ON public.provider_events FOR DELETE USING (auth.uid() = provider_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_events_updated_at BEFORE UPDATE ON public.provider_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create auto-profile trigger on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, first_name, last_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'provider' THEN
    INSERT INTO public.provider_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Gallery storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

CREATE POLICY "Gallery images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own gallery images" ON storage.objects FOR UPDATE USING (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own gallery images" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND auth.uid()::text = (storage.foldername(name))[1]);
