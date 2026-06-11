import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '../../../lib/rate-limit';

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

  const { error } = await supabase.from('enquiries').insert({
    type: str(body.type, 50) || 'contact',
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
