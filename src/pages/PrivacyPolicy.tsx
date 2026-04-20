import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
        </div>
        <section className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>EVE collects account, profile, request, message, review, and media information needed to operate the event marketplace.</p>
          <p>We use this information to connect clients and providers, manage requests, support messaging, improve safety, and provide customer support.</p>
          <p>We do not sell personal information. Account data is protected by access controls so users can access only the information needed for their role and marketplace interactions.</p>
          <p>For support or privacy questions, contact <a className="underline underline-offset-2" href="mailto:support@eve-request-hub.lovable.app">support@eve-request-hub.lovable.app</a>.</p>
        </section>
      </div>
    </main>
  );
}