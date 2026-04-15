import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClickableName } from '@/components/ClickableName';

export default function RequestDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const { user, profile: authProfile } = useAuth();
  const navigate = useNavigate();

  const { data: req } = useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      const { data } = await supabase.from('service_requests').select('*').eq('id', requestId || '').single();
      return data;
    },
  });

  const otherId = req ? (authProfile?.role === 'client' ? req.provider_id : req.client_id) : null;
  const { data: otherProfile } = useQuery({
    queryKey: ['profile', otherId],
    enabled: !!otherId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', otherId!).single();
      return data;
    },
  });

  if (!req || !user) return null;
  const isClient = authProfile?.role === 'client';

  const handleMessage = async () => {
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('client_id', req.client_id)
      .eq('provider_id', req.provider_id)
      .single();

    const basePath = isClient ? '/client' : '/provider';
    if (existing) {
      navigate(`${basePath}/messages/${existing.id}`);
    } else {
      const { data: newThread } = await supabase
        .from('message_threads')
        .insert({ client_id: req.client_id, provider_id: req.provider_id })
        .select('id')
        .single();
      if (newThread) navigate(`${basePath}/messages/${newThread.id}`);
    }
  };

  return (
    <div className="min-h-screen px-5 py-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="font-display text-xl font-bold">Request Details</h1>
      </div>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div><p className="font-semibold text-lg">{req.event_type}</p></div>
          <StatusBadge status={req.status as any} />
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Event Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {req.event_date}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {req.event_time}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {req.location}</div>
            {req.budget && <p className="text-muted-foreground">Budget: {req.budget}</p>}
            {(req as any).hours && <p className="text-muted-foreground">Hours: {(req as any).hours}</p>}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">{isClient ? 'Provider' : 'Customer'}</h3>
          <p className="text-sm"><ClickableName userId={otherId || ''}>{otherProfile?.first_name} {otherProfile?.last_name}</ClickableName></p>
        </div>
        {req.notes && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-semibold text-sm">Notes</h3>
            <p className="text-sm text-muted-foreground">{req.notes}</p>
          </div>
        )}
        <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleMessage}>
          <MessageCircle className="h-4 w-4 mr-2" />{isClient ? 'Message Provider' : 'Message Customer'}
        </Button>
      </div>
    </div>
  );
}
