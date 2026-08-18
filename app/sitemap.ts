import type { MetadataRoute } from 'next';
import { supabaseService } from '../lib/admin-server';
import { SITE_URL } from '../lib/seo';

// Public pages only. Checkout, account, wishlist, order confirmation and the
// whole admin are deliberately absent — they are transactional or private and
// have nothing to offer a search result.
export const revalidate = 3600;

// No lastModified on static routes: a build timestamp is not a content
// timestamp, and claiming every page changed at the moment of deploy tells a
// crawler something false. An absent lastmod is more honest than a
// fabricated one.
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
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      changeFrequency,
      priority,
    }),
  );

  // Generated from the live catalogue, so a new piece appears without a code
  // change and a withdrawn one drops out. lastModified is the product's own
  // created_at — the truest per-product date the schema holds (there is no
  // updated_at column yet).
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabaseService
      .from('products')
      .select('id, created_at')
      .eq('available', true);
    productEntries = (data || []).map(p => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // A database blip should yield a smaller sitemap, not a 500.
  }

  return [...staticEntries, ...productEntries];
}
