import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { ClickableName } from '@/components/ClickableName';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const UNLOCK_COST = 1;
const REACTIVATION_DAYS = 60;
const REACTIVATION_MS = REACTIVATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Find the most recent "reactivation point" in a thread.
 * A reactivation point is a client message that arrives ≥60 days after the previous message
 * from either party. The first message of a hot-lead thread (no request_id) is also a
 * reactivation point — that's the initial unlock.
 * Returns the timestamp (ms) of that message, or null if no reactivation gate applies.
 */
function findReactivationPoint(
  messages: Array<{ created_at: string; sender_id: string }>,
  clientId: string,
  isHotLead: boolean,
): number | null {
  if (!messages.length) return null;
  let latest: number | null = null;
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const ts = new Date(msg.created_at).getTime();
    if (msg.sender_id !== clientId) continue;
    if (i === 0) {
      if (isHotLead) latest = ts;
      continue;
    }
    const prevTs = new Date(messages[i - 1].created_at).getTime();
    if (ts - prevTs >= REACTIVATION_MS) latest = ts;
  }
  return latest;
}

export default function ConversationThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const isClient = profile?.role === 'client';

  const { data: thread } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: async () => {
      const { data } = await supabase.from('message_threads').select('*').eq('id', threadId || '').single();
      return data;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', threadId],
    enabled: !!threadId,
    refetchInterval: 3000, // Poll every 3s for new messages
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId || '')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  const otherId = thread ? (user?.id === thread.client_id ? thread.provider_id : thread.client_id) : null;
  const { data: otherProfile } = useQuery({
    queryKey: ['profile', otherId],
    enabled: !!otherId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', otherId!).single();
      return data;
    },
  });

  // For providers: check if this thread is unlocked. A new unlock is required for:
  //   1. Initial hot leads (threads created without a request_id), AND
  //   2. Re-engagements where the client sends a message ≥60 days after the previous one.
  const isProvider = profile?.role === 'provider';
  const isHotLead = !!thread && !thread.request_id && thread.provider_id === user?.id;
  const providerOnThread = !!thread && isProvider && thread.provider_id === user?.id;

  const { data: unlocks = [] } = useQuery({
    queryKey: ['thread-unlocks', thread?.id, user?.id],
    enabled: !!thread && providerOnThread,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_unlocks')
        .select('id, created_at')
        .eq('provider_id', user!.id)
        .eq('unlock_type', 'thread')
        .eq('target_id', thread!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const reactivationPoint = thread
    ? findReactivationPoint(messages as any, thread.client_id, isHotLead)
    : null;
  const latestUnlockTs = unlocks[0] ? new Date((unlocks[0] as any).created_at).getTime() : null;
  const isReactivated =
    providerOnThread &&
    reactivationPoint !== null &&
    !isHotLead &&
    (latestUnlockTs === null || latestUnlockTs < reactivationPoint);
  const locked =
    providerOnThread &&
    reactivationPoint !== null &&
    (latestUnlockTs === null || latestUnlockTs < reactivationPoint);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!thread || !user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (locked) {
      toast.error('Unlock this lead first to reply.');
      return;
    }
    await supabase.from('messages').insert({
      thread_id: thread.id,
      sender_id: user.id,
      text: text.trim(),
    });
    setText('');
    queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
  };

  const handleUnlock = async () => {
    const { data, error } = await supabase.rpc('unlock_provider_target' as any, {
      _unlock_type: 'thread',
      _target_id: thread.id,
      _cost: UNLOCK_COST,
    });
    if (error || !(data as any)?.ok) {
      toast.error((data as any)?.reason === 'insufficient_credits' ? 'Not enough credits to unlock this lead' : 'Failed to unlock lead');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['thread-unlocks', thread.id, user.id] });
    queryClient.invalidateQueries({ queryKey: ['provider-credits'] });
    queryClient.invalidateQueries({ queryKey: ['provider-unlocks'] });
    toast.success(isReactivated ? 'Reactivated lead unlocked!' : 'Lead unlocked!');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm text-muted-foreground">
          {locked ? <Lock className="h-4 w-4" /> : (otherProfile?.first_name?.[0] || '?')}
        </div>
        {locked ? (
          <p className="font-medium text-muted-foreground">
            {otherProfile?.first_name?.[0]}*** {otherProfile?.last_name?.[0]}***
          </p>
        ) : (
          <p className="font-medium"><ClickableName userId={otherId || ''}>{otherProfile?.first_name} {otherProfile?.last_name}</ClickableName></p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {locked ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 space-y-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">This is a Hot Lead</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                A client messaged you directly. Unlock to view their messages and reply ({UNLOCK_COST} credit).
              </p>
            </div>
            {messages[0] && (
              <div className="rounded-lg bg-muted/50 p-3 max-w-xs w-full">
                <p className="text-sm text-muted-foreground italic blur-[3px] select-none">
                  {(messages[0] as any).text?.substring(0, 80) || 'Message preview...'}
                </p>
              </div>
            )}
            <Button onClick={handleUnlock} className="rounded-xl gap-1.5">
              <Unlock className="h-4 w-4" />
              Unlock Lead ({UNLOCK_COST} credit)
            </Button>
          </div>
        ) : messages.map((msg: any) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary rounded-bl-md')}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {!locked && (
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t bg-card">
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full" />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      )}
    </div>
  );
}
