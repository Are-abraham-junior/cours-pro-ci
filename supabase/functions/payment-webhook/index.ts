import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GENIUS_PAY_WEBHOOK_SECRET = Deno.env.get('GENIUS_PAY_WEBHOOK_SECRET') || '';

async function verifySignature(signature: string, timestamp: string, payloadStr: string, secret: string): Promise<boolean> {
  const data = timestamp + "." + payloadStr;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hexSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hexSignature === signature;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('X-Webhook-Signature');
    const timestamp = req.headers.get('X-Webhook-Timestamp');
    const eventType = req.headers.get('X-Webhook-Event');
    
    if (!signature || !timestamp || !eventType) {
      return new Response('Missing headers', { status: 400 });
    }

    // Verify timestamp to prevent replay attacks (5 mins)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
      return new Response('Timestamp too old', { status: 400 });
    }

    const bodyText = await req.text();
    
    // Verify signature
    const isValid = await verifySignature(signature, timestamp, bodyText, GENIUS_PAY_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    // Initialiser le client Supabase avec la SUPABASE_SERVICE_ROLE_KEY pour contourner RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (eventType === 'payment.success') {
      const paymentId = payload.data.metadata.payment_id;
      const tokensCount = payload.data.metadata.tokens_count;
      const userId = payload.data.metadata.user_id;

      if (!paymentId || !userId || !tokensCount) {
        return new Response('Missing metadata', { status: 400 });
      }

      // Start an atomic update or simply update payment and then profile
      const { data: currentPayment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .select('status')
        .eq('id', paymentId)
        .single();
        
      if (paymentError || !currentPayment) {
        console.error('Payment not found:', paymentId);
        return new Response('Payment not found', { status: 404 });
      }

      if (currentPayment.status === 'completed') {
        // Déjà traité
        return new Response('Already processed', { status: 200 });
      }

      // Mettre à jour le statut du paiement
      const { error: updateError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentId);

      if (updateError) {
        throw new Error(`Erreur MAJ paiement: ${updateError.message}`);
      }

      // Créditer les jetons à l'utilisateur
      // Pour une vraie séurité transactionnelle en PostgreSQL, Deno peut utiliser un RPC Supabase
      // Mais ici nous lisons et mettons à jour (attention au concurrency, mais acceptable pour ce cas)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('tokens')
        .eq('id', userId)
        .single();

      const newTokens = (profile?.tokens || 0) + tokensCount;
      await supabaseAdmin
        .from('profiles')
        .update({ tokens: newTokens })
        .eq('id', userId);

      console.log(`Payment successful: user ${userId} received ${tokensCount} tokens.`);

    } else if (eventType === 'payment.failed') {
      const paymentId = payload.data.metadata.payment_id;
      
      if (paymentId) {
        await supabaseAdmin
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', paymentId);
      }
    }

    return new Response(JSON.stringify({ received: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
