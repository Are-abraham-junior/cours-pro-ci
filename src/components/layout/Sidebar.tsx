import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/users/RoleBadge';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCircle,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles?: ('super_admin' | 'admin' | 'prestataire' | 'client')[];
}

const navItems: NavItem[] = [
  { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Utilisateurs', href: '/users', icon: Users, roles: ['super_admin', 'admin'] },
  { label: 'Répétiteurs', href: '/prestataires', icon: GraduationCap, roles: ['super_admin', 'admin'] },
  { label: 'Parents', href: '/clients', icon: Home, roles: ['super_admin', 'admin'] },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => roles.includes(role));
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">Mon Répétiteur</h1>
            <p className="text-xs text-sidebar-foreground/70">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer - User info */}
      <div className="p-4 border-t border-sidebar-border">
        <Link
          to="/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <UserCircle className="w-8 h-8 text-sidebar-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {profile?.full_name || 'Utilisateur'}
            </p>
            {roles[0] && <RoleBadge role={roles[0]} size="sm" />}
          </div>
        </Link>

        <Button
          variant="ghost"
          className="w-full mt-2 text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-40 transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
