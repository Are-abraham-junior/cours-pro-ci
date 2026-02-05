import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  FileCheck, 
  Calendar, 
  MapPin, 
  GraduationCap,
  Phone,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ContractStatus = 'actif' | 'termine' | 'annule';

const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  actif: 'Actif',
  termine: 'Terminé',
  annule: 'Annulé',
};

const statusColors: Record<ContractStatus, string> = {
  actif: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  termine: 'bg-muted text-muted-foreground border-muted',
  annule: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface Contract {
  id: string;
  matiere: string;
  niveau: string;
  frequence: string;
  adresse: string;
  tarif_convenu: number | null;
  date_debut: string;
  date_fin: string | null;
  statut: ContractStatus;
  created_at: string;
  parent: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string;
  };
}

export default function MesContratsRepetiteur() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('repetiteur_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch parent profiles
      const parentIds = [...new Set(data?.map(c => c.parent_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone')
        .in('id', parentIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const contractsWithProfiles: Contract[] = (data || []).map(contract => ({
        ...contract,
        statut: contract.statut as ContractStatus,
        parent: profilesMap.get(contract.parent_id) || {
          id: contract.parent_id,
          full_name: 'Inconnu',
          avatar_url: null,
          phone: '',
        },
      }));

      setContracts(contractsWithProfiles);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les contrats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activeContracts = contracts.filter(c => c.statut === 'actif');
  const pastContracts = contracts.filter(c => c.statut !== 'actif');

  if (loading) {
    return (
      <DashboardLayout title="Mes contrats">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const ContractCard = ({ contract }: { contract: Contract }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contract.parent.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary/10 text-secondary-foreground">
                {contract.parent.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {contract.parent.full_name}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {contract.parent.phone}
              </CardDescription>
            </div>
          </div>
          <Badge className={cn('border', statusColors[contract.statut])}>
            {CONTRACT_STATUS_LABELS[contract.statut]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <GraduationCap className="h-3 w-3" />
            {contract.matiere}
          </Badge>
          <Badge variant="outline">{contract.niveau}</Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {contract.frequence}
          </Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{contract.adresse}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Début: {format(new Date(contract.date_debut), 'dd MMMM yyyy', { locale: fr })}
            {contract.date_fin && (
              <> • Fin: {format(new Date(contract.date_fin), 'dd MMMM yyyy', { locale: fr })}</>
            )}
          </span>
        </div>

        {contract.tarif_convenu && (
          <p className="text-sm font-medium text-primary">
            Tarif convenu: {contract.tarif_convenu.toLocaleString('fr-FR')} FCFA
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout
      title="Mes contrats"
      description="Consultez vos contrats en cours et passés"
    >
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun contrat</h3>
            <p className="text-muted-foreground mb-4">
              Postulez à des offres pour obtenir des contrats
            </p>
            <Button asChild>
              <Link to="/offres">Voir les offres</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active contracts */}
          {activeContracts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Contrats actifs ({activeContracts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeContracts.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
              </div>
            </section>
          )}

          {/* Past contracts */}
          {pastContracts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                Contrats passés ({pastContracts.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pastContracts.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
