import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  initiateMobileMoneyCharge,
  generateTxRef,
  detectNetwork,
  formatPhoneForFlw,
  verifyTransaction,
} from '@/lib/payments/flutterwave';
import { apiLimiter, authLimiter } from '@/lib/api/rate-limit';

// ── GET - Historique des paiements ──
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const rateLimit = apiLimiter.check(user.id);
    if (!rateLimit.allowed) return rateLimit.response!;

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const paymentType = searchParams.get('type');

    let query = supabase
      .from('payments')
      .select('*, subscription:subscriptions(*)')
      .order('created_at', { ascending: false });

    // Non-admin: seulement ses propres paiements
    if (userData?.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    if (status) query = query.eq('status', status);
    if (paymentType) query = query.eq('payment_type', paymentType);
    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;
    if (error) throw error;

    // Stats rapides
    const payments = data || [];
    const stats = {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      totalAmountCDF: payments.filter(p => p.status === 'completed' && p.currency === 'CDF').reduce((s, p) => s + (p.amount || 0), 0),
      totalAmountUSD: payments.filter(p => p.status === 'completed' && p.currency === 'USD').reduce((s, p) => s + (p.amount || 0), 0),
    };

    return NextResponse.json({ payments, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST - Initier un paiement Mobile Money ──
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const rateLimit = authLimiter.check(user.id);
    if (!rateLimit.allowed) return rateLimit.response!;

    const body = await request.json();
    const {
      amount,
      currency = 'CDF',
      method = 'mobile-money',
      phone_number,
      network,
      payment_type = 'subscription',
      subscription_id,
      load_id,
      description,
      entity_type,
    } = body;

    // ── Validations ──
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const validCurrencies = ['CDF', 'USD'];
    if (!validCurrencies.includes(currency)) {
      return NextResponse.json({ error: `Devise invalide. Acceptees: ${validCurrencies.join(', ')}` }, { status: 400 });
    }

    const validMethods = ['mobile-money', 'bank-transfer', 'card'];
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: `Methode invalide. Acceptees: ${validMethods.join(', ')}` }, { status: 400 });
    }

    // Mobile Money: numero requis
    if (method === 'mobile-money' && !phone_number) {
      return NextResponse.json({ error: 'Numero de telephone requis pour Mobile Money' }, { status: 400 });
    }

    // Detecter le reseau si pas fourni
    const detectedNetwork = network || (phone_number ? detectNetwork(phone_number) : null);

    // Generer reference unique
    const txRef = generateTxRef('NZL');

    // ── Creer le paiement en base ──
    const { data: payment, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription_id || null,
        load_id: load_id || null,
        amount,
        currency,
        method,
        status: 'pending',
        transaction_id: txRef,
        provider: method === 'mobile-money' ? 'flutterwave' : null,
        phone_number: phone_number || null,
        payment_type,
        metadata: {
          description,
          network: detectedNetwork,
          initiated_at: new Date().toISOString(),
          ...(entity_type && { entity_type: entity_type === 'broker' ? 'broker' : 'company' }),
        },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // ── Initier le paiement Mobile Money via Flutterwave ──
    if (method === 'mobile-money') {
      const appOrigin =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || new URL(request.url).origin;
      const flwResponse = await initiateMobileMoneyCharge({
        amount,
        currency: currency as 'CDF' | 'USD',
        phone_number,
        email: user.email || '',
        tx_ref: txRef,
        network: detectedNetwork as any,
        fullname: user.user_metadata?.full_name || '',
        redirect_url: `${appOrigin}/fr/dashboard/payments/callback`,
        meta: {
          payment_id: payment.id,
          payment_type,
          load_id,
        },
      });

      if (flwResponse.status === 'success' && flwResponse.data) {
        // Mettre a jour avec la reference Flutterwave
        await supabase
          .from('payments')
          .update({
            provider_reference: flwResponse.data.flw_ref || String(flwResponse.data.id),
            redirect_url: flwResponse.data.meta?.authorization?.redirect || flwResponse.data.redirect_url,
            metadata: {
              ...payment.metadata,
              flw_response: {
                id: flwResponse.data.id,
                flw_ref: flwResponse.data.flw_ref,
                charge_type: flwResponse.data.charge_type,
              },
            },
          })
          .eq('id', payment.id);

        return NextResponse.json({
          payment: { ...payment, provider_reference: flwResponse.data.flw_ref },
          transaction_id: txRef,
          flw_ref: flwResponse.data.flw_ref,
          redirect_url: flwResponse.data.meta?.authorization?.redirect || flwResponse.data.redirect_url,
          network: detectedNetwork,
          message: 'Paiement initie. Verifiez votre telephone pour confirmer.',
          instructions: getPaymentInstructions(detectedNetwork),
        }, { status: 201 });
      } else {
        // Echec d'initiation
        await supabase
          .from('payments')
          .update({
            status: 'failed',
            failure_reason: flwResponse.message,
          })
          .eq('id', payment.id);

        return NextResponse.json({
          error: flwResponse.message || 'Echec de l\'initiation du paiement',
          payment,
        }, { status: 422 });
      }
    }

    // ── Autres methodes (bank-transfer, card) ──
    return NextResponse.json({
      payment,
      transaction_id: txRef,
      message: 'Paiement cree. En attente de confirmation.',
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Payments] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Instructions par reseau ──
function getPaymentInstructions(network: string | null): string {
  switch (network) {
    case 'MPESA':
      return 'Vous recevrez une notification USSD sur votre telephone Vodacom. Entrez votre code PIN M-Pesa pour confirmer.';
    case 'AIRTEL':
      return 'Vous recevrez un message USSD sur votre telephone Airtel. Entrez votre code PIN Airtel Money pour confirmer.';
    case 'ORANGE':
      return 'Composez *144# pour confirmer le paiement ou validez via la notification Orange Money.';
    default:
      return 'Suivez les instructions sur votre telephone pour confirmer le paiement.';
  }
}
