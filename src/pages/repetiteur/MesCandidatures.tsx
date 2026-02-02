import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ApplicationCard } from '@/components/offers/ApplicationCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText } from 'lucide-react';
import { ApplicationStatus } from '@/lib/constants';

interface ApplicationWithOffer {
  id: string;
  message: string;
  statut: ApplicationStatus;
  created_at: string;
  offer: {
    id: string;
    matiere: string;
    niveau: string;
  };
}

export default function MesCandidatures() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [applications, setApplications] = useState<ApplicationWithOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          message,
          statut,
          created_at,
          offer_id
        `)
        .eq('repetiteur_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch offer details for each application
      const applicationsWithOffers: ApplicationWithOffer[] = await Promise.all(
        (data || []).map(async (app) => {
          const { data: offer } = await supabase
            .from('offers')
            .select('id, matiere, niveau')
            .eq('id', app.offer_id)
            .single();

          return {
            ...app,
            statut: app.statut as ApplicationStatus,
            offer: offer || { id: app.offer_id, matiere: 'Offre supprimée', niveau: '' },
          };
        })
      );

      setApplications(applicationsWithOffers);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos candidatures',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOffer = (offerId: string) => {
    navigate(`/offres/${offerId}`);
  };

  // Group applications by status
  const pendingApplications = applications.filter((a) => a.statut === 'en_attente');
  const acceptedApplications = applications.filter((a) => a.statut === 'acceptee');
  const rejectedApplications = applications.filter((a) => a.statut === 'refusee');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mes candidatures</h1>
          <p className="text-muted-foreground">
            Suivez l'état de vos candidatures aux offres de cours
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/50">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune candidature
            </h3>
            <p className="text-muted-foreground">
              Consultez les offres disponibles et postulez pour commencer
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending */}
            {pendingApplications.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  En attente ({pendingApplications.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {pendingApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      variant="repetiteur"
                      onViewOffer={handleViewOffer}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Accepted */}
            {acceptedApplications.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Acceptées ({acceptedApplications.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {acceptedApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      variant="repetiteur"
                      onViewOffer={handleViewOffer}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Rejected */}
            {rejectedApplications.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Refusées ({rejectedApplications.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {rejectedApplications.map((application) => (
                    <ApplicationCard
                      key={application.id}
                      application={application}
                      variant="repetiteur"
                      onViewOffer={handleViewOffer}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
