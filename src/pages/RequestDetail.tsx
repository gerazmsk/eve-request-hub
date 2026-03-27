import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { StatusBadge } from '@/components/StatusBadge';

export default function RequestDetail() {
  const { requestId } = useParams<{ requestId: string }>();
  const { getRequestById, getUserById, getProfileByUserId, currentUser, getOrCreateThread } = useApp();
  const navigate = useNavigate();

  const req = getRequestById(requestId || '');
  if (!req || !currentUser) return null;

  const isClient = currentUser.role === 'client';
  const otherId = isClient ? req.providerId : req.clientId;
  const otherUser = getUserById(otherId);
  const profile = getProfileByUserId(req.providerId);

  const handleMessage = () => {
    const thread = getOrCreateThread(req.clientId, req.providerId);
    const basePath = isClient ? '/client' : '/provider';
    navigate(`${basePath}/messages/${thread.id}`);
  };

  return (
    <div className="min-h-screen px-5 py-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display text-xl font-bold">Request Details</h1>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-lg">{req.eventType}</p>
            <p className="text-sm text-muted-foreground">{profile?.title}</p>
          </div>
          <StatusBadge status={req.status} />
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Event Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" /> {req.eventDate}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" /> {req.eventTime}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {req.location}
            </div>
            {req.budget && <p className="text-muted-foreground">Budget: {req.budget}</p>}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">{isClient ? 'Provider' : 'Customer'}</h3>
          <p className="text-sm">{otherUser?.firstName} {otherUser?.lastName}</p>
        </div>

        {req.notes && (
          <div className="rounded-xl border bg-card p-4 space-y-2">
            <h3 className="font-semibold text-sm">Notes</h3>
            <p className="text-sm text-muted-foreground">{req.notes}</p>
          </div>
        )}

        <Button variant="outline" className="w-full rounded-xl h-11" onClick={handleMessage}>
          <MessageCircle className="h-4 w-4 mr-2" />
          {isClient ? 'Message Provider' : 'Message Customer'}
        </Button>
      </div>
    </div>
  );
}
