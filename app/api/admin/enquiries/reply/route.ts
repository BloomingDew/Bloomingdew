import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../../lib/admin-server';
import { sendBrandedEmail } from '../../../../../lib/email';

// Send a branded reply to an enquiry directly from the admin, then mark it
// replied. Service role for the enquiry lookup/update; Resend for the send.
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { enquiryId, subject, message } = await req.json();
  if (!enquiryId || typeof subject !== 'string' || !subject.trim() || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 });
  }

  const { data: enquiry } = await supabaseService
    .from('enquiries').select('id, email, first_name').eq('id', enquiryId).single();
  if (!enquiry?.email) {
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
  }

  try {
    await sendBrandedEmail({
      to: enquiry.email,
      subject: subject.trim().slice(0, 200),
      bodyText: message.trim().slice(0, 10000),
    });
  } catch (err) {
    console.error('[enquiries/reply] send error:', err);
    return NextResponse.json({ error: 'Failed to send the email.' }, { status: 500 });
  }

  await supabaseService.from('enquiries').update({ status: 'replied' }).eq('id', enquiryId);
  return NextResponse.json({ success: true });
}
