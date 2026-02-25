import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search, UserCheck, UserX, GraduationCap, Phone, Calendar,
  ShieldCheck, ShieldX, FileSearch,
} from 'lucide-react';
import { RepetiteurDocuments } from '@/components/profile/RepetiteurDocuments';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  documents_valides?: boolean;
};

interface UserWithRole extends Profile {
  role: 'prestataire';
}

export default function Prestataires() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const fetchPrestataires = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'prestataire');

      if (rolesError) throw rolesError;

      if (!rolesData || rolesData.length === 0) {
        setUsers([]);
        return;
      }

      const userIds = rolesData.map((r) => r.user_id);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      setUsers(
        (profilesData || []).map((p) => ({
          ...(p as Profile),
          role: 'prestataire' as const,
        }))
      );
    } catch (error) {
      console.error('Error fetching prestataires:', error);
      toast({ title: 'Erreur', description: 'Impossible de charger les répétiteurs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrestataires();
  }, []);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus } as any)
        .eq('id', userId);
      if (error) throw error;
      toast({ title: 'Succès', description: `Répétiteur ${!currentStatus ? 'activé' : 'désactivé'}` });
      fetchPrestataires();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de modifier le statut', variant: 'destructive' });
    }
  };

  const toggleValidation = async (userId: string, currentVal: boolean) => {
    setValidating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ documents_valides: !currentVal } as any)
        .eq('id', userId);
      if (error) throw error;
      toast({
        title: !currentVal ? '✅ Documents validés' : 'Documents invalidés',
        description: !currentVal
          ? 'Le répétiteur peut désormais postuler aux offres.'
          : 'Le répétiteur ne peut plus postuler aux offres.',
      });
      await fetchPrestataires();
      // Mise à jour locale dans le dialog
      setSelectedUser((prev) =>
        prev?.id === userId ? { ...prev, documents_valides: !currentVal } : prev
      );
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getDocBadge = (u: UserWithRole) => {
    if ((u as any).documents_valides) {
      return <Badge className="bg-green-100 text-green-700 border-green-200">✓ Validé</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-300">En attente</Badge>;
  };

  // Stats
  const stats = {
    total: users.length,
    actifs: users.filter((u) => u.is_active).length,
    inactifs: users.filter((u) => !u.is_active).length,
    valides: users.filter((u) => (u as any).documents_valides).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Répétiteurs</h1>
            </div>
            <p className="text-muted-foreground">Gérez les répétiteurs et validez leurs documents</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: GraduationCap, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Actifs', value: stats.actifs, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-500/10' },
              { label: 'Inactifs', value: stats.inactifs, icon: UserX, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Docs validés', value: stats.valides, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-500/10' },
            ].map((s) => (
              <div key={s.label} className="bg-card p-5 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${s.bg} rounded-lg`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un répétiteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Chargement...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun répétiteur trouvé</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut compte</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <p className="font-medium">{user.full_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDocBadge(user)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <FileSearch className="mr-1.5 h-3.5 w-3.5" />
                            Voir & Valider
                          </Button>
                          <Button
                            variant={user.is_active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? 'Désactiver' : 'Activer'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      {/* Dialog de validation des documents */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {selectedUser?.full_name}
            </DialogTitle>
            <DialogDescription>
              Consultez les documents du répétiteur et validez son dossier pour lui permettre de postuler.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5">
              {/* Statut actuel */}
              <div className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm border ${(selectedUser as any).documents_valides
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                {(selectedUser as any).documents_valides ? (
                  <><ShieldCheck className="h-5 w-5 shrink-0" /><span>Documents <strong>validés</strong> — le répétiteur peut postuler.</span></>
                ) : (
                  <><ShieldX className="h-5 w-5 shrink-0" /><span>Documents <strong>non validés</strong> — le répétiteur ne peut pas encore postuler.</span></>
                )}
              </div>

              {/* Documents */}
              <RepetiteurDocuments userId={selectedUser.id} />

              {/* Boutons de validation */}
              <div className="flex gap-3 pt-2 border-t">
                {!(selectedUser as any).documents_valides ? (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => toggleValidation(selectedUser.id, false)}
                    disabled={validating}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {validating ? 'Validation...' : 'Valider les documents'}
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => toggleValidation(selectedUser.id, true)}
                    disabled={validating}
                  >
                    <ShieldX className="mr-2 h-4 w-4" />
                    {validating ? 'Traitement...' : 'Invalider les documents'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
