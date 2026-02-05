import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { 
  Loader2, 
  FileCheck, 
  Calendar, 
  MapPin, 
  GraduationCap,
  Phone,
  Clock
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
  repetiteur: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    phone: string;
  };
}

export default function MesContrats() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
        .eq('parent_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch repetiteur profiles
      const repetiteurIds = [...new Set(data?.map(c => c.repetiteur_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone')
        .in('id', repetiteurIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const contractsWithProfiles: Contract[] = (data || []).map(contract => ({
        ...contract,
        statut: contract.statut as ContractStatus,
        repetiteur: profilesMap.get(contract.repetiteur_id) || {
          id: contract.repetiteur_id,
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

  const handleStatusChange = async (contractId: string, newStatus: ContractStatus) => {
    setUpdating(contractId);
    try {
      const updateData: { statut: ContractStatus; date_fin?: string } = { statut: newStatus };
      
      if (newStatus === 'termine' || newStatus === 'annule') {
        updateData.date_fin = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contractId);

      if (error) throw error;

      setContracts(prev => 
        prev.map(c => 
          c.id === contractId 
            ? { ...c, statut: newStatus, date_fin: updateData.date_fin || c.date_fin } 
            : c
        )
      );

      toast({
        title: 'Contrat mis à jour',
        description: `Le contrat est maintenant "${CONTRACT_STATUS_LABELS[newStatus]}"`,
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le contrat',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Mes contrats">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Mes contrats"
      description="Gérez vos contrats avec les répétiteurs"
    >
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileCheck className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun contrat</h3>
            <p className="text-muted-foreground mb-4">
              Acceptez une candidature pour créer un contrat avec un répétiteur
            </p>
            <Button asChild>
              <Link to="/mes-offres">Voir mes offres</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map((contract) => (
            <Card key={contract.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={contract.repetiteur.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contract.repetiteur.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {contract.repetiteur.full_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {contract.repetiteur.phone}
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

                {contract.statut === 'actif' && (
                  <div className="pt-2 border-t">
                    <Select
                      value={contract.statut}
                      onValueChange={(value) => handleStatusChange(contract.id, value as ContractStatus)}
                      disabled={updating === contract.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Changer le statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="termine">Terminer le contrat</SelectItem>
                        <SelectItem value="annule">Annuler le contrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
