import { createHmac, timingSafeEqual } from 'crypto';

// Anti-bot token for public forms.
//
// The enquiry endpoint was being replayed directly by a bot (174 of the last
// 179 submissions), each one triggering an acknowledgement email to a
// harvested stranger's address — backscatter that poisons our sender
// reputation. A rendered page now has to fetch a signed token first, and the
// server won't accept a submission younger than a human could plausibly type
// one. Replay bots that just POST the endpoint fail both.

const MIN_AGE_MS = 3_000;          // faster than this isn't a person typing
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function secret(): string {
  // Server-only values; never shipped to the client.
  return process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret';
}

export function issueFormToken(): string {
  const ts = Date.now().toString(36);
  const sig = createHmac('sha256', secret()).update(ts).digest('hex').slice(0, 32);
  return `${ts}.${sig}`;
}

export function verifyFormToken(token: unknown): boolean {
  if (typeof token !== 'string') return false;
  const [ts, sig] = token.split('.');
  if (!ts || !sig) return false;
  const expected = createHmac('sha256', secret()).update(ts).digest('hex').slice(0, 32);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  const age = Date.now() - parseInt(ts, 36);
  return age >= MIN_AGE_MS && age <= MAX_AGE_MS;
}
