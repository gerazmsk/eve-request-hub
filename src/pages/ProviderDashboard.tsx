import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { ProviderNav } from '@/components/ProviderNav';
import { StatusBadge } from '@/components/StatusBadge';

export default function ProviderDashboard() {
  const { currentUser, getProviderRequests, getUserById } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;
  const requests = getProviderRequests(currentUser.id);

  return (
    <div className="min-h-screen pb-20">
      <div className="px-5 pt-8 pb-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-2xl font-bold">My Events</h1>
        </div>

        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No incoming requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map(req => {
              const client = getUserById(req.clientId);
              return (
                <button
                  key={req.id}
                  onClick={() => navigate(`/provider/events/${req.id}`)}
                  className="w-full text-left rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{req.eventType}</p>
                      <p className="text-sm text-muted-foreground">{client?.firstName} {client?.lastName}</p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{req.eventDate}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <ProviderNav />
    </div>
  );
}
