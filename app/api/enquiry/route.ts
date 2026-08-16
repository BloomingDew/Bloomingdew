import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '../../../lib/rate-limit';
import { sendCustomRequestEmails } from '../../../lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const { allowed } = rateLimit(ip, 5, 60_000);

  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const str = (v: unknown, max: number) =>
    typeof v === 'string' ? v.trim().slice(0, max) : null;

  const email = str(body.email, 200);
  const firstName = str(body.first_name, 100);
  const message = str(body.message, 5000);

  // Basic required-field + format validation
  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!firstName || !emailValid || !message) {
    return NextResponse.json(
      { error: 'Please provide your name, a valid email, and a message.' },
      { status: 400 },
    );
  }

  const type = str(body.type, 50) || 'contact';

  const { error } = await supabase.from('enquiries').insert({
    type,
    first_name: firstName,
    last_name: str(body.last_name, 100),
    email,
    phone: str(body.phone, 50),
    subject: str(body.subject, 200),
    message,
    occasion: str(body.occasion, 200),
    budget: str(body.budget, 100),
    measurements: body.measurements ?? null,
    status: 'unread',
  });

  if (error) {
    console.error('[enquiry] insert error:', error.message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  // Acknowledge to the customer and notify the studio. Best-effort: the
  // enquiry is already saved, so a mail failure must not tell the customer
  // their request didn't go through.
  if (type === 'custom') {
    try {
      await sendCustomRequestEmails({
        firstName,
        lastName: str(body.last_name, 100),
        email,
        phone: str(body.phone, 50),
        occasion: str(body.occasion, 200),
        budget: str(body.budget, 100),
        message,
        measurements: (body.measurements as Record<string, string>) ?? null,
      });
    } catch (err) {
      console.error('[enquiry] custom request email failed:', err);
    }
  }

  return NextResponse.json({ success: true });
}
