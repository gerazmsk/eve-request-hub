import { useNavigate } from 'react-router-dom';
import { BadgeCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ClientNav } from '@/components/ClientNav';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ClientProfile() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();

  const { data: completedProjects = 0 } = useQuery({
    queryKey: ['client-completed-projects', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', user!.id)
        .eq('status', 'confirmed');
      return count || 0;
    },
  });

  if (!user || !profile) return null;

  const handleLogOut = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-5 pt-8 pb-6 space-y-6">
        <h1 className="font-display text-2xl font-bold">My Profile</h1>

        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-display font-bold text-primary">
              {profile.first_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-display text-xl font-bold">{profile.first_name} {profile.last_name}</p>
                {(profile as any).is_verified && <BadgeCheck className="h-5 w-5 text-primary fill-primary/20" />}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{completedProjects}</p>
            <p className="text-xs text-muted-foreground">Projects</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">First Name</p>
            <p className="font-medium">{profile.first_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Name</p>
            <p className="font-medium">{profile.last_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="font-medium">{profile.phone || 'Not set'}</p>
          </div>
        </div>

        <Button variant="outline" onClick={handleLogOut} className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5">
          <LogOut className="h-4 w-4 mr-2" />Log out
        </Button>
      </div>
      <ClientNav />
    </div>
  );
}
