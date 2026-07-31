import { NextRequest, NextResponse } from 'next/server';
import { priceOrder } from '../../../../lib/orders-server';
import { validateDiscountCode } from '../../../../lib/discounts';
import { rateLimit } from '../../../../lib/rate-limit';

// PUBLIC. Validates a discount code against the server-priced cart subtotal so
// a tampered client can never invent a discount amount.
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`discount:${ip}`, 10, 60_000).allowed) {
    return NextResponse.json({ valid: false, reason: 'Too many attempts. Please wait a moment.' }, { status: 429 });
  }

  let code: unknown;
  let items: unknown;
  try {
    ({ code, items } = await req.json());
  } catch {
    return NextResponse.json({ valid: false, reason: 'Invalid request.' }, { status: 400 });
  }

  if (typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ valid: false, reason: 'Please enter a discount code.' }, { status: 400 });
  }

  let pricing;
  try {
    pricing = await priceOrder(items);
  } catch {
    return NextResponse.json({ valid: false, reason: 'Could not price your cart. Please try again.' }, { status: 400 });
  }

  const result = await validateDiscountCode(code, pricing.subtotal);
  if (!result.valid) {
    return NextResponse.json({ valid: false, reason: result.reason });
  }

  return NextResponse.json({
    valid: true,
    discountUsd: result.discountUsd,
    code: result.codeRow.code,
  });
}
