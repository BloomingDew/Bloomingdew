import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, orderEmailBase } from '../../../../lib/email';

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, items, trackingNumber, trackingUrl } = await req.json();
    const resend = getResend();

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #E8DDD3;font-size:14px;color:#2C2C2C;">
          ${item.name} <span style="color:#9A8F87;font-size:12px;">— Size ${item.size}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #E8DDD3;font-size:14px;color:#9A8F87;text-align:right;">x${item.quantity}</td>
      </tr>
    `).join('');

    const html = orderEmailBase(`
      <!-- Header -->
      <div style="text-align:center;margin-bottom:36px;">
        <div style="width:52px;height:52px;background-color:#E8DDD3;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:22px;">📦</span>
        </div>
        <p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C9A882;margin:0 0 10px;">On Its Way</p>
        <h2 style="font-family:Georgia,serif;font-size:26px;font-weight:500;color:#2C2C2C;margin:0 0 12px;">
          Your order is on the way, ${customerName.split(' ')[0]}!
        </h2>
        <p style="font-size:14px;font-weight:300;color:#9A8F87;line-height:1.7;margin:0;">
          Your Bloomingdew order has been dispatched and is on its way to you.
        </p>
      </div>

      <!-- Tracking -->
      ${trackingNumber ? `
      <div style="background:#FFFFFF;border:1px solid #C9A882;padding:24px;margin-bottom:20px;text-align:center;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#9A8F87;margin:0 0 8px;">Tracking Number</p>
        <p style="font-size:18px;font-weight:500;color:#2C2C2C;margin:0 0 16px;">${trackingNumber}</p>
        ${trackingUrl ? `
        <a href="${trackingUrl}" style="display:inline-block;padding:12px 32px;background-color:#2C2C2C;color:#FAF7F4;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">
          Track My Order
        </a>
        ` : ''}
      </div>
      ` : ''}

      <!-- Items -->
      <div style="background:#FFFFFF;border:1px solid #E8DDD3;padding:24px;margin-bottom:20px;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#9A8F87;margin:0 0 16px;">Items Shipped</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
        </table>
      </div>

      <!-- Info -->
      <div style="background:#FFFFFF;border:1px solid #E8DDD3;padding:20px;text-align:center;">
        <p style="font-size:13px;color:#9A8F87;line-height:1.7;margin:0;">
          Questions about your delivery? Reach us at
          <a href="mailto:hello@bloomingdew.com" style="color:#C9A882;text-decoration:none;">hello@bloomingdew.com</a>
        </p>
      </div>
    `);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: 'Your Bloomingdew order is on its way 📦',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Shipping notification email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
