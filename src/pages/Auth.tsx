import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { signUpSchema, signInSchema, phoneToEmail, SignUpFormData, SignInFormData, UserType } from '@/lib/validations';
import { Loader2, GraduationCap, Phone, Lock, User, ArrowLeft } from 'lucide-react';
import { UserTypeSelector } from '@/components/auth/UserTypeSelector';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const [signupStep, setSignupStep] = useState<'type-selection' | 'form'>('type-selection');
  const [selectedUserType, setSelectedUserType] = useState<UserType | undefined>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      password: '',
      userType: undefined,
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const handleContinueToForm = () => {
    if (selectedUserType) {
      signUpForm.setValue('userType', selectedUserType);
      setSignupStep('form');
    }
  };

  const handleBackToTypeSelection = () => {
    setSignupStep('type-selection');
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const email = phoneToEmail(data.phone);

      const { error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
            user_type: data.userType,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      toast({
        title: "Compte créé avec succès !",
        description: "Vous êtes maintenant connecté.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (data: SignInFormData) => {
    setLoading(true);
    try {
      const email = phoneToEmail(data.phone);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Mon Répétiteur !",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message === 'Invalid login credentials' 
          ? "Numéro ou mot de passe incorrect" 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset signup step when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'signup') {
      setSignupStep('type-selection');
      setSelectedUserType(undefined);
      signUpForm.reset();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/10 via-background to-primary/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary mb-4">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-secondary">Mon Répétiteur</h1>
          <p className="text-muted-foreground mt-2">Plateforme de cours particuliers</p>
        </div>

        <Card className="shadow-xl border-0">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Connexion */}
              <TabsContent value="signin" className="mt-0">
                <CardTitle className="text-xl mb-2">Connexion</CardTitle>
                <CardDescription className="mb-6">
                  Entrez votre numéro de téléphone pour vous connecter
                </CardDescription>

                <Form {...signInForm}>
                  <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                    <FormField
                      control={signInForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de téléphone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="07 01 02 03 04"
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
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="••••••"
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
                          Connexion...
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Inscription */}
              <TabsContent value="signup" className="mt-0">
                {signupStep === 'type-selection' ? (
                  <>
                    <CardTitle className="text-xl mb-2 text-center">Rejoignez Mon Répétiteur</CardTitle>
                    <CardDescription className="mb-6 text-center">
                      Choisissez votre profil pour commencer
                    </CardDescription>

                    <UserTypeSelector
                      value={selectedUserType}
                      onChange={setSelectedUserType}
                    />

                    <Button
                      className="w-full mt-6"
                      disabled={!selectedUserType}
                      onClick={handleContinueToForm}
                    >
                      Continuer
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToTypeSelection}
                        className="h-8 w-8"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-xl">Créer un compte</CardTitle>
                        <CardDescription>
                          {selectedUserType === 'client' ? 'En tant que Parent' : 'En tant que Répétiteur'}
                        </CardDescription>
                      </div>
                    </div>

                    <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                        <FormField
                          control={signUpForm.control}
                          name="fullName"
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
                          control={signUpForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de téléphone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="07 01 02 03 04"
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
                          control={signUpForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="password"
                                    placeholder="Minimum 6 caractères"
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
                              Création du compte...
                            </>
                          ) : (
                            "S'inscrire"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Plateforme de répétition scolaire en Côte d'Ivoire
        </p>
      </div>
    </div>
  );
}
