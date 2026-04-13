import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProviderNav } from '@/components/ProviderNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO, isSameDay } from 'date-fns';
import { Plus, Trash2 } from 'lucide-react';
import { ClickableName } from '@/components/ClickableName';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ProviderEventStatus } from '@/types';

const emptyForm = { clientName: '', phone: '', email: '', jobCost: '', status: 'pending' as ProviderEventStatus, address: '' };

export default function ProviderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: myEvents = [] } = useQuery({
    queryKey: ['provider-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('provider_events').select('*').eq('provider_id', user!.id);
      return data || [];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['provider-requests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('service_requests').select('*').eq('provider_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch client profiles for requests
  const clientIds = [...new Set(requests.map(r => r.client_id))];
  const { data: clientProfiles = [] } = useQuery({
    queryKey: ['client-profiles', clientIds],
    enabled: clientIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').in('user_id', clientIds);
      return data || [];
    },
  });

  if (!user) return null;

  const eventsForDate = selectedDate
    ? myEvents.filter((e: any) => isSameDay(parseISO(e.date), selectedDate))
    : [];

  const datesWithEvents = myEvents.map((e: any) => parseISO(e.date));

  const openNewEvent = (date?: Date) => {
    const d = date || selectedDate || new Date();
    setSelectedDate(d);
    setEditingEventId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditEvent = (ev: any) => {
    setEditingEventId(ev.id);
    setForm({ clientName: ev.client_name, phone: ev.phone, email: ev.email, jobCost: ev.job_cost, status: ev.status, address: ev.address });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (editingEventId) {
      await supabase.from('provider_events').update({
        client_name: form.clientName, phone: form.phone, email: form.email,
        job_cost: form.jobCost, status: form.status, address: form.address, date: dateStr,
      }).eq('id', editingEventId);
    } else {
      await supabase.from('provider_events').insert({
        provider_id: user.id, date: dateStr,
        client_name: form.clientName, phone: form.phone, email: form.email,
        job_cost: form.jobCost, status: form.status, address: form.address,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['provider-events'] });
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (editingEventId) {
      await supabase.from('provider_events').delete().eq('id', editingEventId);
      queryClient.invalidateQueries({ queryKey: ['provider-events'] });
      setModalOpen(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'canceled': return 'text-red-600 bg-red-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-2xl font-bold">My Events</h1>
        </div>
        <div className="rounded-xl border bg-card p-2 sm:p-3 overflow-hidden">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="pointer-events-auto w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_row]:flex [&_.rdp-head_row]:justify-around [&_.rdp-row]:flex [&_.rdp-row]:justify-around [&_.rdp-cell]:flex-1 [&_.rdp-cell]:text-center [&_.rdp-day]:mx-auto"
            modifiers={{ hasEvent: datesWithEvents }}
            modifiersStyles={{ hasEvent: { fontWeight: 700, textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' } }}
          />
        </div>
        {selectedDate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{format(selectedDate, 'MMMM d, yyyy')}</h2>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => openNewEvent()}><Plus className="h-4 w-4" /> Add Event</Button>
            </div>
            {eventsForDate.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No events on this date.</p>
            ) : (
              eventsForDate.map((ev: any) => (
                <button key={ev.id} onClick={() => openEditEvent(ev)} className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold">{ev.client_name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(ev.status)}`}>{ev.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ev.address}</p>
                  <p className="text-sm font-medium mt-1">{ev.job_cost}</p>
                </button>
              ))
            )}
          </div>
        )}
        <div className="space-y-2 pt-2">
          <h2 className="font-semibold text-sm">Incoming Requests</h2>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No incoming requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req: any) => {
                const client = clientProfiles.find((p: any) => p.user_id === req.client_id);
                return (
                  <button key={req.id} onClick={() => navigate(`/provider/events/${req.id}`)} className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{req.event_type}</p>
                        <p className="text-sm text-muted-foreground"><ClickableName userId={req.client_id}>{client?.first_name} {client?.last_name}</ClickableName></p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{req.event_date}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[360px] rounded-xl">
          <DialogHeader><DialogTitle>{editingEventId ? 'Edit Event' : 'New Event'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Date</Label><Input value={selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''} readOnly className="mt-1 bg-muted/50" /></div>
            <div><Label>Client Name</Label><Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="mt-1" placeholder="Enter client name" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="Phone number" type="tel" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" placeholder="Email address" type="email" /></div>
            <div><Label>Job Cost</Label><Input value={form.jobCost} onChange={e => setForm(f => ({ ...f, jobCost: e.target.value }))} className="mt-1" placeholder="e.g. $500" /></div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ProviderEventStatus }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" placeholder="Event address" /></div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 rounded-xl" onClick={handleSave}>Save</Button>
              {editingEventId && (
                <Button variant="outline" size="icon" className="rounded-xl text-destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ProviderNav />
    </div>
  );
}
