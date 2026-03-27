import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ClientNav } from '@/components/ClientNav';
import { StatusBadge } from '@/components/StatusBadge';
import { CATEGORIES } from '@/types';

export default function MyRequests() {
  const { currentUser, getClientRequests, getUserById, getProfileByUserId } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;
  const requests = getClientRequests(currentUser.id);

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <h1 className="font-display text-2xl font-bold">My Requests</h1>

        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No requests yet. Browse services to get started!</p>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const providerUser = getUserById(req.providerId);
              const profile = providerUser ? getProfileByUserId(providerUser.id) : undefined;
              const catInfo = CATEGORIES.find(c => c.key === req.category);
              return (
                <button
                  key={req.id}
                  onClick={() => navigate(`/client/requests/${req.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{providerUser?.firstName} {providerUser?.lastName}</p>
                      <p className="text-sm text-muted-foreground">{catInfo?.icon} {profile?.title || catInfo?.label}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>{req.eventType} · {req.eventDate}</p>
                  </div>
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
