// Shared SEO constants.
//
// The apex 308-redirects to www, so every canonical, sitemap entry and
// structured-data URL must use www — pointing at the apex would make every
// canonical a redirect, which weakens the signal it exists to give.

export const SITE_URL = 'https://www.bloomingdew.com';
export const SITE_NAME = 'Bloomingdew';

export const DEFAULT_DESCRIPTION =
  'Handcrafted clothing made in Lagos and shipped worldwide. Ready-to-wear pieces in sizes 12–18, with made-to-order and fully bespoke options for everything else.';

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = '/'): string {
  return path === '/' ? SITE_URL : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Paths kept out of the index: private, transactional, or user-specific. */
export const PRIVATE_PATHS = [
  '/admin',
  '/checkout',
  '/account',
  '/wishlist',
  '/order-confirmation',
  '/api',
];
