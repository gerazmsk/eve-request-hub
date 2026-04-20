import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Pencil, Check, X, Mail, FileText, Shield, Trash2 } from 'lucide-react';
import { ClientNav } from '@/components/ClientNav';
import { ProviderNav } from '@/components/ProviderNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AccountSettings() {
  const { user, profile, logOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user || !profile) { navigate('/'); return null; }

  const isClient = profile.role === 'client';

  const handleLogOut = async () => {
    await logOut();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    const { error } = await supabase.rpc('delete_current_user' as any);
    if (error) {
      console.error('[account] delete failed:', error);
      toast({ title: 'Account not deleted', description: error.message, variant: 'destructive' });
      return;
    }
    await logOut();
    navigate('/');
  };

  const startEditPhone = () => {
    setPhone(profile.phone || '');
    setEditingPhone(true);
  };

  const savePhone = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ phone }).eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update phone number.', variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: 'Phone number saved.' });
      // Update local profile by reloading
      window.location.reload();
    }
    setEditingPhone(false);
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

        <div className="rounded-xl border bg-card p-5 space-y-2">
          <Label className="text-muted-foreground text-xs">Phone Number</Label>
          {editingPhone ? (
            <div className="flex items-center gap-2">
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl flex-1" placeholder="e.g. 555-0100" />
              <Button size="icon" variant="ghost" onClick={savePhone} disabled={saving}><Check className="h-4 w-4 text-green-600" /></Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingPhone(false)}><X className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-medium">{profile.phone || 'Not set'}</p>
              <Button size="icon" variant="ghost" onClick={startEditPhone}><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <a className="flex items-center gap-2 text-sm font-medium" href="/privacy" target="_blank" rel="noreferrer"><Shield className="h-4 w-4 text-primary" />Privacy Policy</a>
          <a className="flex items-center gap-2 text-sm font-medium" href="/terms" target="_blank" rel="noreferrer"><FileText className="h-4 w-4 text-primary" />Terms of Service</a>
          <a className="flex items-center gap-2 text-sm font-medium" href="mailto:support@eve-request-hub.lovable.app"><Mail className="h-4 w-4 text-primary" />Support / Contact</a>
        </div>

        <Button variant="outline" onClick={handleLogOut} className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5">
          <LogOut className="h-4 w-4 mr-2" />Log out
        </Button>
        <Button variant="outline" onClick={handleDeleteAccount} className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5">
          <Trash2 className="h-4 w-4 mr-2" />Delete Account
        </Button>
      </div>
      {isClient ? <ClientNav /> : <ProviderNav />}
    </div>
  );
}
