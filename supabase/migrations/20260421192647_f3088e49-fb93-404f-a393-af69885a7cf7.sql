-- Wipe all user data for fresh testing
DELETE FROM public.credit_transactions;
DELETE FROM public.provider_unlocks;
DELETE FROM public.provider_credits;
DELETE FROM public.reviews;
DELETE FROM public.messages;
DELETE FROM public.group_messages;
DELETE FROM public.group_chat_members;
DELETE FROM public.group_chats;
DELETE FROM public.message_threads;
DELETE FROM public.service_requests;
DELETE FROM public.provider_events;
DELETE FROM public.provider_availability;
DELETE FROM public.provider_profiles;
DELETE FROM public.profiles;
DELETE FROM auth.users;