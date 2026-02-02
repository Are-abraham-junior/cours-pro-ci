import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OfferForm } from '@/components/offers/OfferForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { OfferFormData } from '@/lib/validations';
import { ArrowLeft } from 'lucide-react';

export default function NouvelleOffre() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: OfferFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('offers').insert({
        parent_id: user.id,
        matiere: data.matiere,
        niveau: data.niveau,
        description: data.description,
        adresse: data.adresse,
        frequence: data.frequence,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        statut: 'ouverte',
      });

      if (error) throw error;

      toast({
        title: 'Offre publiée !',
        description: 'Votre offre est maintenant visible par les répétiteurs',
      });

      navigate('/mes-offres');
    } catch (error) {
      console.error('Error creating offer:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de publier l\'offre. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/mes-offres')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à mes offres
        </Button>

        {/* Form card */}
        <Card>
          <CardHeader>
            <CardTitle>Créer une offre de cours</CardTitle>
            <CardDescription>
              Décrivez vos besoins pour trouver le répétiteur idéal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OfferForm onSubmit={handleSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
