
CREATE TABLE public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  date TEXT NOT NULL,
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (provider_id, date)
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable by everyone"
ON public.provider_availability FOR SELECT USING (true);

CREATE POLICY "Providers can insert their own availability"
ON public.provider_availability FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own availability"
ON public.provider_availability FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own availability"
ON public.provider_availability FOR DELETE USING (auth.uid() = provider_id);

CREATE TRIGGER update_provider_availability_updated_at
BEFORE UPDATE ON public.provider_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
