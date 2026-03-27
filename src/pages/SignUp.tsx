import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { selectedRole, signUp } = useApp();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });

  if (!selectedRole) { navigate('/'); return null; }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = signUp({ ...form, role: selectedRole });
    navigate(user.role === 'client' ? '/client' : '/provider/profile');
  };

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
            <Input id="password" type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="rounded-xl" />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base">Create</Button>
      </form>
    </div>
  );
}
