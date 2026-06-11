import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '../../../../lib/email';
import { getAdminUser } from '../../../../lib/admin-server';

// Customer confirmation emails are sent server-side by /api/orders/create.
// This HTTP endpoint remains only for admin-triggered resends and is therefore
// restricted to authenticated admins (previously it was an open send-as-Bloomingdew relay).
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { customerName, customerEmail, items, orderTotal, shipping } = await req.json();
    const ok = await sendOrderConfirmationEmail({ customerName, customerEmail, items, orderTotal, shipping });
    if (!ok) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Order confirmation email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
