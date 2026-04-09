import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useApp } from '@/context/AppContext';
import { ClientNav } from '@/components/ClientNav';

export default function ProviderProfileView() {
  const { profileId } = useParams<{ profileId: string }>();
  const { getProfile, getUserById, currentUser, getOrCreateThread } = useApp();
  const navigate = useNavigate();

  const profile = getProfile(profileId || '');
  const providerUser = profile ? getUserById(profile.userId) : undefined;

  if (!profile || !providerUser) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Provider not found</div>;
  }

  const handleTextMe = () => {
    if (!currentUser) return;
    const thread = getOrCreateThread(currentUser.id, profile.userId);
    navigate(`/client/messages/${thread.id}`);
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Cover */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-5 -mt-12 space-y-5">
        {/* Avatar + name */}
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-3xl font-display font-bold text-primary shadow-lg">
            {providerUser.firstName[0]}
          </div>
          <div className="pb-1">
            <h1 className="font-display text-2xl font-bold">{providerUser.firstName} {providerUser.lastName}</h1>
            <p className="text-muted-foreground">{profile.title}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-eve-gold text-eve-gold" />
            {profile.rating} ({profile.reviewCount} reviews)
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {profile.location || 'Location TBD'}
          </span>
        </div>

        <div className="font-semibold text-lg text-primary">{profile.priceLabel}</div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {profile.tags.map(tag => (
            <span key={tag} className="text-xs font-medium bg-secondary rounded-full px-3 py-1">
              {tag}
            </span>
          ))}
        </div>

        {/* About */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">About</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{profile.about || 'No description yet.'}</p>
        </div>

        {/* Gallery placeholder */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">Gallery</h2>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square rounded-lg bg-secondary" />
            ))}
          </div>
        </div>

        {/* Reviews placeholder */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">Reviews</h2>
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 fill-eve-gold text-eve-gold" />
              <Star className="h-4 w-4 fill-eve-gold text-eve-gold" />
              <Star className="h-4 w-4 fill-eve-gold text-eve-gold" />
              <Star className="h-4 w-4 fill-eve-gold text-eve-gold" />
              <Star className="h-4 w-4 fill-eve-gold text-eve-gold" />
            </div>
            <p className="text-sm text-muted-foreground">"Amazing work! Captured every special moment perfectly."</p>
            <p className="text-xs text-muted-foreground mt-1">— Sarah M.</p>
          </div>
        </div>

        {/* Availability */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-2">Availability</h2>
          <div className="rounded-xl border bg-card p-4 flex justify-center">
            <Calendar mode="single" className="p-3 pointer-events-auto" />
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={handleTextMe}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Text me
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
