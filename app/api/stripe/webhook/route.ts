import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { finalizeOrder, getPendingOrder } from '../../../../lib/orders-server';

// Stripe needs the Node runtime (raw body + crypto for signature verification).
export const runtime = 'nodejs';

// Safety net that finalizes orders server-side when the client callback doesn't
// run — the common case being authenticated (3DS) cards, where Stripe redirects
// the browser away before the inline success handler fires. Configure this
// endpoint in the Stripe dashboard (payment_intent.succeeded) and set
// STRIPE_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get('stripe-signature');

  if (!secret || !sig) {
    console.error('[stripe-webhook] missing STRIPE_WEBHOOK_SECRET or stripe-signature header');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err: any) {
    console.error('[stripe-webhook] signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;

    const pending = await getPendingOrder(pi.id);
    if (!pending) {
      // Already finalized (row deleted by the inline path) or an intent created
      // before this feature shipped. Nothing to do — acknowledge.
      return NextResponse.json({ received: true });
    }

    const result = await finalizeOrder({
      paymentIntentId: pi.id,
      items: pending.items,
      shipping: pending.shipping,
      userId: pending.user_id,
    });

    if (!result.ok) {
      // Return 500 so Stripe retries (idempotent, safe). The pending_orders row
      // stays for reconciliation.
      console.error('[stripe-webhook] finalize failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
