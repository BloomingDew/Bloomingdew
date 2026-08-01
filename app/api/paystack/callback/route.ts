import { NextRequest, NextResponse } from 'next/server';
import { priceOrder, getPendingOrder, deletePendingOrder, type Shipping } from '../../../../lib/orders-server';
import { incrementUse } from '../../../../lib/discounts';
import { supabaseService } from '../../../../lib/admin-server';
import { sendOrderConfirmationEmail } from '../../../../lib/email';

type PendingShipping = Shipping & {
  discountCode?: string;
  paystack?: { amountKobo: number; totalUsd: number; discountUsd: number };
};

// Paystack redirects the customer here after payment. Verify the transaction
// with Paystack's API (never trust the redirect alone), check the paid amount
// against what we initialized, then record the order. Idempotent on the
// Paystack reference.
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const reference = req.nextUrl.searchParams.get('reference') || req.nextUrl.searchParams.get('trxref');
  const failure = (reason: string) =>
    NextResponse.redirect(`${origin}/checkout?payment=failed&reason=${encodeURIComponent(reason)}`);

  if (!reference) return failure('missing-reference');

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return failure('not-configured');

  // 1. Verify with Paystack.
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  const verify = await verifyRes.json().catch(() => null);
  const tx = verify?.data;
  if (!verifyRes.ok || !verify?.status || tx?.status !== 'success') {
    console.error('[paystack/callback] verify failed:', verify?.message || tx?.status);
    return failure('not-successful');
  }

  // 2. Idempotency — a refresh of the callback URL must not double-record.
  const { data: existing } = await supabaseService
    .from('orders').select('id').eq('payment_id', reference).maybeSingle();
  if (existing) {
    return NextResponse.redirect(`${origin}/order-confirmation?ref=${encodeURIComponent(existing.id)}`);
  }

  // 3. Pull the order context saved at initialize time.
  const pending = await getPendingOrder(reference);
  if (!pending) {
    // Paid but we lost the context (shouldn't happen) — send them to the
    // confirmation page with the Paystack reference so support can resolve it.
    console.error('[paystack/callback] no pending order for reference', reference);
    return NextResponse.redirect(`${origin}/order-confirmation?ref=${encodeURIComponent(reference)}`);
  }
  const shipping = pending.shipping as PendingShipping;
  const expected = shipping.paystack;

  // 4. Amount check: what Paystack collected must equal what we initialized.
  if (!expected || Number(tx.amount) !== expected.amountKobo || tx.currency !== 'NGN') {
    console.error('[paystack/callback] amount mismatch:', tx.amount, 'vs', expected?.amountKobo);
    return failure('amount-mismatch');
  }

  // 5. Re-price for the order lines (display data; the charge is already verified).
  let pricing;
  try {
    pricing = await priceOrder(pending.items);
  } catch {
    return failure('items-unavailable');
  }

  const discountUsd = expected.discountUsd || 0;
  const discountCode = shipping.discountCode || null;

  const { data: order, error: dbError } = await supabaseService
    .from('orders')
    .insert({
      customer_name: `${shipping.firstName} ${shipping.lastName}`,
      customer_email: shipping.email,
      customer_phone: shipping.phone ?? '',
      shipping_address: {
        address: shipping.address,
        apartment: shipping.apartment ?? '',
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
      },
      items: pricing.lines.map(l => ({
        id: l.id, name: l.name, size: l.size, quantity: l.quantity, price: l.unitPrice,
      })),
      subtotal: pricing.subtotal,
      shipping_cost: 0,
      total: expected.totalUsd,
      status: 'paid',
      payment_provider: 'paystack',
      payment_id: reference,
      user_id: pending.user_id ?? null,
      discount_code: discountCode,
      discount_usd: discountUsd > 0 ? discountUsd : null,
    })
    .select('id')
    .single();

  if (dbError) {
    console.error('[paystack/callback] order insert failed:', dbError.message);
    // Payment succeeded — surface the reference so the customer has proof.
    return NextResponse.redirect(`${origin}/order-confirmation?ref=${encodeURIComponent(reference)}`);
  }

  // 6. Post-order housekeeping (all best-effort).
  if (discountCode) {
    try { await incrementUse(discountCode); } catch { /* non-fatal */ }
  }
  try {
    await supabaseService
      .from('abandoned_checkouts')
      .update({ status: 'recovered', updated_at: new Date().toISOString() })
      .eq('status', 'started')
      .ilike('email', shipping.email);
  } catch { /* non-fatal */ }
  try {
    await sendOrderConfirmationEmail({
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      customerEmail: shipping.email,
      items: pricing.lines.map(l => ({
        name: l.name, size: l.size, quantity: l.quantity, price: l.priceLabel,
      })),
      orderTotal: expected.totalUsd,
      shipping: {
        address: shipping.address,
        apartment: shipping.apartment,
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
      },
    });
  } catch (err) {
    console.error('[paystack/callback] confirmation email failed:', err);
  }
  await deletePendingOrder(reference);

  return NextResponse.redirect(`${origin}/order-confirmation?ref=${encodeURIComponent(order.id)}`);
}
