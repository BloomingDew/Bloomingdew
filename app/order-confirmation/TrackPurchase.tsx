'use client';

import { useEffect, useRef } from 'react';
import { trackTikTok } from '../../lib/tiktok';

// Browser-side CompletePayment. The confirmation page only receives an order
// id, so the real total is fetched before firing — an event without revenue
// can't drive value-based ad optimisation, which is the whole point.
//
// event_id is the order id, matching what the payment route sends server-side.
// TikTok keeps whichever copy arrives first, so a refresh of this page (or the
// server event beating the browser) never double-counts a sale.
export default function TrackPurchase({ orderId }: { orderId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    let cancelled = false;
    fetch(`/api/orders/tracking?ref=${encodeURIComponent(orderId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(order => {
        if (cancelled || !order) return;
        trackTikTok(
          'CompletePayment',
          {
            contents: order.contents,
            value: order.total,
            currency: 'USD',
          },
          order.orderId,
        );
      })
      .catch(() => {
        // Best-effort: the server-side event still covers this sale.
      });

    return () => { cancelled = true; };
  }, [orderId]);

  return null;
}
