import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RequestSent() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-eve-sage-light flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-eve-sage" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold">Request Sent</h1>
          <p className="text-muted-foreground text-sm">
            Your request has been sent successfully. The provider will review your event details and respond soon.
          </p>
        </div>
        <div className="space-y-3">
          <Button onClick={() => navigate('/client/requests')} className="w-full rounded-xl h-12">
            Go to My Requests
          </Button>
          <Button variant="outline" onClick={() => navigate('/client')} className="w-full rounded-xl h-12">
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
