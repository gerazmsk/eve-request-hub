import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ClientNav } from '@/components/ClientNav';
import { ProviderNav } from '@/components/ProviderNav';
import { MessageCircle, Plus, Users } from 'lucide-react';
import { ClickableName } from '@/components/ClickableName';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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

  const otherIds = threads.map(t => isClient ? t.provider_id : t.client_id);
  const { data: otherProfiles = [] } = useQuery({
    queryKey: ['profiles-for-threads', otherIds],
    enabled: otherIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', otherIds);
      return data || [];
    },
  });

  const { data: lastMessages = [] } = useQuery({
    queryKey: ['last-messages', threads.map(t => t.id)],
    enabled: threads.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .in('thread_id', threads.map(t => t.id))
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Group chats
  const { data: groupChats = [] } = useQuery({
    queryKey: ['my-group-chats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('group_chats').select('*');
      return data || [];
    },
  });

  const { data: groupLastMessages = [] } = useQuery({
    queryKey: ['group-last-messages', groupChats.map((g: any) => g.id)],
    enabled: groupChats.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .in('group_chat_id', groupChats.map((g: any) => g.id))
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // For providers: fetch unlocks so we can hide hot lead previews until paid for
  const { data: providerUnlocks = [] } = useQuery({
    queryKey: ['provider-unlocks', user?.id],
    enabled: !!user && !isClient,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_unlocks')
        .select('*')
        .eq('provider_id', user!.id);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-9 w-9"
            onClick={() => navigate(`${basePath}/new-group`)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Group chats */}
        {groupChats.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Group Chats</p>
            {groupChats.map((group: any) => {
              const lastMsg = groupLastMessages.find((m: any) => m.group_chat_id === group.id);
              return (
                <button
                  key={group.id}
                  onClick={() => navigate(`${basePath}/group/${group.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{group.name || 'Group Chat'}</p>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg?.text || 'No messages yet'}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Direct messages */}
        {(threads.length > 0 || groupChats.length > 0) && threads.length > 0 && (
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Direct Messages</p>
        )}
        {threads.length === 0 && groupChats.length === 0 ? (
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
              const isHotLead = !isClient && !thread.request_id;
              const isUnlocked = providerUnlocks.some((u: any) => u.unlock_type === 'thread' && u.target_id === thread.id);
              const locked = isHotLead && !isUnlocked;
              return (
                <button key={thread.id} onClick={() => navigate(`${basePath}/messages/${thread.id}`)} className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-muted-foreground shrink-0">
                      {other?.first_name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      {locked ? (
                        <p className="font-medium text-sm text-muted-foreground">
                          🔒 {other?.first_name?.[0]}*** {other?.last_name?.[0]}*** · Hot Lead
                        </p>
                      ) : (
                        <p className="font-medium text-sm"><ClickableName userId={otherId}>{other?.first_name} {other?.last_name}</ClickableName></p>
                      )}
                      <p className={cn("text-xs text-muted-foreground truncate", locked && "italic blur-[3px] select-none")}>
                        {lastMsg?.text || 'Start a conversation'}
                      </p>
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
