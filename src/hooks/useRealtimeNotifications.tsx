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
            queryClient.invalidateQueries({ queryKey: ['open-requests'] });
          }
          if (row.client_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            queryClient.invalidateQueries({ queryKey: ['client-requests'] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests' },
        (payload) => {
          const row = payload.new as any;
          const oldRow = payload.old as any;
          // Notify client when provider updates status
          if (row.client_id === user.id && row.status !== oldRow.status) {
            if (row.status === 'confirmed') {
              toast.success('Your request was accepted! 🎉', { description: `${row.event_type} on ${row.event_date}` });
            } else if (row.status === 'declined') {
              toast.error('Your request was declined', { description: `${row.event_type} on ${row.event_date}` });
            } else {
              toast.info(`Request status updated to ${row.status}`, { description: `${row.event_type}` });
            }
            queryClient.invalidateQueries({ queryKey: ['my-requests'] });
            queryClient.invalidateQueries({ queryKey: ['client-requests'] });
            queryClient.invalidateQueries({ queryKey: ['request'] });
          }
          // Notify provider of status changes
          if (row.provider_id === user.id && row.status !== oldRow.status) {
            queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
            queryClient.invalidateQueries({ queryKey: ['open-requests'] });
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
            queryClient.invalidateQueries({ queryKey: ['messages'] });
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
