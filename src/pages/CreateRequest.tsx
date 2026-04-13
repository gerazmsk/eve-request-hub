import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isSameDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatTime12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function CreateRequest() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['provider-profile', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('*, profiles!provider_profiles_profile_fkey(first_name, last_name)')
        .eq('id', profileId || '')
        .single();
      return data;
    },
  });

  // Fetch provider availability
  const { data: availability = [] } = useQuery({
    queryKey: ['provider-availability-view', profile?.user_id],
    enabled: !!profile?.user_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', profile!.user_id)
        .order('date');
      return data || [];
    },
  });

  const [eventType, setEventType] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  if (!profile || !user) return null;

  const firstName = (profile as any).profiles?.first_name || '';
  const lastName = (profile as any).profiles?.last_name || '';

  const availableDates = availability.map((a: any) => parseISO(a.date));
  const hasAvailability = availability.length > 0;

  // Get time slots for selected date
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const dateAvail = availability.find((a: any) => a.date === selectedDateStr);
  const timeSlots: string[] = dateAvail?.time_slots || [];

  const isDateAvailable = (date: Date) => {
    if (!hasAvailability) return true; // If no availability set, all dates are open
    return availableDates.some(d => isSameDay(d, date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and time');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('service_requests').insert({
      client_id: user.id,
      provider_id: profile.user_id,
      category: profile.category,
      event_type: eventType,
      event_date: format(selectedDate, 'yyyy-MM-dd'),
      event_time: selectedTime,
      location,
      budget,
      notes,
    });
    setLoading(false);
    if (error) {
      toast.error('Failed to send request', { description: error.message });
      return;
    }
    toast.success('Request sent successfully!');
    navigate('/client/request-sent');
  };

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="font-display text-xl font-bold">Send Request</h1>
      </div>
      <div className="rounded-xl border bg-card p-3 mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center font-display font-bold text-muted-foreground">{firstName[0] || '?'}</div>
        <div>
          <p className="font-medium text-sm">{firstName} {lastName}</p>
          <p className="text-xs text-muted-foreground">{profile.title} · {profile.location}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Event Type</Label>
          <Input required value={eventType} onChange={e => setEventType(e.target.value)} placeholder="e.g. Wedding, Birthday, Corporate" className="rounded-xl" />
        </div>

        {/* Date picker */}
        <div className="space-y-1.5">
          <Label>Event Date</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl h-10",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime('');
                  setCalendarOpen(false);
                }}
                disabled={(date) => {
                  if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                  if (hasAvailability && !isDateAvailable(date)) return true;
                  return false;
                }}
                modifiers={hasAvailability ? { available: availableDates } : {}}
                modifiersStyles={hasAvailability ? { available: { fontWeight: 700, textDecorationColor: 'hsl(var(--primary))' } } : {}}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {hasAvailability && (
            <p className="text-xs text-muted-foreground">Only dates marked as available by the provider can be selected.</p>
          )}
        </div>

        {/* Time slot picker */}
        <div className="space-y-1.5">
          <Label>Time</Label>
          {selectedDate && timeSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-lg py-2 text-xs font-medium transition-colors border ${
                    selectedTime === slot
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {formatTime12(slot)}
                </button>
              ))}
            </div>
          ) : selectedDate && hasAvailability && timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No time slots available for this date.</p>
          ) : !hasAvailability ? (
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'].map(t => (
                  <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground py-2">Select a date first</p>
          )}
        </div>

        <div className="space-y-1.5"><Label>Location</Label><Input required value={location} onChange={e => setLocation(e.target.value)} placeholder="Event location" className="rounded-xl" /></div>
        <div className="space-y-1.5"><Label>Budget (optional)</Label><Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $1,500" className="rounded-xl" /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any details for the provider..." className="rounded-xl min-h-[100px]" /></div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading || !selectedDate || !selectedTime}>
          {loading ? 'Sending...' : 'Send Request'}
        </Button>
      </form>
    </div>
  );
}
