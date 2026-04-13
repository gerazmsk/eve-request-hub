import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ClientNav } from '@/components/ClientNav';
import { StatusBadge } from '@/components/StatusBadge';
import { ClickableName } from '@/components/ClickableName';
import { CATEGORIES } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function MyRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: requests = [] } = useQuery({
    queryKey: ['client-requests', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('*')
        .eq('client_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch provider profiles for display
  const providerIds = [...new Set(requests.map(r => r.provider_id))];
  const { data: providerProfiles = [] } = useQuery({
    queryKey: ['provider-profiles-for-requests', providerIds],
    enabled: providerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('*, profiles!provider_profiles_user_id_fkey(first_name, last_name)')
        .in('user_id', providerIds);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <h1 className="font-display text-2xl font-bold">My Requests</h1>
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No requests yet. Browse services to get started!</p>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const pp = providerProfiles.find((p: any) => p.user_id === req.provider_id);
              const catInfo = CATEGORIES.find(c => c.key === req.category);
              return (
                <button key={req.id} onClick={() => navigate(`/client/requests/${req.id}`)} className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold"><ClickableName userId={req.provider_id} providerProfileId={pp?.id}>{(pp as any)?.profiles?.first_name} {(pp as any)?.profiles?.last_name}</ClickableName></p>
                      <p className="text-sm text-muted-foreground">{catInfo?.icon} {pp?.title || catInfo?.label}</p>
                    </div>
                    <StatusBadge status={req.status as any} />
                  </div>
                  <div className="text-sm text-muted-foreground"><p>{req.event_type} · {req.event_date}</p></div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <ClientNav />
    </div>
  );
}
