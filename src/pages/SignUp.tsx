import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One special character (!@#$%^&*…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    const role = sessionStorage.getItem('eve-selected-role');
    if (!role) navigate('/');
    else setSelectedRole(role);
  }, [navigate]);

  if (!selectedRole) return null;

  const passwordValid = PASSWORD_RULES.every(r => r.test(form.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) {
      toast({ title: 'Invalid password', description: 'Please meet all password requirements.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, {
      role: selectedRole,
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } else {
      sessionStorage.removeItem('eve-selected-role');
      toast({ title: 'Account created', description: 'Welcome to EVE.' });
      navigate(selectedRole === 'client' ? '/client' : '/provider');
    }
  };

  if (showConfirmation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-in space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a confirmation link to <strong>{form.email}</strong>. Please click the link to activate your account.
          </p>
          <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => navigate('/login')}>
            Go to Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm animate-fade-in space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="font-display text-2xl font-bold">Create Your EVE account</h1>
          <p className="text-sm text-muted-foreground">
            {selectedRole === 'client' ? 'Client account' : 'Provider account'}
          </p>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" required value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" required value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onFocus={() => setPasswordTouched(true)}
              className="rounded-xl"
            />
            {passwordTouched && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map(rule => {
                  const passed = rule.test(form.password);
                  return (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-eve-sage' : 'text-muted-foreground'}`}>
                      {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading || !passwordValid}>
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </form>
    </div>
  );
}
