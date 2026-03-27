import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ClientNav } from '@/components/ClientNav';
import { ProviderNav } from '@/components/ProviderNav';
import { MessageCircle } from 'lucide-react';

export default function MessageList() {
  const { currentUser, getUserThreads, getUserById } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;
  const isClient = currentUser.role === 'client';
  const threads = getUserThreads(currentUser.id);

  const basePath = isClient ? '/client' : '/provider';

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
              const otherId = isClient ? thread.providerId : thread.clientId;
              const other = getUserById(otherId);
              const lastMsg = thread.messages[thread.messages.length - 1];
              return (
                <button
                  key={thread.id}
                  onClick={() => navigate(`${basePath}/messages/${thread.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-display font-bold text-muted-foreground shrink-0">
                      {other?.firstName?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{other?.firstName} {other?.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">
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
