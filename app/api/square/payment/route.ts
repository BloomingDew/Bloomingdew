import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENV === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  let body: {
    sourceId: string;
    amountUsd: number;
    items: { id: number; name: string; size: string; quantity: number; price: number }[];
    shipping: {
      firstName: string; lastName: string; email: string; phone: string;
      address: string; apartment: string; city: string; postcode: string; country: string;
    };
    userId?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { sourceId, amountUsd, items, shipping, userId } = body;

  if (!sourceId || !amountUsd || !items?.length || !shipping?.email) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Square charges in the smallest currency unit (cents for USD/GBP)
  const amountCents = BigInt(Math.round(amountUsd * 100));

  try {
    const result = await square.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: amountCents,
        currency: 'GBP',
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      buyerEmailAddress: shipping.email,
      note: `Bloomingdew order — ${items.map(i => `${i.name} (${i.size})`).join(', ')}`,
    });

    const payment = result.payment;

    if (!payment) {
      return NextResponse.json({ error: 'Payment failed.' }, { status: 400 });
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: `Payment status: ${payment.status}` }, { status: 400 });
    }

    // Save order to Supabase
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = subtotal > 100 ? 0 : 10;

    const { data: order, error: dbError } = await supabase
      .from('orders')
      .insert({
        customer_name: `${shipping.firstName} ${shipping.lastName}`,
        customer_email: shipping.email,
        customer_phone: shipping.phone,
        shipping_address: {
          address: shipping.address,
          apartment: shipping.apartment,
          city: shipping.city,
          postcode: shipping.postcode,
          country: shipping.country,
        },
        items: items.map(i => ({
          id: i.id, name: i.name, size: i.size,
          quantity: i.quantity, price: `£${i.price.toFixed(2)}`,
        })),
        subtotal,
        shipping_cost: shippingCost,
        total: amountUsd,
        status: 'paid',
        payment_provider: 'square',
        payment_id: payment.id,
        user_id: userId || null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[square/payment] DB error:', dbError.message);
      // Payment succeeded but DB failed — return payment ID so customer can reference it
      return NextResponse.json({
        orderId: payment.id,
        warning: 'Payment successful but order recording failed. Please contact us with this reference.',
      });
    }

    return NextResponse.json({ orderId: order.id, paymentId: payment.id });
  } catch (err: any) {
    console.error('[square/payment] error:', err?.message || err);
    const msg = err?.errors?.[0]?.detail || 'Payment could not be processed.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
