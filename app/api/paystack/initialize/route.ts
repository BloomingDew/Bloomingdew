import { NextRequest, NextResponse } from 'next/server';
import { priceOrder, savePendingOrder, type Shipping } from '../../../../lib/orders-server';
import { validateDiscountCode } from '../../../../lib/discounts';
import { supabaseService } from '../../../../lib/admin-server';
import { convertFromUsd, toMinorUnits } from '../../../../lib/currency';
import { rateLimit } from '../../../../lib/rate-limit';

// Paystack charges in NGN. The order is re-priced server-side in USD (base),
// converted at the same fx rate the storefront displays, and initialized with
// Paystack; the callback route verifies the payment before recording anything.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`paystack:${ip}`, 5, 60_000).allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a moment.' }, { status: 429 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Paystack is not configured.' }, { status: 503 });
  }

  let body: {
    items: unknown;
    shipping: Shipping;
    userId?: string | null;
    discountCode?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { items, shipping, userId, discountCode } = body;
  if (!shipping?.email || !shipping?.address) {
    return NextResponse.json({ error: 'Missing shipping details.' }, { status: 400 });
  }

  // Re-price from the database — never trust client amounts.
  let pricing;
  try {
    pricing = await priceOrder(items);
  } catch {
    return NextResponse.json({ error: 'One or more items are unavailable.' }, { status: 400 });
  }

  let discountUsd = 0;
  let appliedCode: string | null = null;
  if (discountCode) {
    const check = await validateDiscountCode(discountCode, pricing.subtotal);
    if (check.valid) {
      discountUsd = check.discountUsd;
      appliedCode = discountCode.toUpperCase().trim();
    }
  }
  const totalUsd = Math.max(0, pricing.subtotal - discountUsd);

  // Convert at the displayed storefront rate (fx_rates, refreshed daily).
  const { data: rateRow } = await supabaseService
    .from('fx_rates').select('rate_vs_usd').eq('currency', 'NGN').maybeSingle();
  const rate = Number(rateRow?.rate_vs_usd);
  if (!rate || rate <= 0) {
    return NextResponse.json({ error: 'Naira pricing is unavailable right now. Please pay by card instead.' }, { status: 503 });
  }
  const totalNgn = convertFromUsd(totalUsd, rate, 'NGN');
  const amountKobo = toMinorUnits(totalNgn, 'NGN');
  if (amountKobo <= 0) {
    return NextResponse.json({ error: 'Order total is invalid.' }, { status: 400 });
  }

  const origin = req.nextUrl.origin;
  const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: shipping.email,
      amount: amountKobo,
      currency: 'NGN',
      callback_url: `${origin}/api/paystack/callback`,
      metadata: {
        custom_fields: [
          { display_name: 'Customer', variable_name: 'customer', value: `${shipping.firstName} ${shipping.lastName}` },
        ],
      },
    }),
  });

  const init = await initRes.json().catch(() => null);
  if (!initRes.ok || !init?.status || !init?.data?.reference || !init?.data?.authorization_url) {
    console.error('[paystack/initialize] error:', init?.message || initRes.status);
    return NextResponse.json({ error: 'Could not start the Paystack payment. Please try again.' }, { status: 502 });
  }

  // Stash the order context (+ the exact expected charge) for the callback.
  await savePendingOrder(init.data.reference, {
    items: items as { id: number; size: string; quantity: number }[],
    shipping: {
      ...shipping,
      // Extra context rides inside the shipping jsonb (same pattern as Stripe's
      // discountCode) — the callback verifies the paid amount against this.
      paystack: { amountKobo, totalUsd, discountUsd },
    } as Shipping,
    userId: userId ?? null,
    subtotal: pricing.subtotal,
    discountCode: appliedCode,
  });

  return NextResponse.json({ authorizationUrl: init.data.authorization_url });
}
