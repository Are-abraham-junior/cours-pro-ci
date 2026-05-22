import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Zap } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Exemple de forfaits de jetons : 1 jeton = 1000 FCFA
const TOKEN_PACKS = [
  { id: "pack-1", name: "Pack Découverte", tokens: 1, price: 200, popular: false },
  { id: "pack-2", name: "Pack Essentiel", tokens: 3, price: 500, popular: false },
  { id: "pack-3", name: "Pack Standard", tokens: 7, price: 1000, popular: true },
  { id: "pack-4", name: "Pack Premium", tokens: 10, price: 1500, popular: false },
];

export default function Tokens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokens() {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (!error && data) {
        setBalance(data.tokens);
      }
      setLoading(false);
    }
    fetchTokens();
  }, [user]);

  const handleBuy = async (amount: number, tokensCount: number, packId: string) => {
    try {
      setBuyingId(packId);
      
      const returnUrl = `${window.location.origin}/repetiteur/payment-callback`;
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount,
          tokens_count: tokensCount,
          return_url: returnUrl
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.checkout_url) {
        // Rediriger vers la page de paiement Genius Pay
        window.location.href = data.checkout_url;
      } else {
        throw new Error("L'URL de paiement n'a pas été retournée.");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue lors de l'initialisation du paiement.",
        variant: "destructive"
      });
      setBuyingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-primary/10 p-6 rounded-lg border border-primary/20">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mon Portefeuille de Jetons</h2>
            <p className="text-muted-foreground">Achetez des jetons pour postuler aux offres des parents.</p>
          </div>
          <div className="text-center bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm min-w-32">
            <p className="text-sm text-muted-foreground uppercase font-semibold">Solde</p>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="text-3xl font-bold text-primary flex items-center justify-center gap-1">
                {balance} <Zap className="h-6 w-6 fill-primary" />
              </div>
            )}
          </div>
        </div>

        <h3 className="text-xl font-semibold mt-8 mb-4">Acheter plus de jetons</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          {TOKEN_PACKS.map(pack => (
            <Card key={pack.id} className={`relative flex flex-col ${pack.popular ? 'border-primary shadow-md' : ''}`}>
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-3 rounded-full">
                  Le plus populaire
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{pack.name}</CardTitle>
                <CardDescription>Idéal pour {pack.tokens} candidatures</CardDescription>
              </CardHeader>
              <CardContent className="text-center flex-grow">
                <div className="my-4 flex justify-center items-end gap-1">
                  <span className="text-4xl font-extrabold">{pack.tokens}</span>
                  <span className="text-muted-foreground font-medium mb-1">jetons</span>
                </div>
                <p className="text-2xl font-semibold text-primary">{pack.price.toLocaleString()} FCFA</p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={pack.popular ? "default" : "outline"}
                  onClick={() => handleBuy(pack.price, pack.tokens, pack.id)}
                  disabled={!!buyingId}
                >
                  {buyingId === pack.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Acheter
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
