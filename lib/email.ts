import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  return new Resend(process.env.RESEND_API_KEY);
}

export const FROM_EMAIL = 'Bloomingdew <orders@bloomingdew.com>';

// Server-side supabase client using service role
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Fetch template from DB and replace variables
export async function buildEmail(templateId: string, variables: Record<string, string>): Promise<{ subject: string; html: string } | null> {
  const supabase = getSupabase();
  const { data } = await supabase.from('email_templates').select('subject, body').eq('id', templateId).single();
  if (!data) return null;

  let subject = data.subject;
  let body = data.body;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  // Wrap body in branded HTML template
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#FAF7F4;">
      <div style="max-width:600px;margin:0 auto;padding:48px 24px;font-family:Helvetica,sans-serif;">

        <div style="text-align:center;margin-bottom:40px;">
          <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:500;color:#2C2C2C;letter-spacing:0.08em;margin:0;">
            Bloomingdew
          </h1>
        </div>

        <div style="background:#FFFFFF;border:1px solid #E8DDD3;padding:2rem;white-space:pre-line;font-size:15px;line-height:1.8;color:#2C2C2C;">
          ${body.replace(/\n/g, '<br>')}
        </div>

        <div style="text-align:center;border-top:1px solid #E8DDD3;padding-top:32px;margin-top:40px;">
          <p style="font-size:12px;color:#9A8F87;line-height:1.7;margin:0;">
            Made with love.<br>
            <a href="https://bloomingdew.com" style="color:#C9A882;text-decoration:none;">bloomingdew.com</a>
            &nbsp;·&nbsp;
            <a href="mailto:hello@bloomingdew.com" style="color:#C9A882;text-decoration:none;">hello@bloomingdew.com</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

type OrderEmailItem = { name: string; size: string; quantity: number; price: string };

export type OrderConfirmationPayload = {
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  orderTotal: number;
  shipping: {
    address?: string;
    apartment?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
};

// Shared sender so server code (e.g. the order-create route) can send the
// confirmation email directly instead of going through an HTTP endpoint.
export async function sendOrderConfirmationEmail(payload: OrderConfirmationPayload): Promise<boolean> {
  const itemsList = payload.items
    .map(i => `• ${i.name} (Size ${i.size}) x${i.quantity} — ${i.price}`)
    .join('\n');
  const shippingAddress = [
    payload.shipping.address,
    payload.shipping.apartment,
    payload.shipping.city,
    payload.shipping.postcode,
    payload.shipping.country,
  ].filter(Boolean).join(', ');

  const email = await buildEmail('order-confirmation', {
    '{{customerName}}': payload.customerName,
    '{{items}}': itemsList,
    '{{orderTotal}}': `₦${Number(payload.orderTotal).toLocaleString()}`,
    '{{shippingAddress}}': shippingAddress,
  });
  if (!email) return false;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to: payload.customerEmail,
    subject: email.subject,
    html: email.html,
  });
  return true;
}
