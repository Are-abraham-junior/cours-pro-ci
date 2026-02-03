import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Users, Clock, Plus, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';

interface ParentStats {
  totalOffers: number;
  openOffers: number;
  pendingApplications: number;
  acceptedApplications: number;
}

interface RecentApplication {
  id: string;
  message: string;
  statut: 'en_attente' | 'acceptee' | 'refusee';
  created_at: string;
  repetiteur: {
    full_name: string;
  };
  offer: {
    id: string;
    matiere: string;
    niveau: string;
  };
}

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<ParentStats>({
    totalOffers: 0,
    openOffers: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch offers stats
        const { data: offers, error: offersError } = await supabase
          .from('offers')
          .select('id, statut')
          .eq('parent_id', user.id);

        if (offersError) throw offersError;

        const openOffers = offers?.filter(o => o.statut === 'ouverte').length || 0;
        const offerIds = offers?.map(o => o.id) || [];

        // Fetch applications stats
        let pendingApplications = 0;
        let acceptedApplications = 0;
        let recentApps: RecentApplication[] = [];

        if (offerIds.length > 0) {
          const { data: applications, error: appsError } = await supabase
            .from('applications')
            .select(`
              id,
              message,
              statut,
              created_at,
              offer_id,
              repetiteur_id
            `)
            .in('offer_id', offerIds)
            .order('created_at', { ascending: false });

          if (appsError) throw appsError;

          pendingApplications = applications?.filter(a => a.statut === 'en_attente').length || 0;
          acceptedApplications = applications?.filter(a => a.statut === 'acceptee').length || 0;

          // Get recent applications with profiles
          const recentAppsRaw = applications?.slice(0, 5) || [];
          
          if (recentAppsRaw.length > 0) {
            const repetiteurIds = [...new Set(recentAppsRaw.map(a => a.repetiteur_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', repetiteurIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
            const offersMap = new Map(offers?.map(o => [o.id, o]) || []);

            // Fetch offer details
            const { data: offerDetails } = await supabase
              .from('offers')
              .select('id, matiere, niveau')
              .in('id', offerIds);

            const offerDetailsMap = new Map(offerDetails?.map(o => [o.id, o]) || []);

            recentApps = recentAppsRaw.map(app => ({
              id: app.id,
              message: app.message,
              statut: app.statut,
              created_at: app.created_at,
              repetiteur: {
                full_name: profilesMap.get(app.repetiteur_id)?.full_name || 'Inconnu',
              },
              offer: {
                id: app.offer_id,
                matiere: offerDetailsMap.get(app.offer_id)?.matiere || '',
                niveau: offerDetailsMap.get(app.offer_id)?.niveau || '',
              },
            }));
          }
        }

        setStats({
          totalOffers: offers?.length || 0,
          openOffers,
          pendingApplications,
          acceptedApplications,
        });
        setRecentApplications(recentApps);
      } catch (error) {
        console.error('Error fetching parent dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Total offres', value: stats.totalOffers, icon: FileText, color: 'text-primary' },
    { label: 'Offres ouvertes', value: stats.openOffers, icon: Clock, color: 'text-emerald-500' },
    { label: 'Candidatures en attente', value: stats.pendingApplications, icon: Users, color: 'text-amber-500' },
    { label: 'Candidatures acceptées', value: stats.acceptedApplications, icon: Users, color: 'text-violet-500' },
  ];

  const getStatusBadge = (status: 'en_attente' | 'acceptee' | 'refusee') => {
    const variants: Record<string, 'secondary' | 'default' | 'destructive'> = {
      en_attente: 'secondary',
      acceptee: 'default',
      refusee: 'destructive',
    };
    return (
      <Badge variant={variants[status]}>
        {APPLICATION_STATUS_LABELS[status]}
      </Badge>
    );
  };

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
      description={`Bienvenue ${profile?.full_name || ''} ! Gérez vos offres de cours et consultez les candidatures.`}
    >
      {/* Quick action */}
      <div className="mb-6">
        <Button asChild size="lg" className="gap-2">
          <Link to="/mes-offres/nouvelle">
            <Plus className="h-5 w-5" />
            Créer une nouvelle offre
          </Link>
        </Button>
      </div>

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

      {/* Recent applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Candidatures récentes</CardTitle>
            <CardDescription>
              Les dernières candidatures reçues sur vos offres
            </CardDescription>
          </div>
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/mes-offres">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Aucune candidature pour le moment
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez une offre pour recevoir des candidatures de répétiteurs
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((app) => (
                <Link
                  key={app.id}
                  to={`/mes-offres/${app.offer.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {app.repetiteur.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{app.repetiteur.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.offer.matiere} - {app.offer.niveau}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(app.statut)}
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {format(new Date(app.created_at), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
