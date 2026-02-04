import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, GraduationCap, MapPin, Clock, Briefcase, FileText } from 'lucide-react';
import { MATIERES, NIVEAUX, DISPONIBILITES } from '@/lib/constants';

const repetiteurProfileSchema = z.object({
  bio: z.string()
    .min(50, "La biographie doit contenir au moins 50 caractères")
    .max(1000, "La biographie ne peut pas dépasser 1000 caractères")
    .optional()
    .or(z.literal('')),
  matieres: z.array(z.string()).min(1, "Sélectionnez au moins une matière"),
  niveaux: z.array(z.string()).min(1, "Sélectionnez au moins un niveau"),
  disponibilites: z.array(z.string()).min(1, "Sélectionnez au moins une disponibilité"),
  localisation: z.string().min(3, "Indiquez votre localisation"),
  tarif_horaire: z.number()
    .min(1000, "Le tarif minimum est de 1 000 FCFA")
    .max(100000, "Le tarif maximum est de 100 000 FCFA")
    .optional()
    .or(z.literal(0)),
  experience_annees: z.number()
    .min(0, "L'expérience ne peut pas être négative")
    .max(50, "L'expérience maximum est de 50 ans")
    .optional()
    .or(z.literal(0)),
});

type RepetiteurProfileFormData = z.infer<typeof repetiteurProfileSchema>;

export function RepetiteurProfileForm() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const form = useForm<RepetiteurProfileFormData>({
    resolver: zodResolver(repetiteurProfileSchema),
    defaultValues: {
      bio: '',
      matieres: [],
      niveaux: [],
      disponibilites: [],
      localisation: '',
      tarif_horaire: 0,
      experience_annees: 0,
    },
  });

  // Charger les données existantes du profil
  useEffect(() => {
    const loadProfile = async () => {
      if (!profile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('bio, matieres, niveaux, disponibilites, localisation, tarif_horaire, experience_annees')
          .eq('id', profile.id)
          .single();

        if (error) throw error;

        if (data) {
          form.reset({
            bio: data.bio || '',
            matieres: data.matieres || [],
            niveaux: data.niveaux || [],
            disponibilites: data.disponibilites || [],
            localisation: data.localisation || '',
            tarif_horaire: data.tarif_horaire || 0,
            experience_annees: data.experience_annees || 0,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, [profile?.id, form]);

  const onSubmit = async (data: RepetiteurProfileFormData) => {
    if (!profile) return;

    setLoading(true);
    try {
      // Déterminer si le profil est complet
      const profilComplet = !!(
        data.bio && 
        data.bio.length >= 50 &&
        data.matieres.length > 0 && 
        data.niveaux.length > 0 && 
        data.disponibilites.length > 0 &&
        data.localisation
      );

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: data.bio || null,
          matieres: data.matieres,
          niveaux: data.niveaux,
          disponibilites: data.disponibilites,
          localisation: data.localisation || null,
          tarif_horaire: data.tarif_horaire || null,
          experience_annees: data.experience_annees || 0,
          profil_complet: profilComplet,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Profil mis à jour",
        description: profilComplet 
          ? "Votre profil est maintenant complet et visible par les parents !" 
          : "Vos informations ont été enregistrées. Complétez tous les champs pour avoir un profil complet.",
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

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Biographie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Biographie
            </CardTitle>
            <CardDescription>
              Présentez-vous aux parents (expérience, méthodologie, motivation...)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Bonjour, je suis un répétiteur passionné avec 5 ans d'expérience dans l'enseignement des mathématiques et de la physique. Ma méthode pédagogique repose sur..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/1000 caractères (minimum 50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Matières et Niveaux */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Matières */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Matières enseignées
              </CardTitle>
              <CardDescription>
                Sélectionnez les matières que vous pouvez enseigner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="matieres"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MATIERES.map((matiere) => (
                        <FormField
                          key={matiere}
                          control={form.control}
                          name="matieres"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(matiere)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, matiere]);
                                    } else {
                                      field.onChange(current.filter((v) => v !== matiere));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {matiere}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Niveaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Niveaux scolaires
              </CardTitle>
              <CardDescription>
                Sélectionnez les niveaux que vous pouvez enseigner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="niveaux"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {NIVEAUX.map((niveau) => (
                        <FormField
                          key={niveau}
                          control={form.control}
                          name="niveaux"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(niveau)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, niveau]);
                                    } else {
                                      field.onChange(current.filter((v) => v !== niveau));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {niveau}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Disponibilités */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Disponibilités
            </CardTitle>
            <CardDescription>
              Indiquez vos créneaux de disponibilité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="disponibilites"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {DISPONIBILITES.map((dispo) => (
                      <FormField
                        key={dispo}
                        control={form.control}
                        name="disponibilites"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(dispo)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, dispo]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== dispo));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {dispo}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Localisation et Tarif */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localisation
              </CardTitle>
              <CardDescription>
                Zone géographique où vous pouvez donner des cours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="localisation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quartier / Zone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Cocody, Plateau, Marcory..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Expérience et Tarif
              </CardTitle>
              <CardDescription>
                Informations complémentaires sur votre profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="experience_annees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Années d'expérience</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tarif_horaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarif horaire indicatif (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step={500}
                        placeholder="Ex: 5000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Laissez vide si négociable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer mon profil'
          )}
        </Button>
      </form>
    </Form>
  );
}
