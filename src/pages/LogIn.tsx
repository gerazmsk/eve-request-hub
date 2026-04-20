import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function LogIn() {
  const { logIn } = useAuth();
  const { toast } = useToast();
  const selectedRole = sessionStorage.getItem('eve-selected-role') as 'client' | 'provider' | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({ title: 'Choose account type', description: 'Please choose Client or Provider before logging in.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await logIn(email, password, selectedRole);
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      sessionStorage.removeItem('eve-selected-role');
    }
    // Auth state change will redirect automatically via AuthRedirect
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-in space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-bold">Log in Your EVE account</h1>
          <p className="text-sm text-muted-foreground">{selectedRole === 'provider' ? 'Provider account' : 'Client account'}</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>
    </div>
  );
}
