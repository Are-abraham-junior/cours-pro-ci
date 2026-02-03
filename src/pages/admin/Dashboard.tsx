import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, Home, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleBadge } from '@/components/users/RoleBadge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Stats {
  totalUsers: number;
  prestataires: number;
  clients: number;
  admins: number;
  totalOffers: number;
  openOffers: number;
  totalApplications: number;
  pendingApplications: number;
}

interface RecentUser {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
  role: 'super_admin' | 'admin' | 'prestataire' | 'client';
}

export default function Dashboard() {
  const { profile, roles } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    prestataires: 0,
    clients: 0,
    admins: 0,
    totalOffers: 0,
    openOffers: 0,
    totalApplications: 0,
    pendingApplications: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer tous les profils
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) throw profilesError;

        // Récupérer tous les rôles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');

        if (rolesError) throw rolesError;

        // Calculer les stats
        const roleCounts = {
          super_admin: 0,
          admin: 0,
          prestataire: 0,
          client: 0,
        };

        userRoles?.forEach(ur => {
          if (ur.role in roleCounts) {
            roleCounts[ur.role as keyof typeof roleCounts]++;
          }
        });

        // Fetch offers stats
        const { data: offers, error: offersError } = await supabase
          .from('offers')
          .select('id, statut');

        if (offersError) throw offersError;

        const openOffers = offers?.filter(o => o.statut === 'ouverte').length || 0;

        // Fetch applications stats
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select('id, statut');

        if (appsError) throw appsError;

        const pendingApplications = applications?.filter(a => a.statut === 'en_attente').length || 0;

        setStats({
          totalUsers: profiles?.length || 0,
          prestataires: roleCounts.prestataire,
          clients: roleCounts.client,
          admins: roleCounts.admin + roleCounts.super_admin,
          totalOffers: offers?.length || 0,
          openOffers,
          totalApplications: applications?.length || 0,
          pendingApplications,
        });

        // Récupérer les derniers utilisateurs inscrits avec leurs rôles
        const recentProfiles = profiles
          ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5) || [];

        const recentWithRoles: RecentUser[] = recentProfiles.map(p => {
          const userRole = userRoles?.find(r => r.user_id === p.id);
          return {
            id: p.id,
            full_name: p.full_name,
            phone: p.phone,
            created_at: p.created_at,
            role: (userRole?.role as RecentUser['role']) || 'client',
          };
        });

        setRecentUsers(recentWithRoles);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Répétiteurs', value: stats.prestataires, icon: GraduationCap, color: 'text-emerald-500' },
    { label: 'Parents', value: stats.clients, icon: Home, color: 'text-violet-500' },
    { label: 'Administrateurs', value: stats.admins, icon: BookOpen, color: 'text-secondary' },
    { label: 'Total Offres', value: stats.totalOffers, icon: BookOpen, color: 'text-amber-500' },
    { label: 'Offres ouvertes', value: stats.openOffers, icon: BookOpen, color: 'text-emerald-500' },
    { label: 'Total Candidatures', value: stats.totalApplications, icon: Users, color: 'text-primary' },
    { label: 'En attente', value: stats.pendingApplications, icon: Users, color: 'text-amber-500' },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Tableau de bord">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Tableau de bord" 
      description={`Bienvenue ${profile?.full_name || ''} ! Voici un aperçu de votre plateforme.`}
    >
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent users */}
      <Card>
        <CardHeader>
          <CardTitle>Dernières inscriptions</CardTitle>
          <CardDescription>
            Les 5 derniers utilisateurs inscrits sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun utilisateur inscrit pour le moment
            </p>
          ) : (
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <RoleBadge role={user.role} size="sm" />
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
