import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get("status");
  const paymentId = searchParams.get("payment_id");
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [finalStatus, setFinalStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    async function verifyPayment() {
      if (!paymentId) {
        setIsVerifying(false);
        setFinalStatus('failed');
        return;
      }

      // We wait a bit to give webhook some time to fire
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from("payments")
            .select("status")
            .eq("id", paymentId)
            .single();

          if (error) throw error;
          
          if (data.status === 'completed') {
            setFinalStatus('success');
          } else if (data.status === 'failed') {
            setFinalStatus('failed');
          } else {
            // Still pending, but Genius Pay says it's success on URL
            // We just trust the URL status for initial display, webhook will resolve later
            if (status === 'success') {
              setFinalStatus('success');
            } else {
              setFinalStatus('failed');
            }
          }
        } catch (e) {
          console.error("Verification error", e);
          if (status === 'success') setFinalStatus('success');
          else setFinalStatus('failed');
        } finally {
          setIsVerifying(false);
        }
      }, 2000);
    }
    
    verifyPayment();
  }, [paymentId, status]);

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        {isVerifying ? (
          <div className="space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Vérification du paiement...</h2>
            <p className="text-muted-foreground">Veuillez patienter quelques instants.</p>
          </div>
        ) : finalStatus === 'success' ? (
          <div className="space-y-6 max-w-md">
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto" />
            <h2 className="text-3xl font-bold">Paiement Réussi !</h2>
            <p className="text-muted-foreground">
              Vos jetons ont été ou seront ajoutés à votre compte dans les prochaines minutes. Vous pouvez continuer à répondre aux offres.
            </p>
            <Button onClick={() => navigate("/repetiteur/tokens")} className="w-full">
              Voir mon portefeuille
            </Button>
          </div>
        ) : (
          <div className="space-y-6 max-w-md">
            <XCircle className="h-20 w-20 text-red-500 mx-auto" />
            <h2 className="text-3xl font-bold">Le paiement a échoué</h2>
            <p className="text-muted-foreground">
              Votre transaction n'a pas pu aboutir ou a été annulée. Aucun montant n'a été débité et les jetons n'ont pas été crédités.
            </p>
            <Button onClick={() => navigate("/repetiteur/tokens")} className="w-full" variant="outline">
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
