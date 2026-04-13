import { Calendar, MessageCircle, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';

const items = [
  { to: '/provider', icon: Calendar, label: 'My Events' },
  { to: '/provider/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/provider/profile', icon: User, label: 'My Profile' },
];

export function ProviderNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="flex justify-around py-2">
        {items.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/provider'}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground transition-colors"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
