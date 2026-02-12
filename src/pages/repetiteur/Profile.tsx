import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RoleBadge } from '@/components/users/RoleBadge';
import { RepetiteurProfileForm } from '@/components/profile/RepetiteurProfileForm';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { DiplomaUpload } from '@/components/profile/DiplomaUpload';
import { Loader2, User, Phone, Calendar, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const basicProfileSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(10, "Le numéro doit contenir au moins 10 chiffres"),
});

type BasicProfileFormData = z.infer<typeof basicProfileSchema>;

export default function RepetiteurProfile() {
  const { profile, roles, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<BasicProfileFormData>({
    resolver: zodResolver(basicProfileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    },
  });

  const onSubmit = async (data: BasicProfileFormData) => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <DashboardLayout title="Mon Profil">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Accès aux champs supplémentaires du profil (cast pour les champs ajoutés)
  const extendedProfile = profile as typeof profile & {
    profil_complet?: boolean;
    matieres?: string[];
    niveaux?: string[];
  };

  return (
    <DashboardLayout 
      title="Mon Profil"
      description="Gérez votre profil de répétiteur"
    >
      {/* Indicateur de profil complet */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {extendedProfile.profil_complet ? (
              <>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Profil complet</h3>
                  <p className="text-muted-foreground">
                    Votre profil est visible par les parents lorsque vous postulez à leurs offres
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Profil incomplet</h3>
                  <p className="text-muted-foreground">
                    Complétez votre profil pour augmenter vos chances d'être sélectionné
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="competences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competences">Compétences</TabsTrigger>
          <TabsTrigger value="diplomes">Diplômes</TabsTrigger>
          <TabsTrigger value="infos">Infos personnelles</TabsTrigger>
        </TabsList>

        {/* Onglet Compétences */}
        <TabsContent value="competences">
          <RepetiteurProfileForm />
        </TabsContent>

        {/* Onglet Diplômes */}
        <TabsContent value="diplomes">
          <Card>
            <CardHeader>
              <CardTitle>Mes diplômes et certifications</CardTitle>
              <CardDescription>
                Téléchargez vos diplômes pour renforcer la confiance des parents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiplomaUpload />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Infos personnelles */}
        <TabsContent value="infos" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Infos du compte */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Informations du compte
                </CardTitle>
                <CardDescription>
                  Ces informations ne peuvent pas être modifiées
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Photo de profil */}
                <AvatarUpload 
                  currentAvatarUrl={profile.avatar_url} 
                  size="lg"
                />

                <div className="text-center">
                  <h3 className="font-semibold text-xl">{profile.full_name}</h3>
                  <div className="flex flex-wrap justify-center gap-1 mt-2">
                    {roles.map(role => (
                      <RoleBadge key={role} role={role} size="sm" />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Inscrit le {format(new Date(profile.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span>{profile.is_active ? 'Compte actif' : 'Compte inactif'}</span>
                  </div>
                </div>

                {/* Affichage des matières et niveaux sélectionnés */}
                {extendedProfile.matieres && extendedProfile.matieres.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Matières</p>
                    <div className="flex flex-wrap gap-1">
                      {extendedProfile.matieres.map(m => (
                        <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {extendedProfile.niveaux && extendedProfile.niveaux.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Niveaux</p>
                    <div className="flex flex-wrap gap-1">
                      {extendedProfile.niveaux.map(n => (
                        <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulaire de modification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Modifier les informations de base
                </CardTitle>
                <CardDescription>
                  Mettez à jour votre nom et numéro de téléphone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Jean Dupont"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de téléphone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="+225 07 01 02 03 04"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        'Enregistrer'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
