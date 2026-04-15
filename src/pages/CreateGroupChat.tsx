import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PhoneEntry = {
  phone: string;
  status: 'pending' | 'valid' | 'not_found';
  userName?: string;
  userId?: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '');
}

export default function CreateGroupChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [entries, setEntries] = useState<PhoneEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [validating, setValidating] = useState(false);

  const addPhone = async () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) return;

    const digits = normalizePhone(trimmed);
    if (digits.length < 7) {
      toast.error('Phone number is too short');
      return;
    }

    if (entries.some(e => normalizePhone(e.phone) === digits)) {
      toast.error('This number is already added');
      return;
    }

    setValidating(true);

    // Fetch all profiles and do normalized matching
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('user_id, phone, first_name, last_name');

    const match = (allProfiles || []).find(
      p => normalizePhone(p.phone) === digits
    );

    if (match) {
      if (match.user_id === user?.id) {
        toast.error("You'll be added automatically as the creator");
        setValidating(false);
        return;
      }
      setEntries(prev => [
        ...prev,
        {
          phone: trimmed,
          status: 'valid',
          userName: `${match.first_name} ${match.last_name}`.trim(),
          userId: match.user_id,
        },
      ]);
      setPhoneInput('');
    } else {
      setEntries(prev => [...prev, { phone: trimmed, status: 'not_found' }]);
      setPhoneInput('');
    }

    setValidating(false);
  };

  const removeEntry = (phone: string) => {
    setEntries(prev => prev.filter(e => e.phone !== phone));
  };

  const validEntries = entries.filter(e => e.status === 'valid');
  const hasInvalid = entries.some(e => e.status === 'not_found');

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    if (validEntries.length === 0) {
      toast.error('Add at least one valid member');
      return;
    }
    if (hasInvalid) {
      toast.error('Please remove numbers that were not found before creating');
      return;
    }

    setCreating(true);

    const { data: group, error } = await supabase
      .from('group_chats')
      .insert({ name: name.trim(), created_by: user.id })
      .select('id')
      .single();

    if (error || !group) {
      toast.error('Failed to create group chat');
      setCreating(false);
      return;
    }

    const allMembers = [
      user.id,
      ...validEntries.map(e => e.userId!),
    ].map(uid => ({
      group_chat_id: group.id,
      user_id: uid,
    }));

    const { error: memberError } = await supabase
      .from('group_chat_members')
      .insert(allMembers);

    if (memberError) {
      toast.error('Group created but failed to add members');
      setCreating(false);
      return;
    }

    toast.success('Group chat created!');
    setCreating(false);
    navigate(-1);
  };

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">New Group Chat</h1>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Group Name</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Wedding Planning Team"
            className="rounded-xl h-12"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Add Members by Phone Number</Label>
          <p className="text-xs text-muted-foreground">Enter the phone number exactly as the user registered it.</p>
          <div className="flex gap-2">
            <Input
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              placeholder="e.g. 5551234567"
              className="rounded-xl h-11 flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPhone();
                }
              }}
              disabled={validating}
            />
            <Button
              type="button"
              size="icon"
              className="rounded-xl h-11 w-11 shrink-0"
              onClick={addPhone}
              disabled={validating}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {validEntries.length} valid member(s)
            </p>
            <div className="space-y-2">
              {entries.map(entry => (
                <div
                  key={entry.phone}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    entry.status === 'valid'
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-red-200 bg-red-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {entry.status === 'valid' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{entry.phone}</p>
                      {entry.status === 'valid' ? (
                        <p className="text-xs text-green-700">{entry.userName}</p>
                      ) : (
                        <p className="text-xs text-red-600">No user found with this number</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => removeEntry(entry.phone)} className="p-1 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base gap-2"
          disabled={!name.trim() || validEntries.length === 0 || hasInvalid || creating}
          onClick={handleCreate}
        >
          <Users className="h-4 w-4" />
          {creating ? 'Creating...' : 'Create Group Chat'}
        </Button>
      </div>
    </div>
  );
}
