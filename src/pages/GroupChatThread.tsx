import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function GroupChatThread() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: group } = useQuery({
    queryKey: ['group-chat', groupId],
    queryFn: async () => {
      const { data } = await supabase.from('group_chats').select('*').eq('id', groupId || '').single();
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      const { data } = await supabase.from('group_chat_members').select('*').eq('group_chat_id', groupId || '');
      return data || [];
    },
  });

  const memberIds = members.map((m: any) => m.user_id);
  const { data: memberProfiles = [] } = useQuery({
    queryKey: ['group-member-profiles', memberIds],
    enabled: memberIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', memberIds);
      return data || [];
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['group-messages', groupId],
    enabled: !!groupId,
    refetchInterval: 3000,
    queryFn: async () => {
      const { data } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_chat_id', groupId || '')
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!group || !user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await supabase.from('group_messages').insert({
      group_chat_id: group.id,
      sender_id: user.id,
      text: text.trim(),
    });
    setText('');
    queryClient.invalidateQueries({ queryKey: ['group-messages', groupId] });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user.id) return 'You';
    const p = memberProfiles.find((p: any) => p.user_id === senderId);
    return p ? `${p.first_name} ${p.last_name}` : 'Unknown';
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{group.name || 'Group Chat'}</p>
          <p className="text-[10px] text-muted-foreground">{members.length} members</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg: any) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5 text-sm', isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-secondary rounded-bl-md')}>
                {!isMe && <p className="text-[10px] font-semibold mb-0.5 opacity-70">{getSenderName(msg.sender_id)}</p>}
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t bg-card">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="flex-1 rounded-full" />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
