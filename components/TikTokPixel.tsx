'use client';

import Script from 'next/script';
import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { TIKTOK_PIXEL_ID } from '../lib/tiktok';

// The base snippet fires ttq.page() once on hard load. Everything after that is
// client-side navigation, so without this component /shop, product pages and
// checkout would never register a view.
function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The base snippet already counted the first page; skip it so the landing
  // page isn't double-counted.
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      window.ttq?.page();
    } catch {
      // Best-effort.
    }
  }, [pathname, searchParams]);

  return null;
}

export default function TikTokPixel() {
  return (
    <>
      <Script id="tiktok-pixel" strategy="afterInteractive">
        {`
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');
        `}
      </Script>
      {/* useSearchParams needs a boundary or it opts every page out of static rendering. */}
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
