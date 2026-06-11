import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { priceOrder } from '../../../../lib/orders-server';
import { supabaseService } from '../../../../lib/admin-server';
import { sendOrderConfirmationEmail } from '../../../../lib/email';

type Shipping = {
  firstName: string; lastName: string; email: string; phone?: string;
  address: string; apartment?: string; city: string; postcode: string; country: string;
};

// Finalizes an order ONLY after verifying with Stripe that the PaymentIntent
// actually succeeded and that the amount paid matches the server-computed total.
// Runs with the service role so `orders` RLS can deny all direct client writes.
export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, items, shipping, userId } = await req.json() as {
      paymentIntentId: string; items: unknown; shipping: Shipping; userId?: string | null;
    };

    if (!paymentIntentId || !shipping?.email || !shipping?.address) {
      return NextResponse.json({ error: 'Missing order details.' }, { status: 400 });
    }

    // 1. Re-price from authoritative DB prices.
    const pricing = await priceOrder(items);

    // 2. Verify the payment with Stripe.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed.' }, { status: 402 });
    }
    if (pi.amount_received !== pricing.amountMinor) {
      // Amount paid doesn't match the current server total — refuse to record.
      console.error('Order amount mismatch', { pi: pi.amount_received, expected: pricing.amountMinor });
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 409 });
    }

    // 3. Idempotency — if this payment was already recorded, return it.
    const { data: existing } = await supabaseService
      .from('orders')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ orderId: existing.id, alreadyRecorded: true });
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
      console.error('Order insert error:', orderError?.message);
      return NextResponse.json(
        { error: 'Payment succeeded but the order could not be recorded. Please contact hello@bloomingdew.com with reference ' + paymentIntentId },
        { status: 500 },
      );
    }

    // 5. Decrement stock (best-effort; failures are logged for reconciliation).
    for (const line of pricing.lines) {
      const { error: stockError } = await supabaseService.rpc('decrement_stock', {
        p_product_id: line.id,
        p_size: line.size,
        p_quantity: line.quantity,
      });
      if (stockError) console.error('Stock decrement failed', { line, error: stockError.message });
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
      console.error('Order confirmation email failed:', emailErr);
    }

    return NextResponse.json({ orderId: order.id });
  } catch (err: any) {
    const isValidation = typeof err?.message === 'string' &&
      /cart|item|available|total/i.test(err.message);
    console.error('Order create error:', err);
    return NextResponse.json(
      { error: isValidation ? err.message : 'Could not complete the order.' },
      { status: isValidation ? 400 : 500 },
    );
  }
}
