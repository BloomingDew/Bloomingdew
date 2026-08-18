import type { MetadataRoute } from 'next';
import { getProducts } from '../lib/products';
import { SITE_URL } from '../lib/seo';

// Public pages only. Checkout, account, wishlist, order confirmation and the
// whole admin are deliberately absent — they are transactional or private and
// have nothing to offer a search result.
export const revalidate = 3600;

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/custom', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/order-guide', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Generated from the live catalogue, so a new piece appears without a code
  // change and a withdrawn one drops out.
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productEntries = products.map(p => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // A database blip should yield a smaller sitemap, not a 500.
  }

  return [...staticEntries, ...productEntries];
}
