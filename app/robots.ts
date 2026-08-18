import type { MetadataRoute } from 'next';
import { SITE_URL, PRIVATE_PATHS } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Transactional and private areas. Keeping crawlers out of these avoids
      // wasting crawl budget on pages that can never rank.
      disallow: PRIVATE_PATHS.map(p => `${p}/`),
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
