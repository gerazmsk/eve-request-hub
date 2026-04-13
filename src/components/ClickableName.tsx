import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ClickableNameProps {
  userId: string;
  providerProfileId?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a name to make it clickable.
 * If providerProfileId is given, navigates to /client/provider/:id.
 * Otherwise navigates to /profile/:userId.
 */
export function ClickableName({ userId, providerProfileId, children, className }: ClickableNameProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (providerProfileId) {
      navigate(`/client/provider/${providerProfileId}`);
    } else {
      navigate(`/profile/${userId}`);
    }
  };

  return (
    <span
      onClick={handleClick}
      className={cn('cursor-pointer hover:underline text-primary', className)}
      role="link"
      tabIndex={0}
    >
      {children}
    </span>
  );
}
