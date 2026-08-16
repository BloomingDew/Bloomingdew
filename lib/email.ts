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

// Escape customer-controlled values so typed names/items can't inject HTML
// into the branded email body.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Branded HTML shell
//
// Email clients are not browsers: no flexbox or grid, no rem units, no
// reliable web fonts, and Outlook still wants table layout. So this is
// deliberately table-based, inline-styled and px-only throughout.
//
// Playfair Display and Jost don't survive Gmail, so the brand pairing degrades
// to the closest widely-installed equivalents — Georgia for the display serif,
// Helvetica/Arial for the body — which keeps the shape of the brand even where
// the exact faces are unavailable.
// ---------------------------------------------------------------------------

const BRAND = {
  cream: '#FAF7F4',
  paper: '#FFFFFF',
  ink: '#2C2C2C',
  body: '#5C5450',
  muted: '#9A8F87',
  gold: '#C9A882',
  border: '#E8DDD3',
};

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = 'Helvetica,Arial,sans-serif';
const SITE = 'https://bloomingdew.com';
const CONTACT_EMAIL = 'info@bloomingdew.com';

/**
 * Wrap content in the branded shell.
 *
 * `preheader` is the grey preview line inbox lists show next to the subject.
 * Left unset, clients scrape whatever text comes first — usually the wordmark
 * — which wastes the most valuable real estate in the inbox.
 */
