import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';

export default function ProviderEventDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const { getRequestById, getUserById, updateRequestStatus, currentUser, getOrCreateThread } = useApp();
  const navigate = useNavigate();

  const req = getRequestById(requestId || '');
  if (!req || !currentUser) return null;

  const client = getUserById(req.clientId);

  const handleMessage = () => {
    const thread = getOrCreateThread(req.clientId, currentUser.id);
    navigate(`/provider/messages/${thread.id}`);
  };

  return (
    <div className="min-h-screen px-5 py-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Event Details</h1>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{req.eventType}</h2>
          <StatusBadge status={req.status} />
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Event Information</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> {req.eventDate}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> {req.eventTime}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {req.location}
            </p>
            {req.budget && <p className="text-muted-foreground">Budget: {req.budget}</p>}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Customer</h3>
          <p className="text-sm">{client?.firstName} {client?.lastName}</p>
          <p className="text-xs text-muted-foreground">{client?.email}</p>
        </div>

        {req.notes && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-semibold text-sm">Notes from Customer</h3>
            <p className="text-sm text-muted-foreground">{req.notes}</p>
          </div>
        )}

        <div className="space-y-3 pt-2">
          {req.status === 'pending' && (
            <>
              <Button className="w-full rounded-xl h-12 text-base" onClick={() => updateRequestStatus(req.id, 'confirmed')}>
                Confirm Request
              </Button>
              <Button variant="outline" className="w-full rounded-xl h-11 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => updateRequestStatus(req.id, 'declined')}>
                Decline Request
              </Button>
            </>
          )}
          <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleMessage}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Message Customer
          </Button>
        </div>
      </div>
    </div>
  );
}
