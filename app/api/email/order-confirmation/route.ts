import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { customerName, customerEmail, items, subtotal, orderTotal, shipping } = await req.json();

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8DDD3; font-family: 'Helvetica', sans-serif; font-size: 14px; color: #2C2C2C;">
          ${item.name} <span style="color: #9A8F87; font-size: 12px;">(Size: ${item.size})</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8DDD3; font-family: 'Helvetica', sans-serif; font-size: 14px; color: #2C2C2C; text-align: right;">
          x${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E8DDD3; font-family: 'Helvetica', sans-serif; font-size: 14px; color: #2C2C2C; text-align: right;">
          ${item.price}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="margin: 0; padding: 0; background-color: #FAF7F4;">
        <div style="max-width: 600px; margin: 0 auto; padding: 48px 24px;">

          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 500; color: #2C2C2C; letter-spacing: 0.08em; margin: 0;">
              Bloomingdew
            </h1>
          </div>

          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 56px; height: 56px; background-color: #E8DDD3; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="font-size: 24px;">✓</span>
            </div>
            <p style="font-family: 'Helvetica', sans-serif; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #C9A882; margin: 0 0 12px;">Order Confirmed</p>
            <h2 style="font-family: Georgia, serif; font-size: 28px; font-weight: 500; color: #2C2C2C; margin: 0 0 16px;">Thank you, ${customerName.split(' ')[0]}.</h2>
            <p style="font-family: 'Helvetica', sans-serif; font-size: 15px; font-weight: 300; color: #9A8F87; line-height: 1.7; margin: 0;">
              We've received your order and we're so excited to make something beautiful for you.<br>
              We'll be in touch within 48 hours.
            </p>
          </div>

          <!-- Order items -->
          <div style="background-color: #FFFFFF; border: 1px solid #E8DDD3; padding: 24px; margin-bottom: 24px;">
            <h3 style="font-family: 'Helvetica', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #9A8F87; margin: 0 0 16px;">Your Order</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemRows}
              <tr>
                <td colspan="2" style="padding: 16px 0 8px; font-family: 'Helvetica', sans-serif; font-size: 13px; color: #9A8F87;">Subtotal</td>
                <td style="padding: 16px 0 8px; font-family: 'Helvetica', sans-serif; font-size: 13px; color: #2C2C2C; text-align: right;">₦${Number(subtotal).toLocaleString()}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 4px 0; font-family: 'Helvetica', sans-serif; font-size: 13px; color: #9A8F87;">Shipping</td>
                <td style="padding: 4px 0; font-family: 'Helvetica', sans-serif; font-size: 13px; color: #C9A882; text-align: right;">TBD</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 16px 0 0; font-family: 'Helvetica', sans-serif; font-size: 15px; font-weight: 500; color: #2C2C2C; border-top: 1px solid #E8DDD3;">Total</td>
                <td style="padding: 16px 0 0; font-family: 'Helvetica', sans-serif; font-size: 15px; font-weight: 500; color: #2C2C2C; text-align: right; border-top: 1px solid #E8DDD3;">₦${Number(orderTotal).toLocaleString()}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping address -->
          <div style="background-color: #FFFFFF; border: 1px solid #E8DDD3; padding: 24px; margin-bottom: 24px;">
            <h3 style="font-family: 'Helvetica', sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #9A8F87; margin: 0 0 12px;">Shipping To</h3>
            <p style="font-family: 'Helvetica', sans-serif; font-size: 14px; color: #2C2C2C; line-height: 1.7; margin: 0;">
              ${customerName}<br>
              ${shipping.address}${shipping.apartment ? ', ' + shipping.apartment : ''}<br>
              ${shipping.city}${shipping.postcode ? ', ' + shipping.postcode : ''}<br>
              ${shipping.country}
            </p>
          </div>

          <!-- Info boxes -->
          <div style="display: grid; gap: 12px; margin-bottom: 40px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding-right: 6px;">
                  <div style="border: 1px solid #E8DDD3; padding: 16px;">
                    <p style="font-family: 'Helvetica', sans-serif; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A882; margin: 0 0 6px;">Production Time</p>
                    <p style="font-family: 'Helvetica', sans-serif; font-size: 14px; color: #2C2C2C; margin: 0;">2–4 weeks</p>
                  </div>
                </td>
                <td style="width: 50%; padding-left: 6px;">
                  <div style="border: 1px solid #E8DDD3; padding: 16px;">
                    <p style="font-family: 'Helvetica', sans-serif; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A882; margin: 0 0 6px;">Questions?</p>
                    <p style="font-family: 'Helvetica', sans-serif; font-size: 14px; color: #2C2C2C; margin: 0;">hello@bloomingdew.com</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #E8DDD3; padding-top: 32px;">
            <p style="font-family: 'Helvetica', sans-serif; font-size: 12px; font-weight: 300; color: #9A8F87; line-height: 1.7; margin: 0;">
              Made by hand, with love.<br>
              <a href="https://bloomingdew.com" style="color: #C9A882; text-decoration: none;">bloomingdew.com</a>
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    await resend.emails.send({
      from: 'Bloomingdew <orders@bloomingdew.com>',
      to: customerEmail,
      subject: 'Your Bloomingdew order is confirmed ✓',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
