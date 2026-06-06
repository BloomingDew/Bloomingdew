import { NextRequest, NextResponse } from 'next/server';
import { getResend, FROM_EMAIL, orderEmailBase } from '../../../../lib/email';

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, items, subtotal, orderTotal, shipping } = await req.json();
    const resend = getResend();

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #E8DDD3;font-size:14px;color:#2C2C2C;">
          ${item.name}
          <span style="color:#9A8F87;font-size:12px;"> — Size ${item.size}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #E8DDD3;font-size:14px;color:#9A8F87;text-align:center;">x${item.quantity}</td>
        <td style="padding:12px 0;border-bottom:1px solid #E8DDD3;font-size:14px;color:#2C2C2C;text-align:right;">${item.price}</td>
      </tr>
    `).join('');

    const html = orderEmailBase(`
      <!-- Header -->
      <div style="text-align:center;margin-bottom:36px;">
        <div style="width:52px;height:52px;background-color:#E8DDD3;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="font-size:22px;color:#2C2C2C;">✓</span>
        </div>
        <p style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#C9A882;margin:0 0 10px;">Order Confirmed</p>
        <h2 style="font-family:Georgia,serif;font-size:26px;font-weight:500;color:#2C2C2C;margin:0 0 12px;">
          Thank you, ${customerName.split(' ')[0]}.
        </h2>
        <p style="font-size:14px;font-weight:300;color:#9A8F87;line-height:1.7;margin:0;">
          We've received your order and we're so excited to get it to you.<br>
          We'll be in touch within 48 hours.
        </p>
      </div>

      <!-- Order items -->
      <div style="background:#FFFFFF;border:1px solid #E8DDD3;padding:24px;margin-bottom:20px;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#9A8F87;margin:0 0 16px;">Your Order</p>
        <table style="width:100%;border-collapse:collapse;">
          ${itemRows}
          <tr>
            <td colspan="2" style="padding:14px 0 6px;font-size:13px;color:#9A8F87;">Subtotal</td>
            <td style="padding:14px 0 6px;font-size:13px;color:#2C2C2C;text-align:right;">₦${Number(subtotal).toLocaleString()}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:4px 0;font-size:13px;color:#9A8F87;">Shipping</td>
            <td style="padding:4px 0;font-size:13px;color:#C9A882;text-align:right;">TBD</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:14px 0 0;font-size:15px;font-weight:500;color:#2C2C2C;border-top:1px solid #E8DDD3;">Total</td>
            <td style="padding:14px 0 0;font-size:15px;font-weight:500;color:#2C2C2C;text-align:right;border-top:1px solid #E8DDD3;">₦${Number(orderTotal).toLocaleString()}</td>
          </tr>
        </table>
      </div>

      <!-- Shipping address -->
      <div style="background:#FFFFFF;border:1px solid #E8DDD3;padding:24px;margin-bottom:20px;">
        <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#9A8F87;margin:0 0 10px;">Shipping To</p>
        <p style="font-size:14px;color:#2C2C2C;line-height:1.7;margin:0;">
          ${customerName}<br>
          ${shipping.address}${shipping.apartment ? ', ' + shipping.apartment : ''}<br>
          ${shipping.city}${shipping.postcode ? ', ' + shipping.postcode : ''}<br>
          ${shipping.country}
        </p>
      </div>

      <!-- Info -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
        <tr>
          <td style="width:50%;padding-right:8px;">
            <div style="border:1px solid #E8DDD3;padding:16px;">
              <p style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A882;margin:0 0 6px;">Questions?</p>
              <p style="font-size:13px;color:#2C2C2C;margin:0;">hello@bloomingdew.com</p>
            </div>
          </td>
          <td style="width:50%;padding-left:8px;">
            <div style="border:1px solid #E8DDD3;padding:16px;">
              <p style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#C9A882;margin:0 0 6px;">Made</p>
              <p style="font-size:13px;color:#2C2C2C;margin:0;">By hand, with love</p>
            </div>
          </td>
        </tr>
      </table>
    `);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: 'Your Bloomingdew order is confirmed ✓',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Order confirmation email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
