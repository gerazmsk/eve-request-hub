import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Welcome() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRole = (role: string) => {
    setSelectedRole(role);
    // Store role temporarily for signup
    sessionStorage.setItem('eve-selected-role', role);
    navigate('/account');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Welcome to <span className="text-primary">EVE</span>
          </h1>
          <p className="text-muted-foreground">Choose how you want to use the app</p>
        </div>
        <div className="space-y-3">
          <Button onClick={() => handleRole('client')} className="w-full h-14 text-base rounded-xl" size="lg">
            I need event services
          </Button>
          <Button onClick={() => handleRole('provider')} variant="outline" className="w-full h-14 text-base rounded-xl" size="lg">
            I offer event services
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          By continuing, you agree to our <a href="/terms" className="underline underline-offset-2">Terms</a> & <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
