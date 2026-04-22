import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One special character (!@#$%^&*…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically.
    // Wait for the PASSWORD_RECOVERY event or an existing session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const passwordValid = PASSWORD_RULES.every(r => r.test(password));
  const matches = password === confirm && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast({ title: 'Invalid password', description: 'Please meet all password requirements.', variant: 'destructive' });
      return;
    }
    if (!matches) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Could not update password', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Password updated', description: 'Please log in with your new password.' });
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-in space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-2xl font-bold">Set a new password</h1>
          <p className="text-sm text-muted-foreground">
            {ready ? 'Choose a strong password for your account.' : 'Verifying your reset link...'}
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl" disabled={!ready} />
            <ul className="mt-2 space-y-1">
              {PASSWORD_RULES.map(rule => {
                const passed = rule.test(password);
                return (
                  <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-eve-sage' : 'text-muted-foreground'}`}>
                    {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="rounded-xl" disabled={!ready} />
            {confirm.length > 0 && !matches && (
              <p className="text-xs text-destructive">Passwords don't match.</p>
            )}
          </div>
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading || !ready || !passwordValid || !matches}>
          {loading ? 'Updating...' : 'Update password'}
        </Button>
      </form>
    </div>
  );
}
