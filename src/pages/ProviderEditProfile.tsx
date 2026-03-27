import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import { ProviderNav } from '@/components/ProviderNav';
import { CATEGORIES } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function ProviderEditProfile() {
  const { currentUser, getProfileByUserId, updateProfile } = useApp();
  const navigate = useNavigate();
  const { toast } = useToast();

  const profile = currentUser ? getProfileByUserId(currentUser.id) : undefined;

  const [form, setForm] = useState({
    title: '',
    category: '',
    location: '',
    about: '',
    priceLabel: '',
    tags: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        title: profile.title,
        category: profile.category,
        location: profile.location,
        about: profile.about,
        priceLabel: profile.priceLabel,
        tags: profile.tags.join(', '),
      });
    }
  }, [profile]);

  if (!profile || !currentUser) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...profile,
      title: form.title,
      category: form.category,
      location: form.location,
      about: form.about,
      priceLabel: form.priceLabel,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    toast({ title: 'Profile saved', description: 'Your changes have been saved successfully.' });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Cover placeholder */}
      <div className="h-36 bg-gradient-to-br from-primary/20 to-accent/20 relative">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-0 right-4 translate-y-1/2">
          <div className="h-10 w-10 rounded-lg bg-card border text-xs flex items-center justify-center text-muted-foreground cursor-pointer">
            Edit
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="flex items-end gap-4 mb-6 -mt-10">
          <div className="h-20 w-20 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-2xl font-display font-bold text-primary shadow-lg">
            {currentUser.firstName[0]}
          </div>
          <div className="pb-1">
            <h1 className="font-display text-xl font-bold">{currentUser.firstName} {currentUser.lastName}</h1>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Service Title</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              {CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Miami, FL" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>About</Label>
            <Textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} className="rounded-xl min-h-[100px]" />
          </div>
          <div className="space-y-1.5">
            <Label>Price</Label>
            <Input value={form.priceLabel} onChange={e => setForm(f => ({ ...f, priceLabel: e.target.value }))} placeholder="e.g. $100/hour" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Weddings, Corporate, Events" className="rounded-xl" />
          </div>

          {/* Gallery placeholder */}
          <div>
            <Label>Gallery</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  + Add
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl text-base">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </form>
      </div>
      <ProviderNav />
    </div>
  );
}
