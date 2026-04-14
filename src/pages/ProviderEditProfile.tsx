import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Camera, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { ProviderNav } from '@/components/ProviderNav';
import { GalleryLightbox } from '@/components/GalleryLightbox';
import { CATEGORIES } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TITLE_MAX_LENGTH = 60;

export default function ProviderEditProfile() {
  const { user, profile: authProfile, logOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['my-provider-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('provider_profiles').select('*').eq('user_id', user!.id).single();
      return data;
    },
  });

  const [form, setForm] = useState({ title: '', category: '', location: '', about: '', priceLabel: '', tags: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (profile) {
      setForm({
        title: profile.title,
        category: profile.category,
        location: profile.location,
        about: profile.about,
        priceLabel: profile.price_label,
        tags: (profile.tags || []).join(', '),
      });
    }
  }, [profile]);

  if (!profile || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('provider_profiles').update({
      title: form.title.slice(0, TITLE_MAX_LENGTH),
      category: form.category,
      location: form.location,
      about: form.about,
      price_label: form.priceLabel,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }).eq('id', profile.id);
    queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
    toast({ title: 'Profile saved', description: 'Your changes have been saved successfully.' });
  };

  const uploadImage = async (file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('gallery').upload(path, file);
    if (error) return null;
    const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProfile(true);
    const url = await uploadImage(file, 'profile');
    if (url) {
      await supabase.from('provider_profiles').update({ profile_image: url }).eq('id', profile.id);
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
    }
    setUploadingProfile(false);
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await uploadImage(file, 'cover');
    if (url) {
      await supabase.from('provider_profiles').update({ cover_image: url }).eq('id', profile.id);
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
    }
    setUploadingCover(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadImage(file, 'gallery');
      if (url) newUrls.push(url);
    }
    if (newUrls.length > 0) {
      const updatedGallery = [...(profile.gallery || []), ...newUrls];
      await supabase.from('provider_profiles').update({ gallery: updatedGallery }).eq('id', profile.id);
      queryClient.invalidateQueries({ queryKey: ['my-provider-profile'] });
    }
    setUploading(false);
  };

  const handleLogOut = async () => {
    await logOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Cover image */}
      <div
        className="h-36 bg-gradient-to-br from-primary/20 to-accent/20 relative bg-cover bg-center"
        style={profile.cover_image ? { backgroundImage: `url(${profile.cover_image})` } : undefined}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={() => coverImageRef.current?.click()}
          className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-full p-2 hover:bg-card transition-colors"
        >
          {uploadingCover ? <span className="text-xs px-1">...</span> : <Camera className="h-4 w-4" />}
        </button>
        <input ref={coverImageRef} type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
      </div>
      <div className="px-5 pt-4">
        <div className="flex items-end gap-4 mb-6 -mt-10">
          {/* Profile image */}
          <button
            type="button"
            onClick={() => profileImageRef.current?.click()}
            className="relative h-20 w-20 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-2xl font-display font-bold text-primary shadow-lg overflow-hidden group"
          >
            {profile.profile_image ? (
              <img src={profile.profile_image} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              authProfile?.first_name?.[0] || '?'
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingProfile ? <span className="text-white text-xs">...</span> : <Camera className="h-5 w-5 text-white" />}
            </div>
          </button>
          <input ref={profileImageRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
          <div className="pb-1">
            <h1 className="font-display text-xl font-bold">{authProfile?.first_name} {authProfile?.last_name}</h1>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Service Title</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, TITLE_MAX_LENGTH) }))}
              className="rounded-xl"
              maxLength={TITLE_MAX_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right">{form.title.length}/{TITLE_MAX_LENGTH}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Miami, FL" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>About</Label><Textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} className="rounded-xl min-h-[100px]" /></div>
          <div className="space-y-1.5"><Label>Price</Label><Input value={form.priceLabel} onChange={e => setForm(f => ({ ...f, priceLabel: e.target.value }))} placeholder="e.g. $100/hour" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Weddings, Corporate, Events" className="rounded-xl" /></div>
          <div>
            <Label>Gallery</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(profile.gallery || []).map((url: string, i: number) => (
                <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }} />
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground"
              >
                {uploading ? '...' : '+ Add'}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
          </div>
          <Button type="submit" className="w-full h-12 rounded-xl text-base"><Save className="h-4 w-4 mr-2" />Save Changes</Button>
        </form>

        {/* Logout section */}
        <div className="mt-8 mb-4">
          <Button variant="outline" onClick={handleLogOut} className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5">
            <LogOut className="h-4 w-4 mr-2" />Log out
          </Button>
        </div>
      </div>
      <GalleryLightbox images={profile.gallery || []} initialIndex={lightboxIndex} open={lightboxOpen} onOpenChange={setLightboxOpen} />
      <ProviderNav />
    </div>
  );
}
