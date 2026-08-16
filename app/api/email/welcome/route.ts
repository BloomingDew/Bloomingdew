import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/admin-server';
import { sendWelcomeEmail } from '../../../../lib/email';

// Sends the welcome email once per account.
//
// Called by the client on sign-in rather than at sign-up, because when email
// confirmation is enabled there is no session until the address is confirmed —
// and welcoming an address that was never confirmed would be sending mail to
// someone who may not have asked for it.
//
// The caller must present their Supabase access token. The recipient is taken
// from the *verified* token, never from the request body, so this can't be
// used to send mail to arbitrary addresses.
//
// `welcome_email_sent_at` makes it idempotent: sign-in fires on every session,
// but only the first one results in an email.
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: userData, error: authError } = await supabaseService.auth.getUser(token);
  const user = userData?.user;
  if (authError || !user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabaseService
    .from('profiles')
    .select('first_name, welcome_email_sent_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.welcome_email_sent_at) {
    return NextResponse.json({ sent: false, reason: 'already-sent' });
  }

  // Stamp before sending. If the send throws we'd rather miss one welcome than
  // risk a loop that mails the same person on every retry.
  const { error: stampError } = await supabaseService
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('welcome_email_sent_at', null);
  if (stampError) {
    console.error('[email/welcome] stamp failed:', stampError.message);
    return NextResponse.json({ sent: false, reason: 'stamp-failed' });
  }

  try {
    await sendWelcomeEmail({ to: user.email, firstName: profile?.first_name || '' });
    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('[email/welcome] send failed:', err);
    return NextResponse.json({ sent: false, reason: 'send-failed' });
  }
}
