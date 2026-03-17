import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, MessageCircle, CheckCircle, Search, ArrowRight, Star, ShieldCheck, MapPin } from 'lucide-react';
import logo from '/logo.png';

const TrustBadge = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white font-semibold text-xs border border-white/20">
    <Icon className="w-3.5 h-3.5" />
    <span>{text}</span>
  </div>
);

const StepCard = ({ number, title, description }: { number: string, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center p-6 transition-all duration-300 hover:-translate-y-1">
    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl mb-6 shadow-lg shadow-primary/30">
      {number}
    </div>
    <h3 className="text-xl font-bold text-secondary mb-3">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const TestimonialCard = ({ name, role, quote, stars = 5 }: { name: string, role: string, quote: string, stars?: number }) => (
  <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardContent className="p-8">
      <div className="flex gap-0.5 mb-4 text-primary">
        {[...Array(stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
      </div>
      <p className="text-secondary/80 italic mb-6 leading-relaxed font-medium">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {name.charAt(0)}
        </div>
        <div>
          <CardTitle className="text-sm font-bold text-secondary">{name}</CardTitle>
          <p className="text-xs text-muted-foreground font-medium">{role}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Index() {
  return (
    <div className="min-h-screen bg-white">
      {/* Search-Centric Hero Section */}
      <section className="relative min-h-[85vh] flex items-center py-20 overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://img.freepik.com/photos-premium/pere-afro-americain-aidant-son-fils-etudier_236854-36644.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay blur-[2px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 via-secondary/80 to-secondary" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Trouvez le <span className="text-primary italic">compagnon de réussite</span> de votre enfant.
            </h1>
            
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto font-medium">
              Plus de 500 répétiteurs certifiés en Côte d'Ivoire prêts à accompagner vos enfants vers l'excellence.
            </p>

            {/* Mock Search Bar */}
            <div className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-2xl flex items-center transition-all focus-within:ring-4 focus-within:ring-primary/20">
              <div className="flex-1 flex items-center px-4 gap-3 text-muted-foreground border-r border-gray-100">
                <Search className="w-5 h-5 text-primary" />
                <Input 
                  placeholder="En quelle matière ?" 
                  className="border-none shadow-none focus-visible:ring-0 text-lg text-secondary placeholder:text-muted-foreground/60 p-0 h-auto"
                />
              </div>
              <div className="hidden md:flex flex-1 items-center px-4 gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-lg text-secondary/60">Quartier (ex. Cocody)</span>
              </div>
              <Link to="/auth?tab=signup">
                <Button className="h-14 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                  Trouvez mon prof
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <TrustBadge icon={ShieldCheck} text="Profils 100% Vérifiés" />
              <TrustBadge icon={Star} text="4.9/5 Moyenne Avis" />
              <TrustBadge icon={CheckCircle} text="Paiement Sécurisé" />
            </div>
          </div>
        </div>
      </section>

      {/* Segmented Entry Points */}
      <section className="py-24 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* For Parents */}
            <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500">
              <CardHeader className="p-0 relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/5 transition-colors z-10" />
                <img 
                  src="/Happy-family.png" 
                  alt="Soutien scolaire en famille" 
                  className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute bottom-6 left-6 z-20">
                  <div className="bg-white p-3 rounded-2xl shadow-lg inline-flex mb-3 transition-transform group-hover:rotate-12">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <h2 className="text-3xl font-black text-secondary mb-4">Je cherche un répétiteur</h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  Offrez à votre enfant un suivi personnalisé à domicile. Des experts pédagogues triés sur le volet.
                </p>
                <Link to="/auth?tab=signup">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all group/btn">
                    Trouver l'élu 
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* For Tutors */}
            <Card className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-secondary text-white">
              <CardHeader className="p-0 relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-secondary/40 group-hover:bg-secondary/20 transition-colors z-10" />
                <img 
                  src="/enseignant.png" 
                  alt="Répétiteurs" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute bottom-6 left-6 z-20">
                  <div className="bg-white p-3 rounded-2xl shadow-lg inline-flex mb-3 transition-transform group-hover:rotate-12">
                    <GraduationCap className="w-8 h-8 text-secondary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <h2 className="text-3xl font-black text-white mb-4">Je veux enseigner</h2>
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Augmentez vos revenus en partageant votre savoir. Rejoignez la première communauté de Côte d'Ivoire.
                </p>
                <Link to="/auth?tab=signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold bg-white text-secondary hover:bg-primary hover:text-white transition-all group/btn">
                    Devenir répétiteur 
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-secondary mb-4 italic tracking-tight underline decoration-primary decoration-8 underline-offset-[-2px]">Comment ça marche ?</h2>
            <p className="text-lg text-muted-foreground font-medium">Trois étapes simples pour transformer la scolarité de vos enfants.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <StepCard number="1" title="Cherchez" description="Explorez les profils certifiés près de chez vous selon vos critères (matière, tarif, expérience)." />
            <StepCard number="2" title="Contactez" description="Échangez via notre messagerie sécurisée et planifiez votre premier cours sans engagement." />
            <StepCard number="3" title="Progressez" description="Suivez l'évolution de votre enfant avec nos outils de monitoring et assurez sa réussite." />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50/50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-extrabold text-secondary mb-4">Ce qu'ils disent de nous</h2>
              <p className="text-lg text-muted-foreground font-medium">La satisfaction de nos utilisateurs est notre priorité absolue.</p>
            </div>
            <div className="flex gap-2">
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary cursor-not-allowed transition-all">←</div>
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary cursor-not-allowed transition-all">→</div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard name="Marie D." role="Maman de Kevin" quote="Un gain de temps incroyable. J'ai trouvé un répétiteur en 24h et les notes progressent déjà." />
            <TestimonialCard name="Jean K." role="Enseignant certifié" quote="Plateforme très sérieuse. Le système de paiement me permet d'être payé à temps et en toute sécurité." />
            <TestimonialCard name="Fatou S." role="Lycéenne" quote="Mon répétiteur m'aide vraiment à comprendre les maths. L'interface est super simple à utiliser." />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-[2.5rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Prêt à booster l'avenir de vos enfants ?</h2>
              <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto font-medium">Rejoignez Mon Répétiteur aujourd'hui et trouvez l'expert qu'il vous faut.</p>
              <Link to="/auth?tab=signup">
                <Button size="lg" className="h-16 px-12 text-xl font-black bg-secondary text-white hover:bg-secondary/90 hover:scale-105 transition-all shadow-xl">
                  C'est parti !
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="py-12 border-t border-gray-100 text-center">
        <div className="container mx-auto px-4">
          <img src={logo} alt="Logo" className="h-12 mx-auto mb-6 grayscale opacity-30" />
          <div className="flex justify-center gap-8 text-sm font-bold text-secondary/60 mb-6 uppercase tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Politique</a>
            <a href="#" className="hover:text-primary transition-colors">Aide</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            © 2026 Mon Répétiteur - Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
