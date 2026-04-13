import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { ProviderNav } from '@/components/ProviderNav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const TIME_OPTIONS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00',
];

function formatTime12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function ProviderAvailability() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: availability = [] } = useQuery({
    queryKey: ['provider-availability', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_availability')
        .select('*')
        .eq('provider_id', user!.id)
        .order('date');
      return data || [];
    },
  });

  if (!user) return null;

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const currentAvail = availability.find((a: any) => a.date === selectedDateStr);
  const currentSlots: string[] = currentAvail?.time_slots || [];
  const availableDates = availability.map((a: any) => parseISO(a.date));

  const toggleSlot = async (slot: string) => {
    if (!selectedDate) return;
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot].sort();

    if (newSlots.length === 0 && currentAvail) {
      await supabase.from('provider_availability').delete().eq('id', currentAvail.id);
    } else if (currentAvail) {
      await supabase.from('provider_availability').update({ time_slots: newSlots }).eq('id', currentAvail.id);
    } else {
      await supabase.from('provider_availability').insert({
        provider_id: user.id,
        date: selectedDateStr,
        time_slots: newSlots,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['provider-availability'] });
  };

  const clearDate = async () => {
    if (currentAvail) {
      await supabase.from('provider_availability').delete().eq('id', currentAvail.id);
      queryClient.invalidateQueries({ queryKey: ['provider-availability'] });
      toast.success('Availability cleared for this date');
    }
  };

  const selectAllSlots = async () => {
    if (!selectedDate) return;
    if (currentAvail) {
      await supabase.from('provider_availability').update({ time_slots: [...TIME_OPTIONS] }).eq('id', currentAvail.id);
    } else {
      await supabase.from('provider_availability').insert({
        provider_id: user.id,
        date: selectedDateStr,
        time_slots: [...TIME_OPTIONS],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['provider-availability'] });
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Manage Availability</h1>
      </div>

      <div className="px-5 space-y-4">
        <p className="text-sm text-muted-foreground">Select a date, then tap time slots to mark yourself as available.</p>

        <div className="rounded-xl border bg-card p-2 sm:p-4 overflow-hidden">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-0 sm:p-3 pointer-events-auto w-full [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_row]:flex [&_.rdp-head_row]:justify-around [&_.rdp-row]:flex [&_.rdp-row]:justify-around [&_.rdp-cell]:flex-1 [&_.rdp-cell]:text-center [&_.rdp-day]:mx-auto"
            modifiers={{ hasAvail: availableDates }}
            modifiersStyles={{ hasAvail: { fontWeight: 700, textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))' } }}
            disabled={{ before: new Date() }}
          />
        </div>

        {selectedDate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{format(selectedDate, 'MMMM d, yyyy')}</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllSlots}>Select All</Button>
                {currentAvail && (
                  <Button size="sm" variant="outline" className="text-destructive" onClick={clearDate}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TIME_OPTIONS.map(slot => {
                const active = currentSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(slot)}
                    className={`rounded-lg py-2 text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {formatTime12(slot)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSlots.length} slot{currentSlots.length !== 1 ? 's' : ''} available
            </p>
          </div>
        )}

        {availability.length > 0 && (
          <div className="space-y-2 pt-2">
            <h2 className="font-semibold text-sm">Dates with availability</h2>
            <div className="flex flex-wrap gap-2">
              {availability.map((a: any) => (
                <button
                  key={a.id}
                  onClick={() => setSelectedDate(parseISO(a.date))}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    a.date === selectedDateStr
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border'
                  }`}
                >
                  {format(parseISO(a.date), 'MMM d')} · {a.time_slots.length} slots
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <ProviderNav />
    </div>
  );
}
