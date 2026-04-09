import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CATEGORIES } from '@/types';
import { ClientNav } from '@/components/ClientNav';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function ProviderListing() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const catInfo = CATEGORIES.find(c => c.key === category);

  const { data: providers = [] } = useQuery({
    queryKey: ['providers', category],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('provider_profiles')
        .select('*, profiles!provider_profiles_user_id_fkey(first_name, last_name)')
        .eq('category', category || '');
      return (profiles || []).map((p: any) => ({
        ...p,
        firstName: p.profiles?.first_name || '',
        lastName: p.profiles?.last_name || '',
      }));
    },
  });

  const filtered = providers.filter((p: any) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    (p.tags || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-6 pb-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/client')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-xl font-bold">{catInfo?.icon} {catInfo?.label || 'Providers'}</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search providers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl h-11" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No providers found in this category yet.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p: any) => (
              <button
                key={p.id}
                onClick={() => navigate(`/client/provider/${p.id}`)}
                className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-xl bg-secondary flex items-center justify-center text-2xl font-display font-bold text-muted-foreground shrink-0">
                    {p.firstName[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{p.firstName} {p.lastName}</h3>
                        <p className="text-sm text-muted-foreground">{p.title}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">{p.price_label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-eve-gold text-eve-gold" />{p.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />{p.location || 'Location TBD'}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {(p.tags || []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-medium bg-secondary rounded-full px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <ClientNav />
    </div>
  );
}
