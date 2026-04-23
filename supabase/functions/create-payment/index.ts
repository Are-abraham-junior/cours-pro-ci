import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GENIUS_PAY_API_KEY = Deno.env.get('GENIUS_PAY_API_KEY') || '';
const GENIUS_PAY_API_SECRET = Deno.env.get('GENIUS_PAY_API_SECRET') || '';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé: Session invalide' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile details
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    const { amount, tokens_count, return_url } = await req.json();

    if (!amount || !tokens_count || !return_url) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Server-side validation
    const validPrices: Record<number, number> = {
      1: 200,
      3: 500,
      7: 1000,
      10: 1500
    };

    if (validPrices[tokens_count] !== amount) {
      return new Response(JSON.stringify({ error: 'Montant invalide' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialiser le client Admin pour contourner la politique RLS lors de l'insertion et de la MAJ
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create a pending payment record in DB
    const { data: paymentRecord, error: dbError } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        amount,
        tokens_count,
        status: 'pending'
      })
      .select('id')
      .single();

    if (dbError || !paymentRecord) {
      return new Response(JSON.stringify({ error: `Erreur DB: ${dbError?.message}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!GENIUS_PAY_API_KEY || !GENIUS_PAY_API_SECRET) {
      return new Response(JSON.stringify({ error: 'Clés API Genius Pay manquantes dans Supabase Secrets' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Genius Pay API
    const response = await fetch('https://pay.genius.ci/api/v1/merchant/payments', {
      method: 'POST',
      headers: {
        'X-API-Key': GENIUS_PAY_API_KEY,
        'X-API-Secret': GENIUS_PAY_API_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description: `Achat de ${tokens_count} jeton(s) sur Mon Répétiteur`,
        customer: {
          name: profile?.full_name || 'Répétiteur anonyme',
          email: user.email,
          phone: profile?.phone || '', 
        },
        metadata: {
          payment_id: paymentRecord.id,
          user_id: user.id,
          tokens_count
        },
        success_url: `${return_url}?status=success&payment_id=${paymentRecord.id}`,
        error_url: `${return_url}?status=failed&payment_id=${paymentRecord.id}`
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('Genius Pay API error:', data);
      
      // Update our record to failed
      await supabaseAdmin
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentRecord.id);
        
      return new Response(JSON.stringify({ error: `Erreur API Partenaire: ${JSON.stringify(data)}` }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update DB with reference and checkout_url
    await supabaseAdmin
      .from('payments')
      .update({
        genius_pay_reference: data.data.reference,
        checkout_url: data.data.checkout_url
      })
      .eq('id', paymentRecord.id);

    return new Response(JSON.stringify({ checkout_url: data.data.checkout_url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Internal Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
