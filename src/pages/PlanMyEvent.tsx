import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CalendarIcon, MapPin, DollarSign, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const BUDGET_OPTIONS = [
  { label: 'Up to $500', value: 'Up to $500' },
  { label: '$500 to $2,000', value: '$500 to $2,000' },
  { label: '$2,000 and above', value: '$2,000 and above' },
];

export default function PlanMyEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleCategory = (key: string) => {
    setSelectedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const canNext = () => {
    if (step === 1) return eventName.trim().length > 0;
    if (step === 2) return !!eventDate && location.trim().length > 0 && budget.length > 0;
    if (step === 3) return selectedCategories.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !eventDate) return;
    setSubmitting(true);

    // Find all providers matching selected categories
    const { data: providers, error: fetchErr } = await supabase
      .from('provider_profiles')
      .select('user_id, category')
      .in('category', selectedCategories);

    if (fetchErr || !providers?.length) {
      toast.error(providers?.length === 0 ? 'No providers found for the selected categories' : 'Failed to find providers');
      setSubmitting(false);
      return;
    }

    const rows = providers.map(p => ({
      client_id: user.id,
      provider_id: p.user_id,
      category: p.category,
      event_type: eventName,
      event_date: format(eventDate, 'yyyy-MM-dd'),
      event_time: '10:00',
      location,
      budget,
      notes: `Plan My Event request — Categories: ${selectedCategories.map(c => CATEGORIES.find(cat => cat.key === c)?.label || c).join(', ')}`,
    }));

    const { error } = await supabase.from('service_requests').insert(rows);
    setSubmitting(false);

    if (error) {
      toast.error('Failed to submit request', { description: error.message });
      return;
    }

    toast.success(`Request sent to ${providers.length} provider(s)!`);
    navigate('/client/request-sent');
  };

  return (
    <div className="min-h-screen px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Plan My Event</h1>
      </div>

      <Progress value={(step / 4) * 100} className="mb-8 h-2" />

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4">
            <Sparkles className="h-6 w-6 text-primary shrink-0" />
            <p className="text-sm font-medium">Hi! We're happy to help you find the right professionals for your event.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">What are you planning?</Label>
            <Input
              value={eventName}
              onChange={e => setEventName(e.target.value)}
              placeholder="e.g. Wedding, Birthday Party, Corporate Gala"
              className="rounded-xl h-12 text-base"
            />
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Event Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal rounded-xl h-12", !eventDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, 'MMMM d, yyyy') : 'Select a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={d => { setEventDate(d); setCalendarOpen(false); }}
                  disabled={d => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Event location" className="rounded-xl h-12 pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-semibold">Estimated Budget</Label>
            <div className="grid gap-2">
              {BUDGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBudget(opt.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                    budget === opt.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40'
                  )}
                >
                  <DollarSign className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-base font-semibold">Who are you looking for?</Label>
          <p className="text-sm text-muted-foreground">Select one or more categories</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                type="button"
                onClick={() => toggleCategory(cat.key)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all relative',
                  selectedCategories.includes(cat.key)
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-card hover:border-primary/40'
                )}
              >
                {selectedCategories.includes(cat.key) && (
                  <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                  </div>
                )}
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Summary */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <Label className="text-base font-semibold">Review Your Request</Label>
          <div className="rounded-xl border bg-card divide-y">
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Event</p>
              <p className="font-medium">{eventName}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{eventDate ? format(eventDate, 'MMMM d, yyyy') : ''}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium">{location}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="font-medium">{budget}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">Looking for</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedCategories.map(key => {
                  const cat = CATEGORIES.find(c => c.key === key);
                  return (
                    <span key={key} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">
                      {cat?.icon} {cat?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8">
        {step < 4 ? (
          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="w-full h-12 rounded-xl text-base"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        )}
      </div>
    </div>
  );
}
