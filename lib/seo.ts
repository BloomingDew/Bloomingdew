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

// ---------------------------------------------------------------------------
// Page metadata helper
//
// In the App Router a child's `openGraph` object REPLACES the parent's rather
// than merging, and the generated image from app/opengraph-image.tsx only
// attaches to segments that don't define their own block. Six pages set
// custom Open Graph and silently dropped the image — the shared link preview
// became a blank rectangle again, the exact failure the image exists to
// prevent. Composing metadata through this helper makes that mistake
// unrepresentable: the image is always included, so the next page anyone adds
// can't reintroduce the bug.
// ---------------------------------------------------------------------------

import type { Metadata } from 'next';

const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Bloomingdew — handcrafted clothing, made in Lagos',
};

export function pageMetadata(opts: {
  title: string;
  description: string;
  /** Site-relative canonical path, e.g. '/shop'. */
  path: string;
}): Metadata {
  const { title, description, path } = opts;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
