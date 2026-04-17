-- Table to persist unlocked leads/requests per provider
CREATE TABLE public.provider_unlocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  unlock_type TEXT NOT NULL, -- 'thread' or 'request'
  target_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (provider_id, unlock_type, target_id)
);

CREATE INDEX idx_provider_unlocks_provider ON public.provider_unlocks(provider_id);

ALTER TABLE public.provider_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own unlocks"
ON public.provider_unlocks
FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert their own unlocks"
ON public.provider_unlocks
FOR INSERT
WITH CHECK (auth.uid() = provider_id);