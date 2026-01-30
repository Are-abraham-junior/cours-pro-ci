import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Shield, ShieldCheck, GraduationCap, Users } from 'lucide-react';

type AppRole = 'super_admin' | 'admin' | 'prestataire' | 'client';

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'md' | 'lg';
}

const roleConfig: Record<AppRole, { label: string; className: string; icon: typeof Shield }> = {
  super_admin: {
    label: 'Super Admin',
    className: 'bg-primary text-primary-foreground hover:bg-primary/90',
    icon: ShieldCheck,
  },
  admin: {
    label: 'Admin',
    className: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    icon: Shield,
  },
  prestataire: {
    label: 'Répétiteur',
    className: 'bg-emerald-500 text-white hover:bg-emerald-600',
    icon: GraduationCap,
  },
  client: {
    label: 'Parent',
    className: 'bg-violet-500 text-white hover:bg-violet-600',
    icon: Users,
  },
};

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  return (
    <Badge 
      className={cn(
        config.className, 
        sizeClasses[size],
        'inline-flex items-center gap-1'
      )}
    >
      <Icon className={cn(
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-3.5 w-3.5',
        size === 'lg' && 'h-4 w-4',
      )} />
      {config.label}
    </Badge>
  );
}
