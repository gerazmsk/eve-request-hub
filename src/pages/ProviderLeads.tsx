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
import { Lock, Unlock, Flame, Megaphone, MessageCircle, Eye, Send } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CATEGORIES } from '@/types';

export default function ProviderLeads() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [unlockedLeads, setUnlockedLeads] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [sending, setSending] = useState(false);

  // Hot leads: direct message threads (no request_id)
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

  // Get client profiles for hot leads
  const hotLeadClientIds = [...new Set(hotLeadThreads.map(t => t.client_id))];
  const { data: hotLeadProfiles = [] } = useQuery({
    queryKey: ['hot-lead-profiles', hotLeadClientIds],
    enabled: hotLeadClientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', hotLeadClientIds);
      return data || [];
    },
  });

  // Get first message of each hot lead thread
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

  // Open requests: service requests for this provider
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

  if (!user) return null;

  const handleUnlock = (threadId: string) => {
    setUnlockedLeads(prev => new Set([...prev, threadId]));
    toast.success('Lead unlocked! You can now view client details and respond.');
  };

  const handleRespondToRequest = async () => {
    if (!selectedRequest || !responseText.trim()) return;
    setSending(true);

    // Create or find thread, then send message
    let threadId: string;
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('client_id', selectedRequest.client_id)
      .eq('provider_id', user.id)
      .eq('request_id', selectedRequest.id)
      .maybeSingle();

    if (existing) {
      threadId = existing.id;
    } else {
      const { data: newThread, error } = await supabase
        .from('message_threads')
        .insert({ client_id: selectedRequest.client_id, provider_id: user.id, request_id: selectedRequest.id })
        .select('id')
        .single();
      if (error || !newThread) {
        toast.error('Failed to create conversation');
        setSending(false);
        return;
      }
      threadId = newThread.id;
    }

    await supabase.from('messages').insert({
      thread_id: threadId,
      sender_id: user.id,
      text: responseText.trim(),
    });

    setSending(false);
    setSelectedRequest(null);
    setResponseText('');
    toast.success('Response sent to client!');
    queryClient.invalidateQueries({ queryKey: ['threads'] });
  };

  const getFirstMsg = (threadId: string) => {
    return firstMessages.find((m: any) => m.thread_id === threadId);
  };

  const getCategoryLabel = (key: string) => {
    return CATEGORIES.find(c => c.key === key)?.label || key;
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Lead Management</p>
          <h1 className="font-display text-2xl font-bold">My Leads</h1>
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
              Clients who messaged you directly — high-intent leads ready to book.
            </p>
            {hotLeadThreads.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Flame className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">No hot leads yet</p>
                <p className="text-xs text-muted-foreground">When clients message you directly, they'll appear here.</p>
              </div>
            ) : (
              hotLeadThreads.map(thread => {
                const client = hotLeadProfiles.find((p: any) => p.user_id === thread.client_id);
                const firstMsg = getFirstMsg(thread.id);
                const isUnlocked = unlockedLeads.has(thread.id);

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
                              <p className="font-semibold text-sm">
                                <ClickableName userId={thread.client_id}>
                                  {client?.first_name} {client?.last_name}
                                </ClickableName>
                              </p>
                            ) : (
                              <p className="font-semibold text-sm text-muted-foreground">
                                {client?.first_name?.[0]}***  {client?.last_name?.[0]}***
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">Direct message</p>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">Hot Lead</Badge>
                      </div>

                      {/* Message preview */}
                      <div className="rounded-lg bg-muted/50 p-3 mb-3">
                        {isUnlocked ? (
                          <p className="text-sm">{firstMsg?.text || 'No message'}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic blur-[3px] select-none">
                            {firstMsg?.text?.substring(0, 60) || 'Client sent you a message...'}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {isUnlocked ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 rounded-xl gap-1.5"
                            onClick={() => navigate(`/provider/messages/${thread.id}`)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Open Chat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5"
                            onClick={() => navigate(`/profile/${thread.client_id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Profile
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full rounded-xl gap-1.5"
                          onClick={() => handleUnlock(thread.id)}
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          Unlock Lead (Test Mode — Free)
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
              Requests posted by clients — review details and send your offer.
            </p>
            {openRequests.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Megaphone className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">No open requests</p>
                <p className="text-xs text-muted-foreground">Client requests matching your category will show here.</p>
              </div>
            ) : (
              openRequests.map((req: any) => {
                const client = requestProfiles.find((p: any) => p.user_id === req.client_id);
                return (
                  <div key={req.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">{req.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          <ClickableName userId={req.client_id}>
                            {client?.first_name} {client?.last_name}
                          </ClickableName>
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium text-foreground">Date:</span> {req.event_date}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Time:</span> {req.event_time}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Location:</span> {req.location || '—'}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Budget:</span> {req.budget || '—'}
                      </div>
                      {req.category && (
                        <div className="col-span-2">
                          <span className="font-medium text-foreground">Category:</span> {getCategoryLabel(req.category)}
                        </div>
                      )}
                    </div>
                    {req.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3">{req.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 rounded-xl gap-1.5"
                        onClick={() => {
                          setSelectedRequest(req);
                          setResponseText('');
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send Offer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl gap-1.5"
                        onClick={() => navigate(`/provider/events/${req.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Send Offer Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={open => !open && setSelectedRequest(null)}>
        <DialogContent className="max-w-[380px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Send Offer</DialogTitle>
            <DialogDescription>
              Respond to {selectedRequest?.event_type} request. Your message will be sent directly to the client.
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
              placeholder="Hi! I'd love to help with your event. Here's what I can offer..."
              className="w-full min-h-[120px] rounded-xl border bg-background p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              className="w-full rounded-xl"
              disabled={!responseText.trim() || sending}
              onClick={handleRespondToRequest}
            >
              {sending ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProviderNav />
    </div>
  );
}
