import Link from 'next/link';
import NewsletterForm from './NewsletterForm';

const shopLinks = [
  { label: 'All Products', href: '/shop' },
  { label: 'Sets', href: '/shop?category=sets' },
  { label: 'Dresses', href: '/shop?category=dresses' },
  { label: 'Jumpsuits', href: '/shop?category=jumpsuits' },
  { label: 'Accessories', href: '/shop?category=accessories' },
];

const helpLinks = [
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'Shipping Info', href: '/about#shipping' },
  { label: 'Returns & Exchanges', href: '/about#returns' },
  { label: 'Custom Orders', href: '/about#custom' },
  { label: 'FAQ', href: '/about#faq' },
];

const companyLinks = [
  { label: 'Our Story', href: '/about' },
  { label: 'Contact Us', href: '/about#contact' },
  { label: 'Instagram', href: 'https://instagram.com' },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <p className="font-display text-xl tracking-[0.2em] font-semibold uppercase mb-3">
              Bloomingdew
            </p>
            <p className="text-sm text-warm-gray leading-relaxed">
              Handcrafted fashion for the modern woman. Every piece made with intention.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs tracking-widest uppercase mb-4 text-cream">Shop</h4>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-warm-gray hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-xs tracking-widest uppercase mb-4 text-cream">Help</h4>
            <ul className="space-y-2">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-warm-gray hover:text-cream transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs tracking-widest uppercase mb-4 text-cream">Stay in the Loop</h4>
            <p className="text-sm text-warm-gray mb-4">
              New arrivals, exclusive drops, and styling inspo — straight to your inbox.
            </p>
            <NewsletterForm dark />
            <div className="mt-4 flex gap-4">
              {companyLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs text-warm-gray hover:text-cream transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-warm-gray">
          <p>© {new Date().getFullYear()} Bloomingdew. All rights reserved.</p>
          <p>Made with care &mdash; every stitch, every seam.</p>
        </div>
      </div>
    </footer>
  );
}
