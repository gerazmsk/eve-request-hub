import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'service_requests' },
        (payload) => {
          const row = payload.new as any;
          if (row.provider_id === user.id) {
            setUnreadRequests(prev => prev + 1);
            toast.info('New request received', { description: `${row.event_type} on ${row.event_date}` });
            queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
          }
          if (row.client_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as any;
          if (row.sender_id !== user.id) {
            setUnreadMessages(prev => prev + 1);
            toast.info('New message received');
            queryClient.invalidateQueries({ queryKey: ['message-threads'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const clearUnreadRequests = () => setUnreadRequests(0);
  const clearUnreadMessages = () => setUnreadMessages(0);

  return { unreadRequests, unreadMessages, clearUnreadRequests, clearUnreadMessages };
}
