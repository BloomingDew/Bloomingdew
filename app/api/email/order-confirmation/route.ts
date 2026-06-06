import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, buildEmail } from '../../../../lib/email';

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, items, subtotal, orderTotal, shipping } = await req.json();

    const itemsList = items.map((i: any) => `• ${i.name} (Size ${i.size}) x${i.quantity} — ${i.price}`).join('\n');
    const shippingAddress = [
      shipping.address,
      shipping.apartment,
      shipping.city,
      shipping.postcode,
      shipping.country,
    ].filter(Boolean).join(', ');

    const email = await buildEmail('order-confirmation', {
      '{{customerName}}': customerName,
      '{{items}}': itemsList,
      '{{orderTotal}}': `₦${Number(orderTotal).toLocaleString()}`,
      '{{shippingAddress}}': shippingAddress,
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
    console.error('Order confirmation email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
