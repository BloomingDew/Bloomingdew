import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Brand Story */}
      <section className="mb-20">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Our Story</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-8">
          About Bloomingdew
        </h1>
        <div className="prose-custom space-y-5 text-charcoal text-sm leading-relaxed max-w-2xl">
          <p>
            Bloomingdew was built on a simple belief: every woman deserves clothing that fits her
            perfectly — not just in size, but in spirit. Clothing that makes her feel seen, powerful,
            and exactly like herself.
          </p>
          <p>
            We design and handcraft each piece with intention — using premium fabrics, thoughtful
            silhouettes, and care in every stitch. Our collections span sets, dresses, jumpsuits,
            and accessories, all designed to work for real women living real lives.
          </p>
          <p>
            Whether you&apos;re ordering a ready-to-wear piece or commissioning something made
            entirely to your measurements, you&apos;re getting something made with love.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-20">
        <h2 className="font-display text-2xl font-semibold mb-8">What We Stand For</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: 'Quality Over Quantity',
              desc: 'We don\'t mass-produce. Every piece is crafted to order, ensuring the highest quality and minimal waste.',
            },
            {
              title: 'Inclusive Sizing',
              desc: 'Sizes XS to 3XL, plus custom made-to-measure for every body. Fashion should be for everyone.',
            },
            {
              title: 'Made with Care',
              desc: 'Thoughtful craftsmanship in every seam. We take pride in the details because the details are what you feel.',
            },
          ].map((v) => (
            <div key={v.title} className="border-t-2 border-gold pt-5">
              <h3 className="text-sm font-semibold mb-2">{v.title}</h3>
              <p className="text-xs text-warm-gray leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Orders */}
      <section id="custom" className="mb-20 bg-charcoal text-cream p-8 sm:p-12">
        <h2 className="font-display text-2xl font-semibold mb-4">Custom Orders</h2>
        <p className="text-cream/75 text-sm leading-relaxed mb-4">
          Every Bloomingdew piece can be made to your exact measurements. Custom orders are perfect
          if you fall between sizes, want a different length, or need a specific colour not listed.
        </p>
        <p className="text-cream/75 text-sm leading-relaxed mb-4">
          To place a custom order, simply select &quot;Custom&quot; as your size on any product page
          and include your measurements in the order notes. We&apos;ll reach out to confirm before
          we start production.
        </p>
        <ul className="text-cream/75 text-sm space-y-1 mb-6">
          <li>— Production time: 10–21 business days</li>
          <li>— Include: Bust, Waist, Hip, Height, and any specific notes</li>
          <li>— Custom pieces are non-refundable but we guarantee fit satisfaction</li>
        </ul>
        <Link
          href="/size-guide"
          className="inline-block border border-cream text-cream text-xs tracking-widest uppercase px-6 py-3 hover:bg-cream hover:text-charcoal transition-colors"
        >
          View Size Guide →
        </Link>
      </section>

      {/* Shipping */}
      <section id="shipping" className="mb-20">
        <h2 className="font-display text-2xl font-semibold mb-6">Shipping</h2>
        <div className="space-y-5 text-sm">
          {[
            { region: 'Lagos', time: '2–4 business days' },
            { region: 'Nigeria (Interstate)', time: '5–7 business days' },
            { region: 'Africa (excluding Nigeria)', time: '7–12 business days' },
            { region: 'UK & Europe', time: '10–15 business days' },
            { region: 'USA & Canada', time: '10–15 business days' },
            { region: 'Rest of World', time: '12–21 business days' },
          ].map((s) => (
            <div key={s.region} className="flex justify-between border-b border-border pb-3">
              <span className="text-charcoal">{s.region}</span>
              <span className="text-warm-gray">{s.time}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-warm-gray mt-4">
          Free shipping on all orders over $150. International duties and taxes are the
          responsibility of the customer.
        </p>
      </section>

      {/* Returns */}
      <section id="returns" className="mb-20">
        <h2 className="font-display text-2xl font-semibold mb-4">Returns & Exchanges</h2>
        <div className="space-y-4 text-sm text-charcoal leading-relaxed">
          <p>
            Ready-to-wear items can be returned within 14 days of receipt for a store credit or
            exchange. Items must be unworn, unwashed, and have all tags attached.
          </p>
          <p>
            Custom made-to-measure orders are non-refundable. If there is a fit issue with your
            custom order, please contact us within 7 days of receiving and we will work with you to
            resolve it.
          </p>
          <p>
            To start a return, email us at{' '}
            <a href="mailto:hello@bloomingdew.com" className="underline hover:text-gold transition-colors">
              hello@bloomingdew.com
            </a>{' '}
            with your order number and reason for return.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mb-20">
        <h2 className="font-display text-2xl font-semibold mb-8">FAQ</h2>
        <div className="space-y-6">
          {[
            {
              q: 'How long does production take?',
              a: 'Ready-to-wear orders ship within 2–5 business days. Custom orders take 10–21 business days before dispatch.',
            },
            {
              q: 'Can I pay in Naira (₦)?',
              a: 'Currently we accept USD payments via card. We are working on adding Naira payment options. Please contact us if you need an alternative.',
            },
            {
              q: 'What fabrics do you use?',
              a: 'We use premium fabrics including silk, chiffon, crepe, linen, and suiting fabrics. Each product page lists the specific fabric composition.',
            },
            {
              q: 'Do you do wholesale?',
              a: 'Yes! We are open to wholesale and boutique partnerships. Please reach out via email with your inquiry.',
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-border pb-5">
              <p className="text-sm font-medium mb-2">{faq.q}</p>
              <p className="text-sm text-warm-gray leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact">
        <h2 className="font-display text-2xl font-semibold mb-4">Contact Us</h2>
        <p className="text-sm text-warm-gray leading-relaxed mb-4">
          Have a question or want to discuss a custom order? We&apos;d love to hear from you.
        </p>
        <div className="space-y-2 text-sm">
          <p>
            Email:{' '}
            <a href="mailto:hello@bloomingdew.com" className="underline hover:text-gold transition-colors">
              hello@bloomingdew.com
            </a>
          </p>
          <p>
            Instagram:{' '}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold transition-colors">
              @bloomingdew
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
