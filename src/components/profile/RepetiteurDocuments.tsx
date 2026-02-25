import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FileText, Download, Eye, CreditCard, GraduationCap } from 'lucide-react';

interface DocFile {
    name: string;
    url: string;
    bucket: string;
}

interface RepetiteurDocumentsProps {
    userId: string;
}

export function RepetiteurDocuments({ userId }: RepetiteurDocumentsProps) {
    const [diplomas, setDiplomas] = useState<DocFile[]>([]);
    const [cniFiles, setCniFiles] = useState<DocFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewFile, setPreviewFile] = useState<DocFile | null>(null);

    useEffect(() => {
        const fetchDocs = async () => {
            setLoading(true);
            try {
                const [diplomasRes, cniRes] = await Promise.all([
                    supabase.storage.from('diplomas').list(`${userId}/`, { sortBy: { column: 'created_at', order: 'desc' } }),
                    supabase.storage.from('cni').list(`${userId}/`, { sortBy: { column: 'name', order: 'asc' } }),
                ]);

                const mapFiles = (data: any[], bucket: string): DocFile[] =>
                    (data || [])
                        .filter((f) => f.name !== '.emptyFolderPlaceholder')
                        .map((f) => ({
                            name: f.name,
                            bucket,
                            url: supabase.storage.from(bucket).getPublicUrl(`${userId}/${f.name}`).data.publicUrl,
                        }));

                setDiplomas(mapFiles(diplomasRes.data || [], 'diplomas'));
                setCniFiles(mapFiles(cniRes.data || [], 'cni'));
            } catch (err) {
                console.error('Error fetching docs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, [userId]);

    const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');
    const displayName = (name: string) => name.replace(/^\d+_/, '').replace(/^(recto|verso)_\d+\./, '$1.');

    const totalDocs = diplomas.length + cniFiles.length;

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (totalDocs === 0) {
        return (
            <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun document téléchargé pour le moment.
            </p>
        );
    }

    const DocCard = ({ file, label }: { file: DocFile; label: string }) => (
        <div className="rounded-lg border bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
                {file.bucket === 'cni' ? (
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="text-xs font-medium truncate">{label}</span>
            </div>
            <div
                className="flex items-center justify-center bg-muted/10 cursor-pointer hover:opacity-80 transition h-24"
                onClick={() => setPreviewFile(file)}
            >
                {isPdf(file.name) ? (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <span className="text-xs">PDF</span>
                    </div>
                ) : (
                    <img src={file.url} alt={label} className="h-full w-full object-cover" />
                )}
            </div>
            <div className="flex gap-1 p-2">
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={() => setPreviewFile(file)}>
                    <Eye className="h-3 w-3 mr-1" /> Voir
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" asChild>
                    <a href={file.url} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3 mr-1" /> DL
                    </a>
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {cniFiles.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" /> CNI
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {cniFiles.map((f) => (
                            <DocCard
                                key={f.name}
                                file={f}
                                label={f.name.startsWith('recto') ? 'Recto' : 'Verso'}
                            />
                        ))}
                    </div>
                </div>
            )}

            {diplomas.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wide flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" /> Diplômes ({diplomas.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {diplomas.map((f) => (
                            <DocCard key={f.name} file={f} label={displayName(f.name)} />
                        ))}
                    </div>
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
                    <DialogTitle className="sr-only">Aperçu document</DialogTitle>
                    {previewFile && (
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold text-sm">{displayName(previewFile.name)}</h3>
                                <Button size="sm" variant="outline" asChild>
                                    <a href={previewFile.url} download target="_blank" rel="noopener noreferrer">
                                        <Download className="mr-2 h-3.5 w-3.5" /> Télécharger
                                    </a>
                                </Button>
                            </div>
                            <div className="flex items-center justify-center bg-muted/30 min-h-[60vh] p-4">
                                {isPdf(previewFile.name) ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <FileText className="h-16 w-16 text-muted-foreground" />
                                        <Button asChild>
                                            <a href={previewFile.url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="mr-2 h-4 w-4" /> Ouvrir le PDF
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <img
                                        src={previewFile.url}
                                        alt="Document"
                                        className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
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
