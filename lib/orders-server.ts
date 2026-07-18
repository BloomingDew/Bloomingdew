// Server-only. Recomputes order pricing from authoritative DB prices so the
// client can never dictate what it pays.
import Stripe from 'stripe';
import { supabaseService } from './admin-server';
import { sendOrderConfirmationEmail } from './email';

export type IncomingItem = { id: number; size: string; quantity: number };

export type PricedLine = {
  id: number;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;   // sale price per unit, in NGN
  priceLabel: string;  // formatted, e.g. "₦12,000"
};

export type OrderPricing = {
  lines: PricedLine[];
  subtotal: number;     // NGN
  amountMinor: number;  // kobo, what Stripe should charge
};

const isPositiveInt = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n > 0;

// Validates the incoming cart and prices it from the products table.
// Throws on malformed input or unknown/unavailable products.
export async function priceOrder(items: unknown): Promise<OrderPricing> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const normalized: IncomingItem[] = items.map((raw) => {
    const id = Number((raw as any)?.id);
    const size = String((raw as any)?.size ?? '').trim();
    const quantity = Number((raw as any)?.quantity);
    if (!isPositiveInt(id) || !size || !isPositiveInt(quantity) || quantity > 50) {
      throw new Error('Invalid cart item.');
    }
    return { id, size, quantity };
  });

  const ids = [...new Set(normalized.map(i => i.id))];
  const { data, error } = await supabaseService
    .from('products')
    .select('id, name, price, discount, available')
    .in('id', ids);

  if (error) throw new Error('Could not price the order.');

  const byId = new Map((data || []).map(p => [p.id, p]));

  const lines: PricedLine[] = normalized.map((item) => {
    const product = byId.get(item.id);
    if (!product || product.available === false) {
      throw new Error('One or more items are no longer available.');
    }
    const rawPrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const unitPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;
    return {
      id: item.id,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      priceLabel: `₦${unitPrice.toLocaleString()}`,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  // Shipping is TBD (finalized with DHL) and not charged at checkout yet.
  const amountMinor = Math.round(subtotal * 100);

  return { lines, subtotal, amountMinor };
}

export type Shipping = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  apartment?: string;
  city: string;
  postcode: string;
  country: string;
};

export type FinalizeResult =
  | { ok: true; orderId: string; alreadyRecorded: boolean }
  | { ok: false; status: number; error: string };

// ── pending_orders ──────────────────────────────────────────────────────────
// Server-stored order context keyed by PaymentIntent id, so the Stripe webhook
// (or a 3DS redirect return) can finalize the order even when the client-side
// success callback never runs (authenticated cards, closed tabs, etc.).

export async function savePendingOrder(
  paymentIntentId: string,
  ctx: { items: IncomingItem[]; shipping: Shipping; userId?: string | null; subtotal: number },
): Promise<void> {
  const { error } = await supabaseService.from('pending_orders').upsert(
    {
      payment_intent_id: paymentIntentId,
      items: ctx.items,
      shipping: ctx.shipping,
      user_id: ctx.userId ?? null,
      subtotal: ctx.subtotal,
    },
    { onConflict: 'payment_intent_id' },
  );
  // Non-fatal: the inline success path can still finalize without this row.
  if (error) console.error('[pending_orders] save failed:', error.message);
}

export async function getPendingOrder(
  paymentIntentId: string,
): Promise<{ items: IncomingItem[]; shipping: Shipping; user_id: string | null } | null> {
  const { data } = await supabaseService
    .from('pending_orders')
    .select('items, shipping, user_id')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();
  return (data as any) ?? null;
}

export async function deletePendingOrder(paymentIntentId: string): Promise<void> {
  await supabaseService.from('pending_orders').delete().eq('payment_intent_id', paymentIntentId);
}

// ── finalizeOrder ───────────────────────────────────────────────────────────
// Single source of truth for turning a paid PaymentIntent into an order. Called
// by both the inline success path (/api/orders/create) and the Stripe webhook.
// Idempotent on payment_intent_id, so running both is safe. Verifies with Stripe
// that the intent actually succeeded and that the amount paid matches the
// server-recomputed total before recording anything.
export async function finalizeOrder(params: {
  paymentIntentId: string;
  items: unknown;
  shipping: Shipping;
  userId?: string | null;
}): Promise<FinalizeResult> {
  const { paymentIntentId, items, shipping, userId } = params;

  if (!paymentIntentId || !shipping?.email || !shipping?.address) {
    return { ok: false, status: 400, error: 'Missing order details.' };
  }

  // 1. Re-price from authoritative DB prices.
  let pricing: OrderPricing;
  try {
    pricing = await priceOrder(items);
  } catch (err: any) {
    return { ok: false, status: 400, error: typeof err?.message === 'string' ? err.message : 'Invalid cart.' };
  }

  // 2. Verify the payment with Stripe.
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (pi.status !== 'succeeded') {
    return { ok: false, status: 402, error: 'Payment not completed.' };
  }
  if (pi.amount_received !== pricing.amountMinor) {
    console.error('[finalizeOrder] amount mismatch', { received: pi.amount_received, expected: pricing.amountMinor });
    return { ok: false, status: 409, error: 'Payment amount mismatch.' };
  }

  // 3. Idempotency — if this payment was already recorded, return it.
  const { data: existing } = await supabaseService
    .from('orders')
    .select('id')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle();
  if (existing) {
    await deletePendingOrder(paymentIntentId);
    return { ok: true, orderId: existing.id, alreadyRecorded: true };
  }

  // 4. Insert the order with server-priced line items.
  const orderItems = pricing.lines.map(l => ({
    id: l.id, name: l.name, size: l.size, quantity: l.quantity, price: l.priceLabel,
  }));

  const { data: order, error: orderError } = await supabaseService
    .from('orders')
    .insert({
      customer_name: `${shipping.firstName} ${shipping.lastName}`.trim(),
      customer_email: shipping.email,
      customer_phone: shipping.phone ?? null,
      user_id: userId ?? null,
      shipping_address: {
        address: shipping.address,
        apartment: shipping.apartment,
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
      },
      items: orderItems,
      subtotal: pricing.subtotal,
      shipping_cost: 0,
      total: pricing.subtotal,
      status: 'paid',
      payment_intent_id: paymentIntentId,
      payment_method: 'stripe',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('[finalizeOrder] insert failed:', orderError?.message);
    return {
      ok: false,
      status: 500,
      error: 'Payment succeeded but the order could not be recorded. Please contact hello@bloomingdew.com with reference ' + paymentIntentId,
    };
  }

  // 5. Decrement stock (best-effort; failures logged for reconciliation).
  for (const line of pricing.lines) {
    const { error: stockError } = await supabaseService.rpc('decrement_stock', {
      p_product_id: line.id,
      p_size: line.size,
      p_quantity: line.quantity,
    });
    if (stockError) console.error('[finalizeOrder] stock decrement failed', { line, error: stockError.message });
  }

  // 6. Save address for logged-in users (deduped).
  if (userId) {
    const { data: dupes } = await supabaseService
      .from('addresses')
      .select('id')
      .eq('user_id', userId)
      .eq('address', shipping.address)
      .eq('postcode', shipping.postcode);
    if (!dupes || dupes.length === 0) {
      await supabaseService.from('addresses').insert({
        user_id: userId,
        label: 'Shipping',
        first_name: shipping.firstName,
        last_name: shipping.lastName,
        address: shipping.address,
        apartment: shipping.apartment,
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
        phone: shipping.phone,
        is_default: false,
      });
    }
  }

  // 7. Send the confirmation email (non-blocking failure).
  try {
    await sendOrderConfirmationEmail({
      customerName: `${shipping.firstName} ${shipping.lastName}`.trim(),
      customerEmail: shipping.email,
      items: orderItems,
      orderTotal: pricing.subtotal,
      shipping: {
        address: shipping.address,
        apartment: shipping.apartment,
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
      },
    });
  } catch (emailErr) {
    console.error('[finalizeOrder] confirmation email failed:', emailErr);
  }

  await deletePendingOrder(paymentIntentId);
  return { ok: true, orderId: order.id, alreadyRecorded: false };
}
