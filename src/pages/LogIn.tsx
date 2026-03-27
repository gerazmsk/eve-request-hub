import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

export default function LogIn() {
  const navigate = useNavigate();
  const { logIn } = useApp();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = logIn(email, password);
    if (user) {
      navigate(user.role === 'client' ? '/client' : '/provider');
    } else {
      toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-in space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-bold">Log in Your EVE account</h1>
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

        <Button type="submit" className="w-full h-12 rounded-xl text-base">Log In</Button>

        <p className="text-center text-xs text-muted-foreground">
          Demo: george@test.com / pass123 (client) or bill@test.com / pass123 (provider)
        </p>
      </form>
    </div>
  );
}