function shell(opts: { eyebrow: string; heading: string; preheader: string; contentHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(opts.preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.cream};">
<tr><td align="center" style="padding:40px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">

  <tr><td align="center" style="padding-bottom:28px;">
    <a href="${SITE}" style="font-family:${SERIF};font-size:22px;letter-spacing:0.22em;color:${BRAND.ink};text-decoration:none;text-transform:uppercase;">Bloomingdew</a>
  </td></tr>

  <tr><td style="background-color:${BRAND.paper};border:1px solid ${BRAND.border};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

      <tr><td style="padding:40px 40px 0;text-align:center;">
        <div style="font-family:${SANS};font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.gold};padding-bottom:14px;">${escapeHtml(opts.eyebrow)}</div>
        <div style="font-family:${SERIF};font-size:28px;line-height:1.25;color:${BRAND.ink};">${escapeHtml(opts.heading)}</div>
        <div style="padding-top:22px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td style="width:44px;height:1px;background-color:${BRAND.gold};font-size:0;line-height:0;">&nbsp;</td></tr></table></div>
      </td></tr>

      <tr><td style="padding:26px 40px 40px;">${opts.contentHtml}</td></tr>

    </table>
  </td></tr>

  <tr><td align="center" style="padding:28px 24px 0;">
    <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;line-height:1.8;color:${BRAND.muted};">
      Questions? Just reply to this email &mdash; a real person reads it.
    </p>
    <p style="margin:0 0 14px;font-family:${SANS};font-size:12px;line-height:1.8;color:${BRAND.muted};">
      <a href="mailto:${CONTACT_EMAIL}" style="color:${BRAND.gold};text-decoration:none;">${CONTACT_EMAIL}</a>
      &nbsp;&middot;&nbsp;
      <a href="${SITE}" style="color:${BRAND.gold};text-decoration:none;">bloomingdew.com</a>
      &nbsp;&middot;&nbsp;
      <a href="${SITE}/refund-policy" style="color:${BRAND.gold};text-decoration:none;">Refund policy</a>
    </p>
    <p style="margin:0;font-family:${SANS};font-size:11px;line-height:1.7;color:${BRAND.muted};">
      Handcrafted with love in Lagos, Nigeria.
    </p>
  </td></tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

/** Turn the plain-text template body into styled paragraphs. */
function prose(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p =>
      `<p style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.85;color:${BRAND.body};">${p.replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

/**
 * The order summary card: itemised lines, total, and delivery address.
 *
 * Built as real table rows rather than dumped as pre-formatted text, so prices
 * align right and each garment reads as its own line.
 */
export function renderOrderSummary(
  items: OrderEmailItem[],
  orderTotal: string,
  shippingAddress: string,
): string {
  const rows = items.map(i => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};">
        <span style="display:block;font-size:14px;color:${BRAND.ink};">${escapeHtml(i.name)}</span>
        <span style="display:block;padding-top:4px;font-size:12px;color:${BRAND.muted};">Size ${escapeHtml(i.size)} &middot; Qty ${i.quantity}</span>
      </td>
      <td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};font-size:14px;color:${BRAND.ink};white-space:nowrap;">${escapeHtml(i.price)}</td>
    </tr>`).join('');

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 28px;">
    <tr><td style="padding-bottom:6px;font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};border-bottom:1px solid ${BRAND.ink};padding-bottom:10px;">Your order</td>
        <td style="border-bottom:1px solid ${BRAND.ink};"></td></tr>
    ${rows}
    <tr>
      <td style="padding:18px 0 0;font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};">Total</td>
      <td align="right" style="padding:18px 0 0;font-family:${SERIF};font-size:20px;color:${BRAND.ink};white-space:nowrap;">${escapeHtml(orderTotal)}</td>
    </tr>
  </table>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;background-color:${BRAND.cream};border:1px solid ${BRAND.border};">
    <tr><td style="padding:18px 20px;">
      <div style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};padding-bottom:8px;">Delivering to</div>
      <div style="font-family:${SANS};font-size:14px;line-height:1.7;color:${BRAND.ink};">${escapeHtml(shippingAddress)}</div>
    </td></tr>
  </table>`;
}

/** Bulletproof CTA — a styled <a> inside a table cell, since Outlook ignores padding on links. */
function button(label: string, href: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:4px auto 0;">
    <tr><td bgcolor="${BRAND.gold}" align="center">
      <a href="${href}" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.ink};text-decoration:none;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

// Fetch template from DB and replace variables.
//
// `blocks` are pre-rendered HTML fragments we build ourselves (the order
// summary table, the CTA). They're inserted raw — every customer-supplied
// value inside them is escaped at construction — whereas `variables` are
// escaped here, since those come straight from checkout input.
export async function buildEmail(
  templateId: string,
  variables: Record<string, string>,
  blocks: Record<string, string> = {},
): Promise<{ subject: string; html: string } | null> {
  const supabase = getSupabase();
  const { data } = await supabase.from('email_templates').select('subject, body').eq('id', templateId).single();
  if (!data) return null;

  let subject = data.subject;
  let body = data.body;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, escapeHtml(value));
  }

  // Prose first, so paragraph wrapping never runs over the block markup.
  let contentHtml = prose(body);
  for (const [key, value] of Object.entries(blocks)) {
    const regex = new RegExp(`<p[^>]*>\\s*${key.replace(/[{}]/g, '\\$&')}\\s*</p>|${key.replace(/[{}]/g, '\\$&')}`, 'g');
    contentHtml = contentHtml.replace(regex, value);
  }

  const heading = variables['{{emailHeading}}'] || 'Thank you for your order.';
  const eyebrow = variables['{{emailEyebrow}}'] || 'Order confirmed';
  const preheader = variables['{{emailPreheader}}'] || subject;

  return { subject, html: shell({ eyebrow, heading, preheader, contentHtml }) };
}

// Free-form branded email (e.g. admin replies to enquiries). The body is
// plain text typed by the admin — escaped, then wrapped in the same branded
// shell the templates use.
export async function sendBrandedEmail(params: { to: string; subject: string; bodyText: string }): Promise<void> {
  const html = shell({
    eyebrow: 'Bloomingdew',
    heading: params.subject,
    preheader: params.bodyText.slice(0, 140).replace(/\s+/g, ' '),
    contentHtml: prose(escapeHtml(params.bodyText)),
  });

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: CONTACT_EMAIL,
    to: params.to,
    subject: params.subject,
    html,
  });
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
  const shippingAddress = [
    payload.shipping.address,
    payload.shipping.apartment,
    payload.shipping.city,
    payload.shipping.postcode,
    payload.shipping.country,
  ].filter(Boolean).join(', ');

  const orderTotal = `$${Number(payload.orderTotal).toFixed(2)}`;

  const email = await buildEmail(
    'order-confirmation',
    {
      '{{customerName}}': payload.customerName,
      '{{orderTotal}}': orderTotal,
      '{{shippingAddress}}': shippingAddress,
    },
    {
      '{{orderSummary}}': renderOrderSummary(payload.items, orderTotal, shippingAddress),
      '{{shopButton}}': button('Continue shopping', `${SITE}/shop`),
    },
  );
  if (!email) return false;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    // Sending doesn't need a mailbox, but replies do — and orders@ has none,
    // so without this every "can I change the size?" would bounce.
    replyTo: CONTACT_EMAIL,
    to: payload.customerEmail,
    subject: email.subject,
    html: email.html,
  });
  return true;
}

// ---------------------------------------------------------------------------
// Welcome email (new account)
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(params: { to: string; firstName: string }): Promise<boolean> {
  const email = await buildEmail(
    'welcome',
    {
      '{{customerName}}': params.firstName || 'there',
      '{{emailEyebrow}}': 'Welcome',
      '{{emailHeading}}': 'Welcome to Bloomingdew.',
      '{{emailPreheader}}': 'Your account is ready — here is what you can do with it.',
    },
    { '{{shopButton}}': button('Start shopping', `${SITE}/shop`) },
  );
  if (!email) return false;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: CONTACT_EMAIL,
    to: params.to,
    subject: email.subject,
    html: email.html,
  });
  return true;
}

// ---------------------------------------------------------------------------
// Custom outfit request
//
// Two emails: an acknowledgement to the customer so they know it arrived, and
// a notification to the studio with the full brief and measurements. Without
// the second one a custom request just sits unseen in the admin.
// ---------------------------------------------------------------------------

export type CustomRequestPayload = {
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  occasion?: string | null;
  budget?: string | null;
  message: string;
  measurements?: Record<string, string> | null;
};

/** Definition-list block used by the studio notification. */
function detailRows(rows: Array<[string, string | null | undefined]>): string {
  const visible = rows.filter(([, v]) => v && String(v).trim());
  if (!visible.length) return '';
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;">
    ${visible.map(([label, value]) => `
    <tr>
      <td width="38%" valign="top" style="padding:10px 12px 10px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">${escapeHtml(label)}</td>
      <td valign="top" style="padding:10px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};font-size:14px;line-height:1.7;color:${BRAND.ink};">${escapeHtml(String(value))}</td>
    </tr>`).join('')}
  </table>`;
}

