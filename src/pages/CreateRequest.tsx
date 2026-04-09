import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function CreateRequest() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['provider-profile', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('*, profiles!provider_profiles_user_id_fkey(first_name, last_name)')
        .eq('id', profileId || '')
        .single();
      return data;
    },
  });

  const [form, setForm] = useState({ eventType: '', eventDate: '', eventTime: '', location: '', budget: '', notes: '' });
  const [loading, setLoading] = useState(false);

  if (!profile || !user) return null;

  const firstName = (profile as any).profiles?.first_name || '';
  const lastName = (profile as any).profiles?.last_name || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('service_requests').insert({
      client_id: user.id,
      provider_id: profile.user_id,
      category: profile.category,
      event_type: form.eventType,
      event_date: form.eventDate,
      event_time: form.eventTime,
      location: form.location,
      budget: form.budget,
      notes: form.notes,
    });
    setLoading(false);
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
          <Input required value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} placeholder="e.g. Wedding, Birthday, Corporate" className="rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Event Date</Label><Input type="date" required value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Time</Label><Input type="time" required value={form.eventTime} onChange={e => setForm(f => ({ ...f, eventTime: e.target.value }))} className="rounded-xl" /></div>
        </div>
        <div className="space-y-1.5"><Label>Location</Label><Input required value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Event location" className="rounded-xl" /></div>
        <div className="space-y-1.5"><Label>Budget (optional)</Label><Input value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. $1,500" className="rounded-xl" /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any details for the provider..." className="rounded-xl min-h-[100px]" /></div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading}>{loading ? 'Sending...' : 'Send Request'}</Button>
      </form>
    </div>
  );
}
