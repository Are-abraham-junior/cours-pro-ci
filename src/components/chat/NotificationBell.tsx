import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  href: string;
  className?: string;
}

export function NotificationBell({ href, className }: NotificationBellProps) {
  const { unreadCount } = useUnreadCount();

  return (
    <Link
      to={href}
      className={cn(
        'relative flex items-center justify-center w-9 h-9 rounded-full',
        'text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
        className
      )}
      title={`Messages${unreadCount > 0 ? ` (${unreadCount} non lus)` : ''}`}
    >
      <Bell
        className={cn(
          'h-5 w-5 transition-transform',
          unreadCount > 0 && 'animate-[wiggle_1s_ease-in-out_infinite]'
        )}
      />
      {unreadCount > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-0.5',
            'rounded-full bg-red-500 text-white text-[9px] font-bold',
            'flex items-center justify-center',
            'ring-2 ring-sidebar'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
