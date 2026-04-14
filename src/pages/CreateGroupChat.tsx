import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CreateGroupChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const addPhone = () => {
    const trimmed = phoneInput.trim();
    if (trimmed && !phones.includes(trimmed)) {
      setPhones(prev => [...prev, trimmed]);
      setPhoneInput('');
    }
  };

  const removePhone = (phone: string) => {
    setPhones(prev => prev.filter(p => p !== phone));
  };

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);

    // Look up user IDs by phone number
    const { data: foundProfiles } = await supabase
      .from('profiles')
      .select('user_id, phone, first_name, last_name')
      .in('phone', phones);

    const memberUserIds = (foundProfiles || []).map(p => p.user_id);
    
    if (phones.length > 0 && memberUserIds.length === 0) {
      toast.error('No registered users found with those phone numbers');
      setCreating(false);
      return;
    }

    // Create group chat
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

    // Add creator and members
    const allMembers = [user.id, ...memberUserIds].map(uid => ({
      group_chat_id: group.id,
      user_id: uid,
    }));

    await supabase.from('group_chat_members').insert(allMembers);

    const notFoundPhones = phones.filter(
      phone => !(foundProfiles || []).some(p => p.phone === phone)
    );
    if (notFoundPhones.length > 0) {
      toast.warning(`Some numbers not found: ${notFoundPhones.join(', ')}`);
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
          <div className="flex gap-2">
            <Input
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              placeholder="Enter phone number"
              className="rounded-xl h-11 flex-1"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPhone())}
            />
            <Button type="button" size="icon" className="rounded-xl h-11 w-11 shrink-0" onClick={addPhone}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {phones.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{phones.length} number(s) added</p>
            <div className="flex flex-wrap gap-2">
              {phones.map(phone => (
                <span key={phone} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm">
                  {phone}
                  <button onClick={() => removePhone(phone)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          className="w-full h-12 rounded-xl text-base gap-2"
          disabled={!name.trim() || creating}
          onClick={handleCreate}
        >
          <Users className="h-4 w-4" />
          {creating ? 'Creating...' : 'Create Group Chat'}
        </Button>
      </div>
    </div>
  );
}
