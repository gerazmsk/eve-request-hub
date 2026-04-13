import { Calendar, MessageCircle, User, Clock } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function ProviderNav() {
  const { unreadRequests, unreadMessages, clearUnreadRequests, clearUnreadMessages } = useRealtimeNotifications();

  const items = [
    { to: '/provider', icon: Calendar, label: 'My Events', badge: unreadRequests, onClear: clearUnreadRequests },
    { to: '/provider/availability', icon: Clock, label: 'Availability', badge: 0, onClear: undefined },
    { to: '/provider/messages', icon: MessageCircle, label: 'Messages', badge: unreadMessages, onClear: clearUnreadMessages },
    { to: '/provider/profile', icon: User, label: 'My Profile', badge: 0, onClear: undefined },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="flex justify-around py-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/provider'}
            className="relative flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-colors"
            activeClassName="text-primary"
            onClick={item.onClear}
          >
            <div className="relative">
              <item.icon className="h-5 w-5" />
              <NotificationBadge count={item.badge} />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
