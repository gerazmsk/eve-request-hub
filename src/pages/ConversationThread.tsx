import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!thread || !user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await supabase.from('messages').insert({
      thread_id: thread.id,
      sender_id: user.id,
      text: text.trim(),
    });
    setText('');
    queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm text-muted-foreground">
          {otherProfile?.first_name?.[0] || '?'}
        </div>
        <p className="font-medium">{otherProfile?.first_name} {otherProfile?.last_name}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg: any) => {
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
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t bg-card">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full" />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
