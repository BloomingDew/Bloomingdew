import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import SiteShell from '../components/SiteShell';
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from '../lib/seo';

// This layout is intentionally a SERVER component. Metadata is only honoured
// when exported from a layout.tsx or page.tsx, and never from a client one —
// which is why the site previously had no title tag anywhere.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Bloomingdew | Handcrafted Clothing, Made in Lagos',
    // Pages set only their own name; this supplies the brand.
    template: '%s | Bloomingdew',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    url: SITE_URL,
    title: 'Bloomingdew | Handcrafted Clothing, Made in Lagos',
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bloomingdew | Handcrafted Clothing, Made in Lagos',
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

// Organization markup, sitewide. Only claims that are true and verifiable:
// no ratings, no invented awards.
const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: DEFAULT_DESCRIPTION,
  email: 'info@bloomingdew.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Lagos',
    addressCountry: 'NG',
  },
  sameAs: ['https://www.instagram.com/bloomingdeww/'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <SiteShell>{children}</SiteShell>
        <Analytics />
        <SpeedInsights />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
      </body>
    </html>
  );
}
