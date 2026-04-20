import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Account() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    const role = sessionStorage.getItem('eve-selected-role');
    if (!role) {
      navigate('/');
    } else {
      setSelectedRole(role);
    }
  }, [navigate]);

  if (!selectedRole) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold">Your EVE account</h1>
          <p className="text-muted-foreground">
            {selectedRole === 'client' ? 'Find the perfect event services' : 'Grow your event business'}
          </p>
        </div>
        <div className="space-y-3">
          <Button onClick={() => navigate('/signup')} className="w-full h-12 text-base rounded-xl" size="lg">Sign up</Button>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full h-12 text-base rounded-xl" size="lg">Log in</Button>
        </div>
        <p className="text-xs text-muted-foreground">Continue as a {selectedRole} account only.</p>
      </div>
    </div>
  );
}
