import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RequestStatus } from '@/types';

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-accent/20 text-accent-foreground border-accent/30' },
  confirmed: { label: 'Confirmed', className: 'bg-eve-sage-light text-eve-sage border-eve-sage/30' },
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
