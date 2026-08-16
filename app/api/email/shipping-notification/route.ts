import { NextRequest, NextResponse } from 'next/server';
import { sendShippingNotificationEmail } from '../../../../lib/email';
import { getAdminUser } from '../../../../lib/admin-server';

export async function POST(req: NextRequest) {
  // Only admins can trigger shipping emails (called from the admin orders page).
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { customerName, customerEmail, items, trackingNumber, trackingUrl } = await req.json();

    if (typeof customerEmail !== 'string' || !Array.isArray(items)) {
      return NextResponse.json({ error: 'customerEmail and items are required.' }, { status: 400 });
    }

    // Only allow real web links in the tracking button — this value ends up as
    // an href in an email we send on the customer's behalf.
    const safeTrackingUrl =
      typeof trackingUrl === 'string' && /^https?:\/\//i.test(trackingUrl.trim())
        ? trackingUrl.trim()
        : null;

    const ok = await sendShippingNotificationEmail({
      customerName,
      customerEmail,
      items,
      trackingNumber: typeof trackingNumber === 'string' ? trackingNumber : null,
      trackingUrl: safeTrackingUrl,
    });

    if (!ok) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Shipping notification email error:', err);
    return NextResponse.json({ error: 'Failed to send the shipping email.' }, { status: 500 });
  }
}