export async function sendCustomRequestEmails(payload: CustomRequestPayload): Promise<void> {
  const resend = getResend();
  const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ');
  const m = payload.measurements || {};
  const measurementText = Object.entries(m)
    .filter(([, v]) => v && String(v).trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');

  // 1. Acknowledgement to the customer.
  const ack = await buildEmail(
    'custom-request',
    {
      '{{customerName}}': payload.firstName || 'there',
      '{{occasion}}': payload.occasion || 'your occasion',
      '{{emailEyebrow}}': 'Request received',
      '{{emailHeading}}': 'We have your custom request.',
      '{{emailPreheader}}': 'Our team will be in touch within 48 hours to talk through your piece.',
    },
    {},
  );
  if (ack) {
    await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: CONTACT_EMAIL,
      to: payload.email,
      subject: ack.subject,
      html: ack.html,
    });
  }

  // 2. Notification to the studio.
  const details = detailRows([
    ['Name', fullName],
    ['Email', payload.email],
    ['Phone', payload.phone],
    ['Occasion', payload.occasion],
    ['Budget', payload.budget],
    ['Measurements', measurementText],
  ]);

  const html = shell({
    eyebrow: 'New custom request',
    heading: fullName || 'New custom request',
    preheader: `${fullName} — ${payload.occasion || 'custom piece'}`,
    contentHtml: `
      <p style="margin:0 0 4px;font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${BRAND.muted};">Their vision</p>
      <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.85;color:${BRAND.body};">${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
      ${details}
      <p style="margin:26px 0 0;font-family:${SANS};font-size:13px;line-height:1.8;color:${BRAND.muted};">Reply directly to this email to reach ${escapeHtml(payload.firstName)}.</p>`,
  });

  await resend.emails.send({
    from: FROM_EMAIL,
    // Replying to the notification should reach the customer, not ourselves.
    replyTo: payload.email,
    to: CONTACT_EMAIL,
    subject: `Custom request — ${fullName || payload.email}`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Team order notification
//
// Every order path sends both the customer confirmation and this studio
// notification through sendOrderEmails() below. They were separate calls
// before, which is how the Square route ended up sending neither.
// ---------------------------------------------------------------------------

/** Comma-separated override so recipients can change without a deploy. */
function notificationRecipients(): string[] {
  const raw = process.env.ORDER_NOTIFICATION_EMAILS;
  if (raw) {
    const list = raw.split(',').map(s => s.trim()).filter(Boolean);
    if (list.length) return list;
  }
  return ['t.mol.med@gmail.com', 'info@bloomingdew.com'];
}

export type OrderNotificationPayload = OrderConfirmationPayload & {
  orderId?: string | null;
  customerPhone?: string | null;
  paymentProvider?: string | null;
};

export async function sendOrderNotificationEmail(payload: OrderNotificationPayload): Promise<void> {
  const orderTotal = `$${Number(payload.orderTotal).toFixed(2)}`;
  const shippingAddress = [
    payload.shipping.address,
    payload.shipping.apartment,
    payload.shipping.city,
    payload.shipping.postcode,
    payload.shipping.country,
  ].filter(Boolean).join(', ');

  const details = detailRows([
    ['Order', payload.orderId ? String(payload.orderId) : null],
    ['Customer', payload.customerName],
    ['Email', payload.customerEmail],
    ['Phone', payload.customerPhone],
    ['Paid via', payload.paymentProvider],
  ]);

  const html = shell({
    eyebrow: 'New order',
    heading: `${orderTotal} — ${payload.customerName}`,
    preheader: `${payload.customerName} ordered ${payload.items.length} item(s) — ${orderTotal}`,
    contentHtml: `
      ${renderOrderSummary(payload.items, orderTotal, shippingAddress)}
      ${details}
      <p style="margin:26px 0 0;font-family:${SANS};font-size:13px;line-height:1.8;color:${BRAND.muted};">Reply to this email to reach the customer directly.</p>`,
  });

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: payload.customerEmail,
    to: notificationRecipients(),
    subject: `New order — ${orderTotal} — ${payload.customerName}`,
    html,
  });
}

