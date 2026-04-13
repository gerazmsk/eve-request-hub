import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { ClientNav } from '@/components/ClientNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseISO, isSameDay, format } from 'date-fns';

export default function ProviderProfileView() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const firstName = (profile as any).profiles?.first_name || '';
  const lastName = (profile as any).profiles?.last_name || '';

  const handleTextMe = async () => {
    if (!user) return;
    // Find or create thread
    const { data: existing } = await supabase
      .from('message_threads')
      .select('id')
      .eq('client_id', user.id)
      .eq('provider_id', profile.user_id)
      .single();

    if (existing) {
      navigate(`/client/messages/${existing.id}`);
    } else {
      const { data: newThread } = await supabase
        .from('message_threads')
        .insert({ client_id: user.id, provider_id: profile.user_id })
        .select('id')
        .single();
      if (newThread) navigate(`/client/messages/${newThread.id}`);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 bg-cover bg-center" style={profile.cover_image ? { backgroundImage: `url(${profile.cover_image})` } : undefined}>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      <div className="px-5 -mt-12 space-y-5">
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-3xl font-display font-bold text-primary shadow-lg overflow-hidden">
            {profile.profile_image ? (
              <img src={profile.profile_image} alt={firstName} className="h-full w-full object-cover" />
            ) : (
              firstName[0] || '?'
            )}
          </div>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold">{firstName} {lastName}</h1>
            <p className="text-muted-foreground">{profile.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-eve-gold text-eve-gold" />{profile.rating} ({profile.review_count} reviews)</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location || 'Location TBD'}</span>
        </div>
        <div className="font-semibold text-lg text-primary">{profile.price_label}</div>
        <div className="flex flex-wrap gap-2">
          {(profile.tags || []).map((tag: string) => (
            <span key={tag} className="text-xs font-medium bg-secondary rounded-full px-3 py-1">{tag}</span>
          ))}
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.about || 'No description yet.'}</p>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">Gallery</h2>
          <div className="grid grid-cols-3 gap-2">
            {(profile.gallery || []).length > 0
              ? profile.gallery.map((url: string, i: number) => (
                  <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover" />
                ))
              : [1, 2, 3].map(i => <div key={i} className="aspect-square rounded-lg bg-secondary" />)
            }
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">Reviews</h2>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-eve-gold text-eve-gold" />)}
            </div>
            <p className="text-sm text-muted-foreground">"Amazing work! Captured every special moment perfectly."</p>
            <p className="text-xs text-muted-foreground mt-1">— Sarah M.</p>
          </div>
        </div>
        <AvailabilitySection providerId={profile.user_id} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
      </div>
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={handleTextMe}>
            <MessageCircle className="h-4 w-4 mr-2" />Text me
          </Button>
          <Button className="flex-[2] rounded-xl h-12 text-base" onClick={() => navigate(`/client/request/${profile.id}`)}>
            Send Request
          </Button>
        </div>
      </div>
      <ClientNav />
    </div>
  );
}
