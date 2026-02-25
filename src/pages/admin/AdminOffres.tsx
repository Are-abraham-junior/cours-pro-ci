import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from '@/components/layout/Sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
    Search,
    Briefcase,
    Trash2,
    BookOpen,
    MapPin,
    Calendar,
    Banknote,
    Users,
    ClipboardList,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Offer = Database['public']['Tables']['offers']['Row'] & {
    parent_name?: string;
    applications_count?: number;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    ouverte: { label: 'Ouverte', variant: 'default' },
    en_cours: { label: 'En cours', variant: 'secondary' },
    fermee: { label: 'Fermée', variant: 'outline' },
};

export default function AdminOffres() {
    const [offres, setOffres] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { toast } = useToast();

    const fetchOffres = async () => {
        setLoading(true);
        try {
            // Récupérer toutes les offres
            const { data: offresData, error: offresError } = await supabase
                .from('offers')
                .select('*')
                .order('created_at', { ascending: false });

            if (offresError) throw offresError;

            if (!offresData || offresData.length === 0) {
                setOffres([]);
                return;
            }

            // Récupérer les noms des parents
            const parentIds = [...new Set(offresData.map((o) => o.parent_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', parentIds);

            const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));

            // Récupérer le nombre de candidatures par offre
            const { data: apps } = await supabase
                .from('applications')
                .select('offer_id');

            const appCountMap: Record<string, number> = {};
            (apps || []).forEach((a) => {
                appCountMap[a.offer_id] = (appCountMap[a.offer_id] || 0) + 1;
            });

            const enriched: Offer[] = offresData.map((o) => ({
                ...o,
                parent_name: profileMap[o.parent_id] || '—',
                applications_count: appCountMap[o.id] || 0,
            }));

            setOffres(enriched);
        } catch (error) {
            console.error('Error fetching offres:', error);
            toast({ title: 'Erreur', description: 'Impossible de charger les offres', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOffres();
    }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            // Supprimer d'abord les contrats liés
            await supabase.from('contracts').delete().eq('offer_id', deleteTarget.id);
            // Supprimer les candidatures liées
            await supabase.from('applications').delete().eq('offer_id', deleteTarget.id);
            // Supprimer l'offre
            const { error } = await supabase.from('offers').delete().eq('id', deleteTarget.id);
            if (error) throw error;

            toast({ title: 'Offre supprimée', description: `"${deleteTarget.matiere} – ${deleteTarget.niveau}" a été supprimée.` });
            setDeleteTarget(null);
            await fetchOffres();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer', variant: 'destructive' });
        } finally {
            setDeleting(false);
        }
    };

    const filteredOffres = offres.filter((o) =>
        o.matiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.niveau.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.parent_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.adresse.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

    const formatBudget = (min: number, max: number) =>
        `${min.toLocaleString()} – ${max.toLocaleString()} FCFA`;

    // Statistiques
    const stats = {
        total: offres.length,
        ouvertes: offres.filter((o) => o.statut === 'ouverte').length,
        en_cours: offres.filter((o) => o.statut === 'en_cours').length,
        fermees: offres.filter((o) => o.statut === 'fermee').length,
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />

            <main className="lg:ml-64 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Briefcase className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold text-foreground">Toutes les offres</h1>
                        </div>
                        <p className="text-muted-foreground">
                            Consultez et gérez toutes les offres publiées par les parents
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total', value: stats.total, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
                            { label: 'Ouvertes', value: stats.ouvertes, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-500/10' },
                            { label: 'En cours', value: stats.en_cours, icon: Users, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                            { label: 'Fermées', value: stats.fermees, icon: Briefcase, color: 'text-gray-500', bg: 'bg-gray-500/10' },
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

                    {/* Barre de recherche */}
                    <div className="bg-card rounded-xl border border-border p-5 mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par matière, niveau, parent, adresse..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {loading ? (
                            <div className="p-10 text-center text-muted-foreground">Chargement...</div>
                        ) : filteredOffres.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground">
                                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                <p>Aucune offre trouvée</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Matière / Niveau</TableHead>
                                        <TableHead>Parent</TableHead>
                                        <TableHead>Adresse</TableHead>
                                        <TableHead>Budget</TableHead>
                                        <TableHead>Candidatures</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredOffres.map((offre) => (
                                        <TableRow key={offre.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                                        <BookOpen className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{offre.matiere}</p>
                                                        <p className="text-xs text-muted-foreground">{offre.niveau}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{offre.parent_name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate max-w-[120px]">{offre.adresse}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Banknote className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="whitespace-nowrap">{formatBudget(offre.budget_min, offre.budget_max)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{offre.applications_count}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusConfig[offre.statut]?.variant ?? 'outline'}>
                                                    {statusConfig[offre.statut]?.label ?? offre.statut}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    <span>{formatDate(offre.created_at)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(offre)}
                                                >
                                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                    Supprimer
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </main>

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Vous êtes sur le point de supprimer l'offre{' '}
                            <strong>"{deleteTarget?.matiere} – {deleteTarget?.niveau}"</strong> publiée par{' '}
                            <strong>{deleteTarget?.parent_name}</strong>.
                            <br /><br />
                            Cette action supprimera également toutes les <strong>candidatures</strong> et{' '}
                            <strong>contrats</strong> associés. Elle est <strong>irréversible</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Suppression...' : 'Supprimer définitivement'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
