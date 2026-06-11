import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { priceOrder } from '../../../../lib/orders-server';

// Creates a PaymentIntent for the SERVER-COMPUTED order total. The client sends
// only the cart line items (id/size/quantity); the amount is recomputed from
// authoritative DB prices, so a tampered client cannot under-pay.
export async function POST(req: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const { items } = await req.json();

    const pricing = await priceOrder(items);

    if (pricing.amountMinor < 100) {
      return NextResponse.json({ error: 'Order total is too low.' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amountMinor, // kobo
      currency: 'ngn',
      automatic_payment_methods: { enabled: true },
      metadata: {
        item_count: String(pricing.lines.length),
        subtotal_ngn: String(pricing.subtotal),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: pricing.subtotal,
    });
  } catch (err: any) {
    // Pricing/validation errors are client-fixable (400); Stripe/infra are 500.
    const isValidation = typeof err?.message === 'string' &&
      /cart|item|available|total/i.test(err.message);
    console.error('Payment intent error:', err);
    return NextResponse.json(
      { error: isValidation ? err.message : 'Could not start payment.' },
      { status: isValidation ? 400 : 500 },
    );
  }
}
