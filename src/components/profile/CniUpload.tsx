import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
    Loader2,
    Upload,
    Trash2,
    FileText,
    Download,
    Eye,
    CreditCard,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';

type CniSide = 'recto' | 'verso';

interface CniFile {
    side: CniSide;
    name: string;
    url: string;
}

export function CniUpload() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [uploading, setUploading] = useState<CniSide | null>(null);
    const [cniFiles, setCniFiles] = useState<CniFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<CniFile | null>(null);

    const fetchCniFiles = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from('cni')
                .list(`${profile.id}/`, { sortBy: { column: 'name', order: 'asc' } });

            if (error) throw error;

            const files: CniFile[] = (data || [])
                .filter((f) => f.name !== '.emptyFolderPlaceholder')
                .map((f) => ({
                    side: f.name.startsWith('recto') ? 'recto' : 'verso',
                    name: f.name,
                    url: supabase.storage.from('cni').getPublicUrl(`${profile.id}/${f.name}`).data.publicUrl,
                }));

            setCniFiles(files);
        } catch (error: any) {
            console.error('Error fetching CNI files:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCniFiles();
    }, [profile]);

    const handleUpload = async (side: CniSide, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: 'Format non supporté',
                description: 'Formats acceptés : JPG, PNG, WEBP, PDF',
                variant: 'destructive',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: 'Fichier trop volumineux',
                description: 'Taille maximale : 5 Mo',
                variant: 'destructive',
            });
            return;
        }

        setUploading(side);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${side}_${Date.now()}.${ext}`;
            const filePath = `${profile.id}/${fileName}`;

            // Supprimer l'ancien fichier du même côté s'il existe
            const existing = cniFiles.find((f) => f.side === side);
            if (existing) {
                await supabase.storage.from('cni').remove([`${profile.id}/${existing.name}`]);
            }

            const { error } = await supabase.storage.from('cni').upload(filePath, file, { upsert: true });
            if (error) throw error;

            toast({
                title: 'CNI téléchargée',
                description: `Le ${side} de votre CNI a été enregistré avec succès`,
            });
            await fetchCniFiles();
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({ title: 'Erreur', description: error.message || "Échec de l'upload", variant: 'destructive' });
        } finally {
            setUploading(null);
            e.target.value = '';
        }
    };

    const handleDelete = async (cni: CniFile) => {
        if (!profile) return;
        try {
            const { error } = await supabase.storage.from('cni').remove([`${profile.id}/${cni.name}`]);
            if (error) throw error;
            toast({ title: 'Fichier supprimé' });
            await fetchCniFiles();
        } catch (error: any) {
            toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        }
    };

    const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');
    const rectoFile = cniFiles.find((f) => f.side === 'recto');
    const versoFile = cniFiles.find((f) => f.side === 'verso');
    const isComplete = !!rectoFile && !!versoFile;

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statut global */}
            <div
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm ${isComplete
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-amber-50 border border-amber-200 text-amber-700'
                    }`}
            >
                {isComplete ? (
                    <>
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <span>Les deux faces de votre CNI ont été téléchargées.</span>
                    </>
                ) : (
                    <>
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <span>Veuillez télécharger le recto et le verso de votre CNI.</span>
                    </>
                )}
            </div>

            {/* Cartes Recto / Verso */}
            <div className="grid gap-4 sm:grid-cols-2">
                {(['recto', 'verso'] as CniSide[]).map((side) => {
                    const cni = side === 'recto' ? rectoFile : versoFile;
                    const inputId = `cni-upload-${side}`;
                    const isUploading = uploading === side;

                    return (
                        <div
                            key={side}
                            className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col"
                        >
                            {/* En-tête de la carte */}
                            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium capitalize text-sm">CNI — {side}</span>
                                </div>
                                {cni ? (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                                        ✓ Téléchargé
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                        Manquant
                                    </Badge>
                                )}
                            </div>

                            {/* Prévisualisation ou placeholder */}
                            <div className="flex-1 flex items-center justify-center bg-muted/10 min-h-[160px] relative">
                                {cni ? (
                                    isPdf(cni.name) ? (
                                        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                                            <FileText className="h-12 w-12" />
                                            <span className="text-xs">Fichier PDF</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={cni.url}
                                            alt={`CNI ${side}`}
                                            className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setPreviewFile(cni)}
                                        />
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground/50">
                                        <CreditCard className="h-12 w-12" />
                                        <span className="text-xs">Aucun fichier</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/10">
                                <label htmlFor={inputId} className="flex-1">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="w-full cursor-pointer"
                                        disabled={isUploading}
                                    >
                                        <span>
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                    Envoi...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-3.5 w-3.5" />
                                                    {cni ? 'Remplacer' : 'Télécharger'}
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                </label>
                                <input
                                    id={inputId}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleUpload(side, e)}
                                />

                                {cni && (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="px-2"
                                            onClick={() => setPreviewFile(cni)}
                                            title="Visualiser"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="px-2" asChild title="Télécharger">
                                            <a href={cni.url} download target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="px-2 text-destructive hover:text-destructive"
                                            onClick={() => handleDelete(cni)}
                                            title="Supprimer"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                )}
                            </div>
                            <p className="text-center text-[10px] text-muted-foreground pb-2">
                                JPG, PNG, PDF — max 5 Mo
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Dialog de prévisualisation */}
            <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
                    <DialogTitle className="sr-only">
                        {previewFile ? `Aperçu CNI — ${previewFile.side}` : 'Aperçu CNI'}
                    </DialogTitle>
                    {previewFile && (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold capitalize">CNI — {previewFile.side}</h3>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={previewFile.url} download target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-4 w-4" />
                                        Télécharger
                                    </a>
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/30 min-h-[60vh]">
                                {isPdf(previewFile.name) ? (
                                    <div className="flex flex-col items-center gap-6 py-12">
                                        <FileText className="h-20 w-20 text-muted-foreground" />
                                        <p className="text-muted-foreground text-center">
                                            L'aperçu PDF n'est pas disponible directement.
                                            <br />
                                            Utilisez le bouton ci-dessous pour l'ouvrir.
                                        </p>
                                        <Button asChild>
                                            <a href={previewFile.url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4" />
                                                Ouvrir le PDF
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <img
                                        src={previewFile.url}
                                        alt={`CNI ${previewFile.side}`}
                                        className="max-w-full max-h-[72vh] object-contain rounded shadow-lg"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
