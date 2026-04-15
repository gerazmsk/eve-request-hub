import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClickableName } from '@/components/ClickableName';

export default function ProviderEventDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: req } = useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      const { data } = await supabase.from('service_requests').select('*').eq('id', requestId || '').single();
      return data;
    },
  });

  const { data: client } = useQuery({
    queryKey: ['profile', req?.client_id],
    enabled: !!req,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', req!.client_id).single();
      return data;
    },
  });

  if (!req || !user) return null;

  const handleStatusUpdate = async (status: string) => {
    await supabase.from('service_requests').update({ status }).eq('id', req.id);
    queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
  };

  const handleMessage = async () => {
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('client_id', req.client_id)
      .eq('provider_id', user.id)
      .single();

    if (existing) {
      navigate(`/provider/messages/${existing.id}`);
    } else {
      const { data: newThread } = await supabase
        .from('message_threads')
        .insert({ client_id: req.client_id, provider_id: user.id })
        .select('id')
        .single();
      if (newThread) navigate(`/provider/messages/${newThread.id}`);
    }
  };

  return (
    <div className="min-h-screen px-5 py-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="font-display text-xl font-bold">Event Details</h1>
      </div>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{req.event_type}</h2>
          <StatusBadge status={req.status as any} />
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Event Information</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {req.event_date}</p>
            <p className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {req.event_time}</p>
            <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {req.location}</p>
            {req.budget && <p className="text-muted-foreground">Budget: {req.budget}</p>}
            {(req as any).hours && <p className="text-muted-foreground">Hours: {(req as any).hours}</p>}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Customer</h3>
          <p className="text-sm"><ClickableName userId={req.client_id}>{client?.first_name} {client?.last_name}</ClickableName></p>
        </div>
        {req.notes && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-semibold text-sm">Notes from Customer</h3>
            <p className="text-sm text-muted-foreground">{req.notes}</p>
          </div>
        )}
        <div className="space-y-3 pt-2">
          {req.status === 'pending' && (
            <>
              <Button className="w-full rounded-xl h-12 text-base" onClick={() => handleStatusUpdate('confirmed')}>Confirm Request</Button>
              <Button variant="outline" className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleStatusUpdate('declined')}>Decline Request</Button>
            </>
          )}
          <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleMessage}>
            <MessageCircle className="h-4 w-4 mr-2" />Message Customer
          </Button>
        </div>
      </div>
    </div>
  );
}
