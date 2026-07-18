import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { priceOrder, savePendingOrder, type Shipping } from '../../../../lib/orders-server';

// Creates a PaymentIntent for the SERVER-COMPUTED order total. The client sends
// only the cart line items (id/size/quantity); the amount is recomputed from
// authoritative DB prices, so a tampered client cannot under-pay.
//
// Every failure path is logged with a distinct, greppable reason and returns a
// `code` so a broken deploy is never a mystery (e.g. a missing env var used to
// surface only as the generic "Could not start payment").
export async function POST(req: NextRequest) {
  // Fail fast, and loudly in the logs, when server config is missing.
  const missing: string[] = [];
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length > 0) {
    console.error(`[payment-intent] Missing required env var(s): ${missing.join(', ')}`);
    return NextResponse.json(
      { error: 'Payments are temporarily unavailable. Please try again shortly.', code: 'server_config' },
      { status: 500 },
    );
  }

  let items: unknown;
  let shipping: Shipping | undefined;
  let userId: string | null = null;
  try {
    ({ items, shipping, userId = null } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request.', code: 'bad_request' }, { status: 400 });
  }

  // 1) Price the order from the DB (service role). Distinguish a customer-fixable
  //    cart problem (400) from an infrastructure failure (502).
  let pricing;
  try {
    pricing = await priceOrder(items);
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : '';
    const isValidation = /cart|item|available|total/i.test(msg);
    if (isValidation) {
      return NextResponse.json({ error: msg, code: 'invalid_cart' }, { status: 400 });
    }
    console.error('[payment-intent] Pricing failed (DB/service-role):', msg || err);
    return NextResponse.json(
      { error: 'We couldn’t price your order. Please try again.', code: 'pricing_failed' },
      { status: 502 },
    );
  }

  if (pricing.amountMinor < 100) {
    return NextResponse.json({ error: 'Order total is too low.', code: 'amount_too_low' }, { status: 400 });
  }

  // 2) Create the Stripe PaymentIntent.
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amountMinor, // kobo
      currency: 'ngn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        item_count: String(pricing.lines.length),
        subtotal_ngn: String(pricing.subtotal),
      },
    });

    // Stash the order context so the webhook can finalize even if the client
    // callback never runs (3DS redirect, closed tab). Non-fatal if it fails —
    // the inline success path can still finalize from the request body.
    if (shipping?.email && shipping?.address) {
      await savePendingOrder(paymentIntent.id, {
        items: pricing.lines.map(l => ({ id: l.id, size: l.size, quantity: l.quantity })),
        shipping,
        userId,
        subtotal: pricing.subtotal,
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: pricing.subtotal,
    });
  } catch (err: any) {
    console.error('[payment-intent] Stripe createPaymentIntent failed:', err?.message || err);
    return NextResponse.json(
      { error: 'We couldn’t reach the payment provider. Please try again.', code: 'stripe_error' },
      { status: 502 },
    );
  }
}
