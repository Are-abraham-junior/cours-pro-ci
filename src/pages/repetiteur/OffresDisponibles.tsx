import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { OfferCard } from '@/components/offers/OfferCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Search, FileText, Filter, ShieldAlert } from 'lucide-react';
import { MATIERES, NIVEAUX, OfferStatus } from '@/lib/constants';

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

export default function OffresDisponibles() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const extProfile = profile as typeof profile & { documents_valides?: boolean };
  const documentsValides = !!extProfile?.documents_valides;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [matiereFilter, setMatiereFilter] = useState<string>('all');
  const [niveauFilter, setNiveauFilter] = useState<string>('all');

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('statut', 'ouverte')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOffers(
        (data || []).map((offer) => ({
          ...offer,
          statut: offer.statut as OfferStatus,
        }))
      );
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les offres',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      search === '' ||
      offer.matiere.toLowerCase().includes(search.toLowerCase()) ||
      offer.niveau.toLowerCase().includes(search.toLowerCase()) ||
      offer.description.toLowerCase().includes(search.toLowerCase()) ||
      offer.adresse.toLowerCase().includes(search.toLowerCase());

    const matchesMatiere =
      matiereFilter === 'all' || offer.matiere === matiereFilter;
    const matchesNiveau =
      niveauFilter === 'all' || offer.niveau === niveauFilter;

    return matchesSearch && matchesMatiere && matchesNiveau;
  });

  const handleViewDetails = (offerId: string) => {
    navigate(`/offres/${offerId}`);
  };

  const clearFilters = () => {
    setSearch('');
    setMatiereFilter('all');
    setNiveauFilter('all');
  };

  const hasActiveFilters =
    search !== '' || matiereFilter !== 'all' || niveauFilter !== 'all';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offres disponibles</h1>
          <p className="text-muted-foreground">
            Trouvez des opportunités de cours particuliers
          </p>
        </div>

        {/* Bannière blocage si documents non validés */}
        {!documentsValides && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700 text-sm">Candidatures désactivées</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Vos documents (diplômes et CNI) ne sont pas encore validés par l'administrateur. Vous pouvez consulter les offres mais vous ne pourrez pas postuler.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={matiereFilter} onValueChange={setMatiereFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les matières</SelectItem>
              {MATIERES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={niveauFilter} onValueChange={setNiveauFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {NIVEAUX.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              Effacer
            </Button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/50">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {hasActiveFilters ? 'Aucune offre trouvée' : 'Aucune offre disponible'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Essayez de modifier vos critères de recherche'
                : 'Revenez plus tard pour découvrir de nouvelles opportunités'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {filteredOffers.length} offre{filteredOffers.length > 1 ? 's' : ''} disponible{filteredOffers.length > 1 ? 's' : ''}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  actionLabel="Voir détails"
                  onAction={handleViewDetails}
                  variant="repetiteur"
                />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
