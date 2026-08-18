import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import { getProductById } from '../../../lib/products';
import { getMadeToOrderSurchargePct, applySurcharge } from '../../../lib/made-to-order';
import { MADE_TO_ORDER_SIZES } from '../../../lib/sizes';
import { SITE_URL, absoluteUrl } from '../../../lib/seo';

type Params = { params: Promise<{ id: string }> };

/** The price the checkout would actually charge for a stocked size. */
function shelfPrice(product: { price: number; discount: number }): number {
  return product.discount > 0
    ? Math.round(product.price * (1 - product.discount / 100) * 100) / 100
    : product.price;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id)).catch(() => null);
  if (!product) return { title: 'Product not found' };

  // The stored description is the real copy shown on the page; fall back to a
  // factual sentence rather than keyword filler when a product has none.
  const description = (product.description || '').trim()
    || `${product.name} — handcrafted by Bloomingdew in Lagos and shipped worldwide.`;

  const canonical = `/products/${product.id}`;
  const image = product.images[0]?.url;

  return {
    title: product.name,
    description: description.slice(0, 300),
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: `${product.name} | Bloomingdew`,
      description: description.slice(0, 300),
      url: canonical,
      ...(image ? { images: [{ url: image, alt: product.images[0]?.alt_text || product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Bloomingdew`,
      description: description.slice(0, 300),
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function Page({ params }: Params) {
  const { id } = await params;
  const product = await getProductById(Number(id)).catch(() => null);
  if (!product) notFound();

  // Prices come from the same helpers the checkout uses, so a rich result can
  // never advertise a figure the basket contradicts.
  const surchargePct = await getMadeToOrderSurchargePct();
  const base = shelfPrice(product);
  const madeToOrder = applySurcharge(base, surchargePct);

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: (product.description || '').trim() || undefined,
    sku: String(product.id),
    url: absoluteUrl(`/products/${product.id}`),
    image: product.images.map(i => i.url),
    brand: { '@type': 'Brand', name: 'Bloomingdew' },
    ...(product.fabric ? { material: product.fabric } : {}),
    // Two price points are genuinely offered: the stocked sizes and the
    // made-to-order uplift. Declaring the range is honest about both.
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: base.toFixed(2),
      highPrice: madeToOrder.toFixed(2),
      offerCount: 1 + MADE_TO_ORDER_SIZES.length,
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/products/${product.id}`),
      seller: { '@type': 'Organization', name: 'Bloomingdew' },
    },
    // No aggregateRating: there are no reviews on this site, and inventing
    // them would breach Google's guidelines and mislead customers.
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: absoluteUrl('/shop') },
      ...(product.category
        ? [{ '@type': 'ListItem', position: 3, name: product.category, item: absoluteUrl(`/shop?category=${product.category_slug}`) }]
        : []),
      {
        '@type': 'ListItem',
        position: product.category ? 4 : 3,
        name: product.name,
        item: absoluteUrl(`/products/${product.id}`),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ProductClient />
    </>
  );
}
