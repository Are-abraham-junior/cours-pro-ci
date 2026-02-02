import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ApplicationCard } from '@/components/offers/ApplicationCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, MapPin, Calendar, Coins, Users } from 'lucide-react';
import { OFFER_STATUS_LABELS, OfferStatus, ApplicationStatus } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Offer {
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
}

interface Application {
  id: string;
  message: string;
  statut: ApplicationStatus;
  created_at: string;
  repetiteur: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string;
  };
}

const statusColors: Record<OfferStatus, string> = {
  ouverte: 'bg-green-100 text-green-800',
  en_cours: 'bg-blue-100 text-blue-800',
  fermee: 'bg-gray-100 text-gray-800',
};

export default function OffreDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchOfferDetails();
    }
  }, [id, user]);

  const fetchOfferDetails = async () => {
    try {
      // Fetch offer
      const { data: offerData, error: offerError } = await supabase
        .from('offers')
        .select('*')
        .eq('id', id)
        .eq('parent_id', user!.id)
        .single();

      if (offerError) throw offerError;
      setOffer({ ...offerData, statut: offerData.statut as OfferStatus });

      // Fetch applications with repetiteur profiles
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          id,
          message,
          statut,
          created_at,
          repetiteur_id
        `)
        .eq('offer_id', id)
        .order('created_at', { ascending: false });

      if (applicationsError) throw applicationsError;

      // Fetch profiles for each application
      const applicationsWithProfiles: Application[] = await Promise.all(
        (applicationsData || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, phone')
            .eq('id', app.repetiteur_id)
            .single();

          return {
            ...app,
            statut: app.statut as ApplicationStatus,
            repetiteur: profile || {
              id: app.repetiteur_id,
              full_name: 'Utilisateur inconnu',
              avatar_url: null,
              phone: '',
            },
          };
        })
      );

      setApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error fetching offer details:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'offre',
        variant: 'destructive',
      });
      navigate('/mes-offres');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: OfferStatus) => {
    if (!offer) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('offers')
        .update({ statut: newStatus })
        .eq('id', offer.id);

      if (error) throw error;

      setOffer({ ...offer, statut: newStatus });
      toast({
        title: 'Statut mis à jour',
        description: `L'offre est maintenant "${OFFER_STATUS_LABELS[newStatus]}"`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleApplicationAction = async (
    applicationId: string,
    action: 'acceptee' | 'refusee'
  ) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ statut: action })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, statut: action } : app
        )
      );

      toast({
        title: action === 'acceptee' ? 'Candidature acceptée' : 'Candidature refusée',
        description:
          action === 'acceptee'
            ? 'Le répétiteur a été notifié de votre décision'
            : 'La candidature a été refusée',
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter la candidature',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatBudget = (min: number, max: number) => {
    const formatter = new Intl.NumberFormat('fr-FR');
    if (min === max) return `${formatter.format(min)} FCFA`;
    return `${formatter.format(min)} - ${formatter.format(max)} FCFA`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mes-offres')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mes offres
        </Button>

        {/* Offer details */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">
                  {offer.matiere} - {offer.niveau}
                </CardTitle>
                <Badge className={cn('mt-2', statusColors[offer.statut])}>
                  {OFFER_STATUS_LABELS[offer.statut]}
                </Badge>
              </div>
              <Select
                value={offer.statut}
                onValueChange={(value) => handleStatusChange(value as OfferStatus)}
                disabled={updating}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-foreground">{offer.description}</p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{offer.adresse}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{offer.frequence}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>{formatBudget(offer.budget_min, offer.budget_max)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{applications.length} candidature(s)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Candidatures reçues</h2>
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucune candidature reçue pour le moment
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  variant="parent"
                  onAccept={(id) => handleApplicationAction(id, 'acceptee')}
                  onReject={(id) => handleApplicationAction(id, 'refusee')}
                  isLoading={updating}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
