// TikTok Events API (server-side).
//
// iOS tracking prevention and ad blockers drop a large share of browser pixel
// events — disproportionately the purchase events that matter most for ad
// optimisation. Mirroring CompletePayment from the server recovers those.
//
// Browser and server send the SAME event_id (the order id), which is how TikTok
// deduplicates: it keeps whichever arrives first and discards the twin, so a
// buyer is never counted twice.
//
// No-ops unless TIKTOK_ACCESS_TOKEN is set, so nothing breaks in environments
// where the token hasn't been configured.

import { createHash } from 'crypto';
import { TIKTOK_PIXEL_ID } from './tiktok';

const ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

/** TikTok requires identifiers pre-hashed with SHA-256 over a normalised value. */
function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const normalised = email.trim().toLowerCase();
  return normalised ? sha256(normalised) : undefined;
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  // E.164: digits with a leading '+', nothing else.
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return undefined;
  return sha256(`+${digits}`);
}

export type TikTokServerEvent = {
  event: string;
  /** Shared with the browser event so TikTok can deduplicate. */
  eventId: string;
  email?: string | null;
  phone?: string | null;
  value: number;
  currency?: string;
  contents?: Array<{
    content_id: string;
    content_name: string;
    content_type: 'product';
    price: number;
    quantity: number;
  }>;
  /** Request context — improves match quality. All optional. */
  url?: string;
  ip?: string;
  userAgent?: string;
  /** _ttp cookie, set by the pixel on our own domain. */
  ttp?: string;
  /** TikTok click id, present when the visitor arrived from an ad. */
  ttclid?: string;
};

/**
 * Send one event to TikTok. Never throws and never blocks the caller's happy
 * path — a failed analytics call must not turn a successful payment into an
 * error response.
 */
export async function sendTikTokEvent(event: TikTokServerEvent): Promise<void> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) return;

  try {
    const user: Record<string, string> = {};
    const email = hashEmail(event.email);
    const phone = hashPhone(event.phone);
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (event.ip) user.ip = event.ip;
    if (event.userAgent) user.user_agent = event.userAgent;
    if (event.ttp) user.ttp = event.ttp;
    if (event.ttclid) user.ttclid = event.ttclid;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: TIKTOK_PIXEL_ID,
        data: [
          {
            event: event.event,
            event_time: Math.floor(Date.now() / 1000),
            event_id: event.eventId,
            user,
            properties: {
              currency: event.currency || 'USD',
              value: Number(event.value.toFixed(2)),
              ...(event.contents ? { contents: event.contents } : {}),
            },
            ...(event.url ? { page: { url: event.url } } : {}),
          },
        ],
      }),
    });

    // TikTok returns HTTP 200 with a non-zero `code` on rejection, so the
    // status alone isn't enough to know it worked.
    const body = await res.json().catch(() => null);
    if (!res.ok || (body && body.code !== 0)) {
      console.error('[tiktok] event rejected:', res.status, JSON.stringify(body));
    }
  } catch (err) {
    console.error('[tiktok] event failed:', err);
  }
}

/** Pull match-quality signals off the incoming request. */
export function tiktokRequestContext(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const read = (name: string) => {
    const m = cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  const forwarded = req.headers.get('x-forwarded-for') || '';
  return {
    ip: forwarded.split(',')[0].trim() || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    ttp: read('_ttp'),
    ttclid: read('ttclid'),
  };
}
