import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RequestStatus } from '@/types';

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'New', className: 'bg-accent/20 text-accent-foreground border-accent/30' },
  unlocked: { label: 'Unlocked', className: 'bg-secondary text-secondary-foreground border-border' },
  offer_sent: { label: 'Offer Sent', className: 'bg-primary/10 text-primary border-primary/20' },
  confirmed: { label: 'Accepted', className: 'bg-eve-sage-light text-eve-sage border-eve-sage/30' },
  accepted: { label: 'Accepted', className: 'bg-eve-sage-light text-eve-sage border-eve-sage/30' },
  completed: { label: 'Completed', className: 'bg-primary/10 text-primary border-primary/20' },
  closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
  declined: { label: 'Declined', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
