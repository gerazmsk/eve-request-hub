import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="font-display text-2xl font-bold">Terms of Service</h1>
        </div>
        <section className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p>EVE helps clients discover event providers and helps providers manage leads, requests, messages, reviews, and projects.</p>
          <p>Users are responsible for accurate account information, lawful use of the app, respectful communication, and honoring accepted event commitments.</p>
          <p>Provider credits may be used to unlock leads or requests. Unlocks are permanent for that provider and are not charged again for the same item.</p>
          <p>For support, contact <a className="underline underline-offset-2" href="mailto:support@eve-request-hub.lovable.app">support@eve-request-hub.lovable.app</a>.</p>
        </section>
      </div>
    </main>
  );
}