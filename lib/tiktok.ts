// TikTok Pixel — browser-side event helpers.
//
// The pixel ID is public by design (it ships in client JS), so the literal is a
// safe fallback; the env var only exists so the ID can be swapped without a
// code change. Values are reported in USD — our DB base currency — rather than
// the visitor's displayed currency, so TikTok's revenue figures stay consistent
// regardless of where the buyer is.

export const TIKTOK_PIXEL_ID =
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || 'D9T2LRRC77U97D5QI9O0';

type Ttq = {
  page: () => void;
  track: (event: string, params?: Record<string, unknown>, opts?: { event_id?: string }) => void;
  identify: (params: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    ttq?: Ttq;
  }
}

export type TikTokContent = {
  content_id: string;
  content_name: string;
  content_type: 'product';
  price: number;
  quantity: number;
};

/**
 * Fire a pixel event. Never throws: analytics must not be able to break a
 * checkout. Silently no-ops if the script hasn't loaded (blocked, offline, or
 * still downloading) — those events are exactly the ones the server-side
 * Events API is there to recover.
 */
export function trackTikTok(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
) {
  try {
    if (typeof window === 'undefined' || !window.ttq) return;
    window.ttq.track(event, params ?? {}, eventId ? { event_id: eventId } : undefined);
  } catch {
    // Ignore — analytics is best-effort.
  }
}

/**
 * Attach identifiers to the current visitor for match-quality purposes. The
 * pixel normalises and SHA-256 hashes these in the browser; raw values never
 * leave the page.
 */
export function identifyTikTok(params: { email?: string; phone?: string }) {
  try {
    if (typeof window === 'undefined' || !window.ttq) return;
    const payload: Record<string, unknown> = {};
    if (params.email) payload.email = params.email.trim().toLowerCase();
    if (params.phone) payload.phone_number = params.phone.replace(/[^\d+]/g, '');
    if (Object.keys(payload).length) window.ttq.identify(payload);
  } catch {
    // Ignore — analytics is best-effort.
  }
}

/** Build a `contents` array from cart-shaped lines. */
export function toContents(
  lines: Array<{ id: number | string; name: string; priceUsd: number; quantity: number }>,
): TikTokContent[] {
  return lines.map(l => ({
    content_id: String(l.id),
    content_name: l.name,
    content_type: 'product' as const,
    price: Number(l.priceUsd.toFixed(2)),
    quantity: l.quantity,
  }));
}
