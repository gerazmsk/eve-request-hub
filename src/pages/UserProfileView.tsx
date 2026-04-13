import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function UserProfileView() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['user-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', userId!).single();
      return data;
    },
  });

  // Check if this user is a provider and redirect to their provider profile
  const { data: providerProfile } = useQuery({
    queryKey: ['provider-profile-by-user', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('provider_profiles').select('id').eq('user_id', userId!).maybeSingle();
      return data;
    },
  });

  if (!profile) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Profile</h1>
      </div>
      <div className="flex flex-col items-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
          <p className="text-muted-foreground capitalize">{profile.role}</p>
        </div>
        {profile.phone && (
          <div className="rounded-xl border bg-card p-4 w-full max-w-sm">
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{profile.phone}</p>
          </div>
        )}
        {providerProfile && (
          <Button
            variant="outline"
            className="rounded-xl w-full max-w-sm"
            onClick={() => navigate(`/client/provider/${providerProfile.id}`)}
          >
            View Full Provider Profile
          </Button>
        )}
      </div>
    </div>
  );
}
