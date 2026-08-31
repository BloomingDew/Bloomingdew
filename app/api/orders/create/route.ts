import { NextRequest, NextResponse } from 'next/server';
import { finalizeOrder, type Shipping } from '../../../../lib/orders-server';
import { getSessionUserId } from '../../../../lib/admin-server';

// Inline (non-redirect) success path: Stripe confirmed the payment on the client
// and we finalize immediately so the customer gets an order reference. The Stripe
// webhook is the safety net for authenticated-card redirects and closed tabs;
// finalizeOrder is idempotent, so both running is safe.
export async function POST(req: NextRequest) {
  let body: { paymentIntentId: string; items: unknown; shipping: Shipping; userId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    // user_id comes from the verified session, never the body — a guest is
    // null. This is the authoritative attribution regardless of what the
    // client claims.
    const userId = await getSessionUserId();
    const result = await finalizeOrder({
      paymentIntentId: body.paymentIntentId,
      items: body.items,
      shipping: body.shipping,
      userId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ orderId: result.orderId, alreadyRecorded: result.alreadyRecorded });
  } catch (err: any) {
    console.error('[orders/create] error:', err?.message || err);
    return NextResponse.json({ error: 'Could not complete the order.' }, { status: 500 });
  }
}
