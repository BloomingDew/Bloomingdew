import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, buildEmail } from '../../../../lib/email';

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, items, trackingNumber, trackingUrl } = await req.json();

    const itemsList = items.map((i: any) => `• ${i.name} (Size ${i.size}) x${i.quantity}`).join('\n');
    const trackingInfo = trackingNumber
      ? `Your tracking number is: ${trackingNumber}${trackingUrl ? `\nTrack your order here: ${trackingUrl}` : ''}`
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
  } catch (err: any) {
    console.error('Shipping notification email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
