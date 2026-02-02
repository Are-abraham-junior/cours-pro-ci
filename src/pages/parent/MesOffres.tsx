import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OfferCard } from '@/components/offers/OfferCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, FileText } from 'lucide-react';
import { OfferStatus } from '@/lib/constants';

interface OfferWithCount {
  id: string;
  matiere: string;
  niveau: string;
  description: string;
  adresse: string;
  frequence: string;
  budget_min: number;
  budget_max: number;
  statut: OfferStatus;
  created_at: string;
  applications_count: number;
}

export default function MesOffres() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [offers, setOffers] = useState<OfferWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user]);

  const fetchOffers = async () => {
    try {
      // Fetch offers
      const { data: offersData, error: offersError } = await supabase
        .from('offers')
        .select('*')
        .eq('parent_id', user!.id)
        .order('created_at', { ascending: false });

      if (offersError) throw offersError;

      // Fetch applications count for each offer
      const offersWithCount: OfferWithCount[] = await Promise.all(
        (offersData || []).map(async (offer) => {
          const { count } = await supabase
            .from('applications')
            .select('*', { count: 'exact', head: true })
            .eq('offer_id', offer.id);

          return {
            ...offer,
            statut: offer.statut as OfferStatus,
            applications_count: count || 0,
          };
        })
      );

      setOffers(offersWithCount);
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos offres',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (offerId: string) => {
    navigate(`/mes-offres/${offerId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mes offres de cours</h1>
            <p className="text-muted-foreground">
              Gérez vos annonces et consultez les candidatures
            </p>
          </div>
          <Button onClick={() => navigate('/mes-offres/nouvelle')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle offre
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/50">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucune offre publiée
            </h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première offre pour trouver un répétiteur
            </p>
            <Button onClick={() => navigate('/mes-offres/nouvelle')}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une offre
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                showStatus
                showApplicationsCount
                actionLabel="Voir détails"
                onAction={handleViewDetails}
                variant="parent"
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
