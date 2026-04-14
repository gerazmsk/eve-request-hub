
-- Group chats
CREATE TABLE public.group_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_chat_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_chat_id, user_id)
);

ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_chat_id UUID NOT NULL REFERENCES public.group_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- RLS for group_chats
CREATE POLICY "Members can view their group chats"
ON public.group_chats FOR SELECT
USING (EXISTS (SELECT 1 FROM public.group_chat_members m WHERE m.group_chat_id = id AND m.user_id = auth.uid()));

CREATE POLICY "Users can create group chats"
ON public.group_chats FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update group chats"
ON public.group_chats FOR UPDATE
USING (auth.uid() = created_by);

-- RLS for group_chat_members
CREATE POLICY "Members can view group members"
ON public.group_chat_members FOR SELECT
USING (EXISTS (SELECT 1 FROM public.group_chat_members m2 WHERE m2.group_chat_id = group_chat_id AND m2.user_id = auth.uid()));

CREATE POLICY "Group creators can add members"
ON public.group_chat_members FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.group_chats g WHERE g.id = group_chat_id AND g.created_by = auth.uid()));

-- RLS for group_messages
CREATE POLICY "Members can view group messages"
ON public.group_messages FOR SELECT
USING (EXISTS (SELECT 1 FROM public.group_chat_members m WHERE m.group_chat_id = group_chat_id AND m.user_id = auth.uid()));

CREATE POLICY "Members can send group messages"
ON public.group_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.group_chat_members m WHERE m.group_chat_id = group_chat_id AND m.user_id = auth.uid()));

-- Provider credits
CREATE TABLE public.provider_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own credits"
ON public.provider_credits FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own credits"
ON public.provider_credits FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update own credits"
ON public.provider_credits FOR UPDATE
USING (auth.uid() = provider_id);

CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'debit',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can insert own transactions"
ON public.credit_transactions FOR INSERT
WITH CHECK (auth.uid() = provider_id);

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
