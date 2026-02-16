import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { verifyTransaction, verifyWebhookSignature } from '@/lib/payments/flutterwave';
import { createRateLimiter } from '@/lib/api/rate-limit';
import { linkSubscriptionToEntity } from '@/lib/payments/link-subscription';

const FLW_WEBHOOK_HASH = process.env.FLUTTERWAVE_WEBHOOK_HASH || '';
const webhookLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  message: 'Trop de webhooks recus sur une courte periode.',
});

function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown';
  return `flw-webhook:${ip}`;
}

/**
 * POST - Flutterwave Webhook Handler
 * Called by Flutterwave when a payment status changes
 * URL to configure in Flutterwave dashboard: https://yourdomain.com/api/payments/webhook
 */
export async function POST(request: Request) {
  try {
    if (!FLW_WEBHOOK_HASH) {
      return NextResponse.json(
        { error: 'Webhook hash non configure' },
        { status: 503 }
      );
    }

    const rateLimit = webhookLimiter.check(getClientIdentifier(request));
    if (!rateLimit.allowed) return rateLimit.response!;

    // ── 1. Verify webhook signature ──
    const signature = request.headers.get('verif-hash');
    if (!verifyWebhookSignature(signature, FLW_WEBHOOK_HASH)) {
      console.warn('[Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = await request.json();
    const supabase = await createClient();

    // ── 2. Log webhook ──
    await supabase.from('payment_webhooks').insert({
      provider: 'flutterwave',
      event_type: payload.event || 'charge.completed',
      payload,
      processed: false,
    });

    // ── 3. Extract transaction info ──
    const { data: eventData } = payload;
    if (!eventData) {
      return NextResponse.json({ status: 'ok', message: 'No data in payload' });
    }

    const txRef = eventData.tx_ref;
    const flwRef = eventData.flw_ref;
    const status = eventData.status; // successful, failed
    const chargedAmount = eventData.charged_amount || eventData.amount;

    if (!txRef) {
      return NextResponse.json({ status: 'ok', message: 'No tx_ref' });
    }

    // ── 4. Find payment in our database ──
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', txRef)
      .single();

    if (!payment) {
      console.warn(`[Webhook] Payment not found for tx_ref: ${txRef}`);
      return NextResponse.json({ status: 'ok', message: 'Payment not found' });
    }

    // ── 5. Verify transaction with Flutterwave (double check) ──
    let verifiedStatus = status;
    if (eventData.id) {
      const verification = await verifyTransaction(eventData.id);
      if (verification.status === 'success' && verification.data) {
        verifiedStatus = verification.data.status;
        
        // Verify amount matches
        if (verification.data.amount !== payment.amount || verification.data.currency !== payment.currency) {
          console.warn(`[Webhook] Amount mismatch! Expected ${payment.amount} ${payment.currency}, got ${verification.data.amount} ${verification.data.currency}`);
          
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              failure_reason: 'Montant ou devise ne correspond pas',
              metadata: { ...payment.metadata, webhook_mismatch: true },
            })
            .eq('id', payment.id);

          return NextResponse.json({ status: 'ok', message: 'Amount mismatch' });
        }
      }
    }

    // ── 6. Update payment status ──
    const newStatus = verifiedStatus === 'successful' ? 'completed' : 'failed';

    await supabase
      .from('payments')
      .update({
        status: newStatus,
        provider_reference: flwRef || payment.provider_reference,
        paid_at: newStatus === 'completed' ? new Date().toISOString() : null,
        failure_reason: newStatus === 'failed' ? (eventData.processor_response || 'Paiement echoue') : null,
        metadata: {
          ...payment.metadata,
          webhook_received_at: new Date().toISOString(),
          charged_amount: chargedAmount,
          processor_response: eventData.processor_response,
        },
      })
      .eq('id', payment.id);

    // ── 7. If completed, activate subscription / update load ──
    if (newStatus === 'completed') {
      // Activate subscription if applicable
      if (payment.subscription_id) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
          })
          .eq('id', payment.subscription_id);
        await linkSubscriptionToEntity(supabase, payment);
      }

      // Update load payment status if applicable
      if (payment.load_id) {
        await supabase
          .from('loads')
          .update({
            status: 'booked',
          })
          .eq('id', payment.load_id);
      }
    }

    // ── 8. Mark webhook as processed ──
    await supabase
      .from('payment_webhooks')
      .update({ processed: true, payment_id: payment.id })
      .eq('payload->>tx_ref', txRef)
      .eq('processed', false);

    return NextResponse.json({ status: 'ok', payment_status: newStatus });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    // Always return 200 to Flutterwave to avoid retries
    return NextResponse.json({ status: 'ok', error: error.message });
  }
}
