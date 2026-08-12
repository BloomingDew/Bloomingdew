import { NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/admin-server';

// Minimal order lookup for the confirmation page's CompletePayment pixel event.
//
// Deliberately returns ONLY what an ad platform needs — total and line items.
// No customer name, email, phone or address: the pixel doesn't need them, and
// this endpoint is reachable by anyone holding an order id.
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get('ref');
  if (!ref) {
    return NextResponse.json({ error: 'missing ref' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('orders')
    .select('id, total, items')
    .eq('id', ref)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Legacy orders stored `price` as an already-formatted string ("₦1,000"),
  // newer ones store a plain USD number. Number("₦1,000") is NaN, which would
  // serialise to null and hand TikTok an invalid content price.
  const num = (v: unknown, fallback = 0): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
    if (typeof v === 'string') {
      const parsed = Number(v.replace(/[^\d.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const items = Array.isArray(data.items) ? data.items : [];
  return NextResponse.json({
    orderId: String(data.id),
    total: num(data.total),
    contents: items.map((l: { productId?: unknown; id?: unknown; name?: unknown; priceUsd?: unknown; price?: unknown; quantity?: unknown }) => ({
      content_id: String(l.productId ?? l.id ?? ''),
      content_name: typeof l.name === 'string' ? l.name : '',
      content_type: 'product' as const,
      price: num(l.priceUsd ?? l.price),
      quantity: num(l.quantity, 1) || 1,
    })),
  });
}
