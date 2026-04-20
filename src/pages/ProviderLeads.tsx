import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProviderNav } from '@/components/ProviderNav';
import { StatusBadge } from '@/components/StatusBadge';
import { ClickableName } from '@/components/ClickableName';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Unlock, Flame, Megaphone, MessageCircle, Eye, Send, CreditCard } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CATEGORIES } from '@/types';

const UNLOCK_COST = 1;

export default function ProviderLeads() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);

  // Credits
  const { data: credits } = useQuery({
    queryKey: ['provider-credits', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('provider_credits').select('*').eq('provider_id', user!.id).maybeSingle();
      if (!data) {
        // Initialize credits
        const { data: newCredits } = await supabase
          .from('provider_credits')
          .insert({ provider_id: user!.id, balance: 10 })
          .select()
          .single();
        return newCredits;
      }
      return data;
    },
  });

  // Hot leads
  const { data: hotLeadThreads = [] } = useQuery({
    queryKey: ['hot-leads', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('message_threads')
        .select('*')
        .eq('provider_id', user!.id)
        .is('request_id', null);
      return data || [];
    },
  });

  const hotLeadClientIds = [...new Set(hotLeadThreads.map(t => t.client_id))];
  const { data: hotLeadProfiles = [] } = useQuery({
    queryKey: ['hot-lead-profiles', hotLeadClientIds],
    enabled: hotLeadClientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', hotLeadClientIds);
      return data || [];
    },
  });

  const { data: firstMessages = [] } = useQuery({
    queryKey: ['hot-lead-messages', hotLeadThreads.map(t => t.id)],
    enabled: hotLeadThreads.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .in('thread_id', hotLeadThreads.map(t => t.id))
        .order('created_at', { ascending: true });
      return data || [];
    },
  });

  // Open requests
  const { data: openRequests = [] } = useQuery({
    queryKey: ['open-requests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('provider_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const requestClientIds = [...new Set(openRequests.map(r => r.client_id))];
  const { data: requestProfiles = [] } = useQuery({
    queryKey: ['request-profiles', requestClientIds],
    enabled: requestClientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', requestClientIds);
      return data || [];
    },
  });

  // Persisted unlocks
  const { data: unlocks = [] } = useQuery({
    queryKey: ['provider-unlocks', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_unlocks')
        .select('*')
        .eq('provider_id', user!.id);
      return data || [];
    },
  });

  if (!user) return null;

  const isThreadUnlocked = (threadId: string) =>
    unlocks.some((u: any) => u.unlock_type === 'thread' && u.target_id === threadId);
  const isRequestUnlocked = (requestId: string) =>
    unlocks.some((u: any) => u.unlock_type === 'request' && u.target_id === requestId);

  const currentBalance = credits?.balance ?? 0;

  const handleUnlock = async (unlockType: 'thread' | 'request', targetId: string) => {
    const already = unlocks.some((u: any) => u.unlock_type === unlockType && u.target_id === targetId);
    if (already) return;

    const { data, error } = await supabase.rpc('unlock_provider_target' as any, {
      _unlock_type: unlockType,
      _target_id: targetId,
      _cost: UNLOCK_COST,
    });

    if (error || !(data as any)?.ok) {
      console.error('[unlock] failed:', { error, data, unlockType, targetId });
      toast.error((data as any)?.reason === 'insufficient_credits' ? 'Not enough credits to unlock this lead' : `Failed to unlock lead: ${error?.message || (data as any)?.reason || 'unknown error'}`);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['provider-credits'] });
    queryClient.invalidateQueries({ queryKey: ['provider-unlocks'] });
    toast.success((data as any)?.already_unlocked ? 'Already unlocked. Contact details are visible.' : 'Lead unlocked! Contact details are now visible.');
  };

  const handleRespondToRequest = async () => {
    if (!selectedRequest || !responseText.trim()) return;
    if (!selectedRequest.client_id || !selectedRequest.id) {
      toast.error('Missing request data. Please refresh and try again.');
      return;
    }
    setSending(true);

    try {
      let threadId: string | null = null;

      // 1) Look for a thread tied to THIS request
      const { data: existingForRequest, error: existErr } = await supabase
        .from('message_threads')
        .select('id')
        .eq('client_id', selectedRequest.client_id)
        .eq('provider_id', user.id)
          .eq('request_id', selectedRequest.id)
          .limit(1)
        .maybeSingle();

      if (existErr) console.error('[accept] lookup by request failed:', existErr);
      if (existingForRequest) threadId = existingForRequest.id;

      // 2) Fallback: any thread between this provider+client without request_id (e.g. Hot Lead chat)
      if (!threadId) {
        const { data: existingGeneric, error: genErr } = await supabase
          .from('message_threads')
          .select('id, request_id')
          .eq('client_id', selectedRequest.client_id)
          .eq('provider_id', user.id)
          .is('request_id', null)
          .limit(1)
          .maybeSingle();
        if (genErr) console.error('[accept] lookup generic failed:', genErr);
        if (existingGeneric) threadId = existingGeneric.id;
      }

      // 3) Create new thread if none exists
      if (!threadId) {
        const { data: newThread, error: createErr } = await supabase
          .from('message_threads')
          .insert({
            client_id: selectedRequest.client_id,
            provider_id: user.id,
            request_id: selectedRequest.id,
          })
          .select('id')
          .single();

        if (createErr || !newThread) {
          console.error('[accept] create thread failed:', createErr, {
            client_id: selectedRequest.client_id,
            provider_id: user.id,
            request_id: selectedRequest.id,
          });
          toast.error(`Failed to create conversation: ${createErr?.message || 'unknown error'}`);
          setSending(false);
          return;
        }
        threadId = newThread.id;
      }

      // 4) Send the response message
      const { error: msgErr } = await supabase.from('messages').insert({
        thread_id: threadId,
        sender_id: user.id,
        text: responseText.trim(),
      });
      if (msgErr) {
        console.error('[accept] send message failed:', msgErr);
        toast.error(`Message not sent: ${msgErr.message}`);
        setSending(false);
        return;
      }

      // 5) Mark request as accepted
      const { error: updErr } = await supabase
        .from('service_requests')
        .update({ status: 'accepted' })
        .eq('id', selectedRequest.id);
      if (updErr) console.error('[accept] update request status failed:', updErr);

      setSending(false);
      setSelectedRequest(null);
      setResponseText('');
      toast.success('Request accepted. Conversation is ready.');
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      queryClient.invalidateQueries({ queryKey: ['open-requests'] });
      queryClient.invalidateQueries({ queryKey: ['provider-requests'] });
    } catch (err: any) {
      console.error('[accept] unexpected error:', err);
      toast.error(`Unexpected error: ${err?.message || 'see console'}`);
      setSending(false);
    }
  };

  const getFirstMsg = (threadId: string) => firstMessages.find((m: any) => m.thread_id === threadId);
  const getCategoryLabel = (key: string) => CATEGORIES.find(c => c.key === key)?.label || key;

  

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Lead Management</p>
            <h1 className="font-display text-2xl font-bold">My Leads</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5">
            <CreditCard className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-primary">{currentBalance} credits</span>
          </div>
        </div>

        <Tabs defaultValue="hot" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hot" className="gap-1.5">
              <Flame className="h-4 w-4" />
              Hot Leads
              {hotLeadThreads.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                  {hotLeadThreads.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5">
              <Megaphone className="h-4 w-4" />
              Requests
              {openRequests.filter(r => r.status === 'pending').length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                  {openRequests.filter(r => r.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Hot Leads Tab */}
          <TabsContent value="hot" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              Clients who messaged you directly — unlock to see contact details ({UNLOCK_COST} credit per lead).
            </p>
            {hotLeadThreads.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Flame className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">No hot leads yet</p>
              </div>
            ) : (
              hotLeadThreads.map(thread => {
                const client = hotLeadProfiles.find((p: any) => p.user_id === thread.client_id);
                const firstMsg = getFirstMsg(thread.id);
                const isUnlocked = isThreadUnlocked(thread.id);

                return (
                  <div key={thread.id} className="rounded-xl border bg-card overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                            <Flame className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            {isUnlocked ? (
                              <div>
                                <p className="font-semibold text-sm">
                                  <ClickableName userId={thread.client_id}>
                                    {client?.first_name} {client?.last_name}
                                  </ClickableName>
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  📞 {client?.phone || 'No phone'}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="font-semibold text-sm text-muted-foreground">
                                  {client?.first_name?.[0]}***  {client?.last_name?.[0]}***
                                </p>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Contact hidden
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">Hot Lead</Badge>
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3 mb-3">
                        {isUnlocked ? (
                          <p className="text-sm">{firstMsg?.text || 'No message'}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic blur-[3px] select-none">
                            {firstMsg?.text?.substring(0, 60) || 'Client sent you a message...'}
                          </p>
                        )}
                      </div>

                      {isUnlocked ? (
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 rounded-xl gap-1.5" onClick={() => navigate(`/provider/messages/${thread.id}`)}>
                            <MessageCircle className="h-3.5 w-3.5" />Open Chat
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => navigate(`/profile/${thread.client_id}`)}>
                            <Eye className="h-3.5 w-3.5" />Profile
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full rounded-xl gap-1.5" onClick={() => handleUnlock('thread', thread.id)}>
                          <Unlock className="h-3.5 w-3.5" />
                          Unlock Lead ({UNLOCK_COST} credit)
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* Open Requests Tab */}
          <TabsContent value="requests" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">
              Requests from clients — unlock to see contact details, then send your offer.
            </p>
            {openRequests.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Megaphone className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">No open requests</p>
              </div>
            ) : (
              openRequests.map((req: any) => {
                const client = requestProfiles.find((p: any) => p.user_id === req.client_id);
                const unlocked = isRequestUnlocked(req.id);
                return (
                  <div key={req.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{req.event_type}</p>
                        {unlocked ? (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              <ClickableName userId={req.client_id}>
                                {client?.first_name} {client?.last_name}
                              </ClickableName>
                            </p>
                            <p className="text-[10px] text-muted-foreground">📞 {client?.phone || 'No phone'}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Client contact hidden
                          </p>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div><span className="font-medium text-foreground">Date:</span> {req.event_date}</div>
                      <div><span className="font-medium text-foreground">Time:</span> {req.event_time}</div>
                      <div><span className="font-medium text-foreground">Location:</span> {req.location || '—'}</div>
                      <div><span className="font-medium text-foreground">Budget:</span> {req.budget || '—'}</div>
                      {(req as any).hours && <div><span className="font-medium text-foreground">Hours:</span> {(req as any).hours}</div>}
                      {req.category && (
                        <div className="col-span-2"><span className="font-medium text-foreground">Category:</span> {getCategoryLabel(req.category)}</div>
                      )}
                    </div>
                    {req.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3">{req.notes}</p>
                    )}
                    <div className="flex gap-2">
                      {unlocked ? (
                        <>
                          <Button size="sm" className="flex-1 rounded-xl gap-1.5" onClick={() => { setSelectedRequest(req); setResponseText(''); }}>
                            <Send className="h-3.5 w-3.5" />Accept Request
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => navigate(`/provider/events/${req.id}`)}>
                            <Eye className="h-3.5 w-3.5" />Details
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="w-full rounded-xl gap-1.5" onClick={() => handleUnlock('request', req.id)}>
                          <Unlock className="h-3.5 w-3.5" />
                          Unlock & Respond ({UNLOCK_COST} credit)
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Accept Request Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={open => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-[380px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Accept Request</DialogTitle>
            <DialogDescription>
              Respond to {selectedRequest?.event_type} request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
              <p><span className="font-medium">Event:</span> {selectedRequest?.event_type}</p>
              <p><span className="font-medium">Date:</span> {selectedRequest?.event_date}</p>
              <p><span className="font-medium">Budget:</span> {selectedRequest?.budget || '—'}</p>
            </div>
            <textarea
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              placeholder="Hi! I'd love to help with your event..."
              className="w-full min-h-[120px] rounded-xl border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button className="w-full rounded-xl" disabled={!responseText.trim() || sending} onClick={handleRespondToRequest}>
              {sending ? 'Sending...' : 'Accept Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProviderNav />
    </div>
  );
}
