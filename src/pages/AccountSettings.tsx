import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';
import { ClientNav } from '@/components/ClientNav';
import { ProviderNav } from '@/components/ProviderNav';

export default function AccountSettings() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) { navigate('/'); return null; }

  const isClient = profile.role === 'client';

  const handleLogOut = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-6">
        <h1 className="font-display text-2xl font-bold">Account</h1>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-display font-bold text-primary">
              {profile.first_name[0]}
            </div>
            <div>
              <p className="font-semibold">{profile.first_name} {profile.last_name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile.role} account</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogOut} className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5">
          <LogOut className="h-4 w-4 mr-2" />Log out
        </Button>
      </div>
      {isClient ? <ClientNav /> : <ProviderNav />}
    </div>
  );
}
