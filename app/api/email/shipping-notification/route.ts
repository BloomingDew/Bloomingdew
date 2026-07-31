import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, buildEmail } from '../../../../lib/email';
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

    // Only allow real web links in the tracking line.
    const safeTrackingUrl =
      typeof trackingUrl === 'string' && /^https?:\/\//i.test(trackingUrl.trim())
        ? trackingUrl.trim()
        : null;

    const itemsList = items
      .map((i: { name?: string; size?: string; quantity?: number }) =>
        `• ${i?.name ?? ''} (Size ${i?.size ?? ''}) x${i?.quantity ?? 1}`)
      .join('\n');
    const trackingInfo = trackingNumber
      ? `Your tracking number is: ${trackingNumber}${safeTrackingUrl ? `\nTrack your order here: ${safeTrackingUrl}` : ''}`
      : '';

    const email = await buildEmail('shipping-notification', {
      '{{customerName}}': customerName,
      '{{items}}': itemsList,
      '{{trackingInfo}}': trackingInfo,
    });

    if (!email) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: email.subject,
      html: email.html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Shipping notification email error:', err);
    return NextResponse.json({ error: 'Failed to send the shipping email.' }, { status: 500 });
  }
}