/**
 * Single entry point for every order path: confirms to the customer and
 * notifies the studio.
 *
 * Each send is isolated so a failure on one still lets the other through, and
 * neither can throw into a payment handler — the money has already moved by
 * the time this runs.
 */
export async function sendOrderEmails(payload: OrderNotificationPayload): Promise<void> {
  try {
    await sendOrderConfirmationEmail(payload);
  } catch (err) {
    console.error('[email] order confirmation failed:', err);
  }
  try {
    await sendOrderNotificationEmail(payload);
  } catch (err) {
    console.error('[email] order notification failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Shipping notification
// ---------------------------------------------------------------------------

export type ShippedItem = { name?: string; size?: string; quantity?: number; colour?: string | null };

/**
 * What's in the parcel. No price column — by this point the customer has
 * already paid and what they want to know is which pieces are on the way.
 */
export function renderShippedItems(items: ShippedItem[]): string {
  const rows = items.map(i => {
    const detail = [
      i.size ? `Size ${i.size}` : null,
      i.colour || null,
      `Qty ${i.quantity ?? 1}`,
    ].filter(Boolean).join(' · ');
    return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid ${BRAND.border};font-family:${SANS};">
        <span style="display:block;font-size:14px;color:${BRAND.ink};">${escapeHtml(i.name ?? '')}</span>
        <span style="display:block;padding-top:4px;font-size:12px;color:${BRAND.muted};">${escapeHtml(detail)}</span>
      </td>
    </tr>`;
  }).join('');

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 28px;">
    <tr><td style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};border-bottom:1px solid ${BRAND.ink};padding-bottom:10px;">In this parcel</td></tr>
    ${rows}
  </table>`;
}

/** Tracking number plus, where we have a real link, a button to follow it. */
export function renderTracking(trackingNumber?: string | null, trackingUrl?: string | null): string {
  if (!trackingNumber && !trackingUrl) return '';

  const numberBlock = trackingNumber
    ? `<div style="font-family:${SANS};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.muted};padding-bottom:8px;">Tracking number</div>
       <div style="font-family:${SERIF};font-size:20px;letter-spacing:0.04em;color:${BRAND.ink};">${escapeHtml(trackingNumber)}</div>`
    : '';

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;background-color:${BRAND.cream};border:1px solid ${BRAND.border};">
    <tr><td align="center" style="padding:22px 20px;">
      ${numberBlock}
      ${trackingUrl ? `<div style="padding-top:${trackingNumber ? '18px' : '0'};">${button('Track your parcel', trackingUrl)}</div>` : ''}
    </td></tr>
  </table>`;
}

export async function sendShippingNotificationEmail(params: {
  customerName: string;
  customerEmail: string;
  items: ShippedItem[];
  trackingNumber?: string | null;
  trackingUrl?: string | null;
}): Promise<boolean> {
  const email = await buildEmail(
    'shipping-notification',
    {
      '{{customerName}}': params.customerName || 'there',
      '{{emailEyebrow}}': 'On its way',
      '{{emailHeading}}': 'Your order is on its way.',
      '{{emailPreheader}}': params.trackingNumber
        ? `Tracking ${params.trackingNumber} — your Bloomingdew order has shipped.`
        : 'Your Bloomingdew order has shipped.',
    },
    {
      '{{shippedItems}}': renderShippedItems(params.items),
      '{{trackingBlock}}': renderTracking(params.trackingNumber, params.trackingUrl),
    },
  );
  if (!email) return false;

  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    replyTo: CONTACT_EMAIL,
    to: params.customerEmail,
    subject: email.subject,
    html: email.html,
  });
  return true;
}
