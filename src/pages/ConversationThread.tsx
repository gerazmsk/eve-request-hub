import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function ConversationThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { currentUser, threads, getUserById, sendMessage } = useApp();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = threads.find(t => t.id === threadId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length]);

  if (!thread || !currentUser) return null;

  const otherId = currentUser.id === thread.clientId ? thread.providerId : thread.clientId;
  const other = getUserById(otherId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(thread.id, currentUser.id, text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-sm text-muted-foreground">
          {other?.firstName?.[0]}
        </div>
        <p className="font-medium">{other?.firstName} {other?.lastName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                isMe
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-secondary rounded-bl-md'
              )}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t bg-card">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full"
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
