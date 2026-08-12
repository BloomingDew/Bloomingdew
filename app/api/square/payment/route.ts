import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { createHash } from 'crypto';
import { priceOrder } from '../../../../lib/orders-server';
import { supabaseService } from '../../../../lib/admin-server';
import { rateLimit } from '../../../../lib/rate-limit';
import { validateDiscountCode, incrementUse } from '../../../../lib/discounts';
import { getTaxRate, taxAmountUsd } from '../../../../lib/tax';
import { sendTikTokEvent, tiktokRequestContext } from '../../../../lib/tiktok-server';

const square = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.NEXT_PUBLIC_SQUARE_ENV === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox,
});

// The Square location's settlement currency. The order totals are USD-based;
// if the Square account settles in another currency this charges that many
// units of it (pre-existing behavior kept for GBP accounts).
const SQUARE_CURRENCY = process.env.SQUARE_CURRENCY || 'GBP';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`square:${ip}`, 5, 60_000).allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a moment.' }, { status: 429 });
  }

  let body: {
    sourceId: string;
    items: { id: number; size: string; quantity: number }[];
    shipping: {
      firstName: string; lastName: string; email: string; phone: string;
      address: string; apartment: string; city: string; postcode: string; country: string;
    };
    userId?: string | null;
    discountCode?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { sourceId, items, shipping, userId, discountCode } = body;

  if (!sourceId || !items?.length || !shipping?.email) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Never trust client prices — re-price every line from the database.
  let pricing;
  try {
    pricing = await priceOrder(items);
  } catch {
    return NextResponse.json({ error: 'One or more items are unavailable.' }, { status: 400 });
  }

  // Charge exactly what checkout displays: the cart subtotal. Shipping is not
  // charged anywhere today (the Stripe flow also charges subtotal only).
  const subtotal = pricing.subtotal;
  const shippingCost = 0;

  // Re-validate any discount code server-side — the client never sets amounts.
  let appliedCode: string | null = null;
  let discountUsd = 0;
  if (discountCode && typeof discountCode === 'string' && discountCode.trim()) {
    const result = await validateDiscountCode(discountCode, subtotal);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }
    appliedCode = result.codeRow.code;
    discountUsd = result.discountUsd;
  }

  // Destination-based tax on the discounted subtotal (admin-configured rate).
  const taxRate = await getTaxRate(shipping.country);
  const taxUsd = taxAmountUsd(Math.max(0, subtotal - discountUsd), taxRate);

  const total = Math.max(0, subtotal - discountUsd) + taxUsd;
  const amountCents = BigInt(Math.round(total * 100));

  // Derive the idempotency key from the single-use card token so a retried
  // request cannot charge twice.
  const idempotencyKey = createHash('sha256').update(sourceId).digest('hex').slice(0, 45);

  try {
    const result = await square.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: amountCents,
        currency: SQUARE_CURRENCY as 'GBP',
      },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      buyerEmailAddress: shipping.email,
      note: `Bloomingdew order — ${pricing.lines.map(l => `${l.name} (${l.size})`).join(', ')}`.slice(0, 500),
    });

    const payment = result.payment;

    if (!payment) {
      return NextResponse.json({ error: 'Payment failed.' }, { status: 400 });
    }

    if (payment.status !== 'COMPLETED') {
      return NextResponse.json({ error: `Payment status: ${payment.status}` }, { status: 400 });
    }

    // Idempotent order recording — a retried request reuses the same payment.
    const { data: existing } = await supabaseService
      .from('orders').select('id').eq('payment_id', payment.id).maybeSingle();
    if (existing) {
      return NextResponse.json({ orderId: existing.id, paymentId: payment.id });
    }

    // Payment completed with the discounted amount — count the redemption.
    if (appliedCode) await incrementUse(appliedCode);

    const { data: order, error: dbError } = await supabaseService
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
        items: pricing.lines.map(l => ({
          id: l.id, name: l.name, size: l.size, colour: l.colourName ?? null,
          quantity: l.quantity, price: l.unitPrice,
        })),
        subtotal,
        shipping_cost: shippingCost,
        tax_usd: taxUsd > 0 ? taxUsd : null,
        total,
        discount_code: appliedCode,
        discount_usd: appliedCode ? discountUsd : null,
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

    // Best-effort: mark any matching abandoned checkout as recovered.
    try {
      await supabaseService
        .from('abandoned_checkouts')
        .update({ status: 'recovered', updated_at: new Date().toISOString() })
        .eq('status', 'started')
        .ilike('email', shipping.email);
    } catch {}

    // Mirror the purchase to TikTok server-side. Same event_id as the browser
    // event on the confirmation page, so TikTok deduplicates the pair. This
    // block runs after the idempotency check above, so a retried request that
    // reuses an existing payment never reaches it.
    await sendTikTokEvent({
      event: 'CompletePayment',
      eventId: String(order.id),
      email: shipping.email,
      phone: shipping.phone,
      value: total,
      currency: 'USD',
      contents: pricing.lines.map(l => ({
        content_id: String(l.id),
        content_name: l.name,
        content_type: 'product' as const,
        price: Number(l.unitPrice.toFixed(2)),
        quantity: l.quantity,
      })),
      ...tiktokRequestContext(req),
    });

    return NextResponse.json({ orderId: order.id, paymentId: payment.id });
  } catch (err) {
    const detail = (err as { errors?: { detail?: string }[] })?.errors?.[0]?.detail;
    console.error('[square/payment] error:', detail || (err as Error)?.message || err);
    return NextResponse.json({ error: detail || 'Payment could not be processed.' }, { status: 500 });
  }
}
