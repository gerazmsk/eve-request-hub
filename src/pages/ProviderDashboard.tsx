import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ProviderNav } from '@/components/ProviderNav';
import { StatusBadge } from '@/components/StatusBadge';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO, isSameDay } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { ProviderEvent, ProviderEventStatus } from '@/types';

const emptyForm = { clientName: '', phone: '', email: '', jobCost: '', status: 'pending' as ProviderEventStatus, address: '' };

export default function ProviderDashboard() {
  const { currentUser, getProviderRequests, getUserById, providerEvents, addProviderEvent, updateProviderEvent, deleteProviderEvent } = useApp();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ProviderEvent | null>(null);
  const [form, setForm] = useState(emptyForm);

  if (!currentUser) return null;

  const requests = getProviderRequests(currentUser.id);
  const myEvents = providerEvents.filter(e => e.providerId === currentUser.id);

  const eventsForDate = selectedDate
    ? myEvents.filter(e => isSameDay(parseISO(e.date), selectedDate))
    : [];

  const datesWithEvents = myEvents.map(e => parseISO(e.date));

  const openNewEvent = (date?: Date) => {
    const d = date || selectedDate || new Date();
    setSelectedDate(d);
    setEditingEvent(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditEvent = (ev: ProviderEvent) => {
    setEditingEvent(ev);
    setForm({ clientName: ev.clientName, phone: ev.phone, email: ev.email, jobCost: ev.jobCost, status: ev.status, address: ev.address });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (editingEvent) {
      updateProviderEvent({ ...editingEvent, ...form, date: dateStr });
    } else {
      addProviderEvent({ providerId: currentUser.id, date: dateStr, ...form });
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (editingEvent) {
      deleteProviderEvent(editingEvent.id);
      setModalOpen(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const statusColor = (s: ProviderEventStatus) => {
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

        {/* Calendar */}
        <div className="rounded-xl border bg-card p-3 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="pointer-events-auto"
            modifiers={{ hasEvent: datesWithEvents }}
            modifiersStyles={{ hasEvent: { fontWeight: 700, textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' } }}
          />
        </div>

        {/* Events for selected date */}
        {selectedDate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{format(selectedDate, 'MMMM d, yyyy')}</h2>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => openNewEvent()}>
                <Plus className="h-4 w-4" /> Add Event
              </Button>
            </div>
            {eventsForDate.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No events on this date.</p>
            ) : (
              eventsForDate.map(ev => (
                <button
                  key={ev.id}
                  onClick={() => openEditEvent(ev)}
                  className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold">{ev.clientName}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(ev.status)}`}>{ev.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{ev.address}</p>
                  <p className="text-sm font-medium mt-1">{ev.jobCost}</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* Incoming requests */}
        <div className="space-y-2 pt-2">
          <h2 className="font-semibold text-sm">Incoming Requests</h2>
          {requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No incoming requests yet.</p>
          ) : (
            <div className="space-y-3">
              {requests.map(req => {
                const client = getUserById(req.clientId);
                return (
                  <button
                    key={req.id}
                    onClick={() => navigate(`/provider/events/${req.id}`)}
                    className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{req.eventType}</p>
                        <p className="text-sm text-muted-foreground">{client?.firstName} {client?.lastName}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{req.eventDate}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[360px] rounded-xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Date</Label>
              <Input value={selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''} readOnly className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label>Client Name</Label>
              <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="mt-1" placeholder="Enter client name" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="Phone number" type="tel" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" placeholder="Email address" type="email" />
            </div>
            <div>
              <Label>Status</Label>
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
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" placeholder="Event address" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="flex-1 rounded-xl" onClick={handleSave}>Save</Button>
              {editingEvent && (
                <Button variant="outline" size="icon" className="rounded-xl text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProviderNav />
    </div>
  );
}
