import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ClientNav } from '@/components/ClientNav';
import { ProviderNav } from '@/components/ProviderNav';
import { MessageCircle } from 'lucide-react';
import { ClickableName } from '@/components/ClickableName';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function MessageList() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const isClient = profile?.role === 'client';
  const basePath = isClient ? '/client' : '/provider';

  const { data: threads = [] } = useQuery({
    queryKey: ['threads', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('message_threads')
        .select('*')
        .or(`client_id.eq.${user!.id},provider_id.eq.${user!.id}`);
      return data || [];
    },
  });

  // Fetch other user profiles
  const otherIds = threads.map(t => isClient ? t.provider_id : t.client_id);
  const { data: otherProfiles = [] } = useQuery({
    queryKey: ['profiles-for-threads', otherIds],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', otherIds);
      return data || [];
    },
  });

  // Fetch last message for each thread
  const { data: lastMessages = [] } = useQuery({
    queryKey: ['last-messages', threads.map(t => t.id)],
    enabled: threads.length > 0,
    queryFn: async () => {
      // Get all messages for all threads, we'll pick last per thread
      const { data } = await supabase
        .from('messages')
        .select('*')
        .in('thread_id', threads.map(t => t.id))
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <h1 className="font-display text-2xl font-bold">Messages</h1>
        {threads.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(thread => {
              const otherId = isClient ? thread.provider_id : thread.client_id;
              const other = otherProfiles.find((p: any) => p.user_id === otherId);
              const lastMsg = lastMessages.find((m: any) => m.thread_id === thread.id);
              return (
                <button key={thread.id} onClick={() => navigate(`${basePath}/messages/${thread.id}`)} className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-muted-foreground shrink-0">
                      {other?.first_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm"><ClickableName userId={otherId}>{other?.first_name} {other?.last_name}</ClickableName></p>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg?.text || 'Start a conversation'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {isClient ? <ClientNav /> : <ProviderNav />}
    </div>
  );
}
