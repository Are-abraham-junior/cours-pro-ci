import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Upload, Trash2, FileText, Download, Eye, X } from 'lucide-react';

interface DiplomaFile {
  name: string;
  url: string;
  created_at: string;
}

export function DiplomaUpload() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [diplomas, setDiplomas] = useState<DiplomaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<DiplomaFile | null>(null);

  const fetchDiplomas = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('diplomas')
        .list(`${profile.id}/`, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;

      const files: DiplomaFile[] = (data || [])
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => ({
          name: f.name,
          url: supabase.storage.from('diplomas').getPublicUrl(`${profile.id}/${f.name}`).data.publicUrl,
          created_at: f.created_at || '',
        }));

      setDiplomas(files);
    } catch (error: any) {
      console.error('Error fetching diplomas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiplomas();
  }, [profile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: 'Format non supporté', description: 'Formats acceptés : JPG, PNG, WEBP, PDF', variant: 'destructive' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Fichier trop volumineux', description: 'Taille maximale : 10 Mo', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error } = await supabase.storage.from('diplomas').upload(filePath, file);
      if (error) throw error;

      toast({ title: 'Diplôme téléchargé', description: 'Le fichier a été ajouté avec succès' });
      await fetchDiplomas();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Erreur', description: error.message || "Échec de l'upload", variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!profile) return;
    try {
      const { error } = await supabase.storage.from('diplomas').remove([`${profile.id}/${fileName}`]);
      if (error) throw error;

      toast({ title: 'Diplôme supprimé' });
      await fetchDiplomas();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  };

  const isPdf = (name: string) => name.toLowerCase().endsWith('.pdf');
  const displayName = (name: string) => name.replace(/^\d+_/, '');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="diploma-upload">
          <Button asChild variant="outline" disabled={uploading}>
            <span className="cursor-pointer">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? 'Envoi en cours...' : 'Ajouter un diplôme'}
            </span>
          </Button>
        </label>
        <Input
          id="diploma-upload"
          type="file"
          accept="image/*,.pdf"
          onChange={handleUpload}
          className="hidden"
        />
        <span className="text-xs text-muted-foreground">JPG, PNG, PDF — max 10 Mo</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : diplomas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Aucun diplôme téléchargé pour le moment.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {diplomas.map((diploma) => (
            <Card key={diploma.name} className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all" onClick={() => setPreviewFile(diploma)}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {isPdf(diploma.name) ? (
                    <div className="h-20 w-20 rounded bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={diploma.url}
                      alt={displayName(diploma.name)}
                      className="h-20 w-20 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{displayName(diploma.name)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquez pour visualiser
                    </p>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); setPreviewFile(diploma); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" asChild onClick={(e) => e.stopPropagation()}>
                        <a href={diploma.url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(diploma.name); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {previewFile ? displayName(previewFile.name) : 'Aperçu du diplôme'}
          </DialogTitle>
          {previewFile && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold truncate pr-4">{displayName(previewFile.name)}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" asChild>
                    <a href={previewFile.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </a>
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/30 min-h-[60vh]">
                {isPdf(previewFile.name) ? (
                  <div className="flex flex-col items-center gap-6 py-12">
                    <FileText className="h-20 w-20 text-muted-foreground" />
                    <p className="text-muted-foreground text-center">
                      L'aperçu PDF n'est pas disponible dans le navigateur.<br />
                      Utilisez le bouton ci-dessous pour le consulter.
                    </p>
                    <div className="flex gap-3">
                      <Button asChild>
                        <a href={previewFile.url} target="_blank" rel="noopener noreferrer">
                          <Eye className="mr-2 h-4 w-4" />
                          Ouvrir le PDF
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={previewFile.url} download target="_blank" rel="noopener noreferrer">
                          <Download className="mr-2 h-4 w-4" />
                          Télécharger
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={previewFile.url}
                    alt={displayName(previewFile.name)}
                    className="max-w-full max-h-[75vh] object-contain rounded shadow-lg"
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