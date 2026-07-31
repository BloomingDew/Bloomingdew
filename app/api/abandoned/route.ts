import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '../../../lib/admin-server';
import { rateLimit } from '../../../lib/rate-limit';
import { priceOrder } from '../../../lib/orders-server';

// Public, fire-and-forget capture of abandoned checkouts. Called from the
// checkout page when the shopper advances past the shipping step. Never
// errors loudly — a failure here must not affect checkout.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`abandoned:${ip}`, 10, 60_000).allowed) {
    return NextResponse.json({ success: true });
  }

  try {
    const { email, firstName, items } = await req.json();

    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ success: true });
    }
    const cleanEmail = email.trim().toLowerCase();

    // Re-price server-side so stored subtotals are authoritative.
    let pricing;
    try {
      pricing = await priceOrder(items);
    } catch {
      return NextResponse.json({ success: true }, { status: 400 });
    }

    const storedItems = pricing.lines.map(l => ({
      id: l.id, name: l.name, size: l.size, quantity: l.quantity, unitPrice: l.unitPrice,
    }));
    const cleanFirstName = typeof firstName === 'string' ? firstName.trim().slice(0, 100) : '';

    const { data: existing } = await supabaseService
      .from('abandoned_checkouts')
      .select('id')
      .eq('status', 'started')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabaseService
        .from('abandoned_checkouts')
        .update({
          items: storedItems,
          subtotal: pricing.subtotal,
          first_name: cleanFirstName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabaseService.from('abandoned_checkouts').insert({
        email: cleanEmail,
        first_name: cleanFirstName,
        items: storedItems,
        subtotal: pricing.subtotal,
        status: 'started',
      });
    }
  } catch (err) {
    console.error('[abandoned] capture failed:', (err as Error)?.message || err);
  }

  return NextResponse.json({ success: true });
}
