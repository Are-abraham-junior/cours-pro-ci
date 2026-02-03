import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, Send, Clock, CheckCircle, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APPLICATION_STATUS_LABELS } from '@/lib/constants';

interface RepetiteurStats {
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  availableOffers: number;
}

interface RecentOffer {
  id: string;
  matiere: string;
  niveau: string;
  adresse: string;
  budget_min: number;
  budget_max: number;
  created_at: string;
}

interface MyApplication {
  id: string;
  statut: 'en_attente' | 'acceptee' | 'refusee';
  created_at: string;
  offer: {
    id: string;
    matiere: string;
    niveau: string;
  };
}

export default function RepetiteurDashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<RepetiteurStats>({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    availableOffers: 0,
  });
  const [recentOffers, setRecentOffers] = useState<RecentOffer[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch available offers count
        const { count: offersCount, error: offersCountError } = await supabase
          .from('offers')
          .select('*', { count: 'exact', head: true })
          .eq('statut', 'ouverte');

        if (offersCountError) throw offersCountError;

        // Fetch my applications
        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select('id, statut, created_at, offer_id')
          .eq('repetiteur_id', user.id)
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;

        const pendingCount = applications?.filter(a => a.statut === 'en_attente').length || 0;
        const acceptedCount = applications?.filter(a => a.statut === 'acceptee').length || 0;

        // Fetch offer details for applications
        const offerIds = [...new Set(applications?.map(a => a.offer_id) || [])];
        let applicationsWithOffers: MyApplication[] = [];

        if (offerIds.length > 0) {
          const { data: offerDetails } = await supabase
            .from('offers')
            .select('id, matiere, niveau')
            .in('id', offerIds);

          const offersMap = new Map(offerDetails?.map(o => [o.id, o]) || []);

          applicationsWithOffers = (applications || []).slice(0, 3).map(app => ({
            id: app.id,
            statut: app.statut,
            created_at: app.created_at,
            offer: {
              id: app.offer_id,
              matiere: offersMap.get(app.offer_id)?.matiere || '',
              niveau: offersMap.get(app.offer_id)?.niveau || '',
            },
          }));
        }

        // Fetch recent offers
        const { data: offers, error: offersError } = await supabase
          .from('offers')
          .select('id, matiere, niveau, adresse, budget_min, budget_max, created_at')
          .eq('statut', 'ouverte')
          .order('created_at', { ascending: false })
          .limit(3);

        if (offersError) throw offersError;

        setStats({
          totalApplications: applications?.length || 0,
          pendingApplications: pendingCount,
          acceptedApplications: acceptedCount,
          availableOffers: offersCount || 0,
        });
        setRecentOffers(offers || []);
        setMyApplications(applicationsWithOffers);
      } catch (error) {
        console.error('Error fetching repetiteur dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Offres disponibles', value: stats.availableOffers, icon: Briefcase, color: 'text-primary' },
    { label: 'Mes candidatures', value: stats.totalApplications, icon: Send, color: 'text-secondary' },
    { label: 'En attente', value: stats.pendingApplications, icon: Clock, color: 'text-amber-500' },
    { label: 'Acceptées', value: stats.acceptedApplications, icon: CheckCircle, color: 'text-emerald-500' },
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

  const formatBudget = (min: number, max: number) => {
    return `${min.toLocaleString('fr-FR')} - ${max.toLocaleString('fr-FR')} FCFA`;
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
      description={`Bienvenue ${profile?.full_name || ''} ! Consultez les offres de cours et suivez vos candidatures.`}
    >
      {/* Quick action */}
      <div className="mb-6">
        <Button asChild size="lg" className="gap-2">
          <Link to="/offres">
            <Briefcase className="h-5 w-5" />
            Voir les offres disponibles
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent offers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Offres récentes</CardTitle>
              <CardDescription>
                Les dernières offres de cours publiées
              </CardDescription>
            </div>
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/offres">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOffers.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Aucune offre disponible pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOffers.map((offer) => (
                  <Link
                    key={offer.id}
                    to={`/offres/${offer.id}`}
                    className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{offer.matiere}</p>
                        <p className="text-sm text-muted-foreground">{offer.niveau}</p>
                      </div>
                      <Badge variant="outline">
                        {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: fr })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{offer.adresse}</span>
                    </div>
                    <p className="text-sm font-medium text-primary mt-2">
                      {formatBudget(offer.budget_min, offer.budget_max)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mes candidatures</CardTitle>
              <CardDescription>
                Suivi de vos candidatures récentes
              </CardDescription>
            </div>
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/mes-candidatures">
                Voir tout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {myApplications.length === 0 ? (
              <div className="text-center py-8">
                <Send className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Vous n'avez pas encore postulé
                </p>
                <Button asChild variant="link" className="mt-2">
                  <Link to="/offres">Voir les offres disponibles</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{app.offer.matiere}</p>
                      <p className="text-sm text-muted-foreground">{app.offer.niveau}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(app.statut)}
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {format(new Date(app.created_at), 'dd MMM', { locale: fr })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
