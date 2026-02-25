import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ApplicationForm } from '@/components/offers/ApplicationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, MapPin, Calendar, Coins, Send, CheckCircle, ShieldAlert } from 'lucide-react';
import { OfferStatus } from '@/lib/constants';
import { ApplicationFormData } from '@/lib/validations';

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
  parent_id: string;
}

export default function OffreDetailsRepetiteur() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const extProfile = profile as typeof profile & { documents_valides?: boolean };
  const documentsValides = !!extProfile?.documents_valides;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        .single();

      if (offerError) throw offerError;
      setOffer({ ...offerData, statut: offerData.statut as OfferStatus });

      // Check if already applied
      const { data: existingApp } = await supabase
        .from('applications')
        .select('id')
        .eq('offer_id', id)
        .eq('repetiteur_id', user!.id)
        .maybeSingle();

      setHasApplied(!!existingApp);
    } catch (error) {
      console.error('Error fetching offer:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'offre',
        variant: 'destructive',
      });
      navigate('/offres');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (data: ApplicationFormData) => {
    if (!offer || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('applications').insert({
        offer_id: offer.id,
        repetiteur_id: user.id,
        message: data.message,
        statut: 'en_attente',
      });

      if (error) throw error;

      setHasApplied(true);
      setShowApplyModal(false);
      toast({
        title: 'Candidature envoyée !',
        description: 'Le parent recevra votre candidature et vous contactera si intéressé',
      });
    } catch (error: any) {
      console.error('Error applying:', error);
      if (error.code === '23505') {
        toast({
          title: 'Déjà candidaté',
          description: 'Vous avez déjà postulé à cette offre',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'envoyer votre candidature',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
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
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/offres')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux offres
        </Button>

        {/* Offer details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {offer.matiere} - {offer.niveau}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-foreground whitespace-pre-wrap">{offer.description}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Lieu</p>
                  <p className="font-medium">{offer.adresse}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Fréquence</p>
                  <p className="font-medium">{offer.frequence}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted sm:col-span-2">
                <Coins className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget mensuel</p>
                  <p className="font-medium">{formatBudget(offer.budget_min, offer.budget_max)}</p>
                </div>
              </div>
            </div>

            {/* Apply button */}
            {hasApplied ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400 font-medium">
                  Vous avez postulé à cette offre
                </span>
              </div>
            ) : !documentsValides ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-700 text-sm">Vous ne pouvez pas encore postuler</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Vos documents (diplômes et CNI) doivent être validés par l'administrateur avant de pouvoir postuler aux offres.
                    </p>
                  </div>
                </div>
                <Button size="lg" className="w-full mt-3" disabled>
                  <Send className="h-4 w-4 mr-2" />
                  Postuler à cette offre
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowApplyModal(true)}
              >
                <Send className="h-4 w-4 mr-2" />
                Postuler à cette offre
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Apply modal */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Postuler à cette offre</DialogTitle>
              <DialogDescription>
                {offer.matiere} - {offer.niveau} • {offer.adresse}
              </DialogDescription>
            </DialogHeader>
            <ApplicationForm
              onSubmit={handleApply}
              isLoading={isSubmitting}
              onCancel={() => setShowApplyModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
