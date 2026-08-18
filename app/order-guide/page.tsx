import Link from 'next/link';
import { SIZE_GUIDE } from '../../lib/sizes';
import { pageMetadata } from '../../lib/seo';

export const metadata = pageMetadata({
  title: 'Order Guide',
  description:
    'How to order from Bloomingdew: the size guide for 12–18, delivery timelines for ready-to-wear and made-to-order pieces, where we ship, and our returns position.',
  path: '/order-guide',
});

export default function OrderGuidePage() {
  return (
    <div>

      {/* Hero */}
      <section style={{
        padding: '6rem 2rem 5rem',
        textAlign: 'center',
        borderBottom: '1px solid #E8DDD3',
      }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.72rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#C9A882',
          marginBottom: '1rem',
        }}>
          Ordering with Bloomingdew
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 4vw, 3.2rem)',
          fontWeight: 500,
          color: '#2C2C2C',
          lineHeight: 1.2,
          marginBottom: '1.2rem',
        }}>
          Order Guide
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.95rem',
          fontWeight: 300,
          color: '#9A8F87',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          Everything you need to know before placing your order — sizing, timelines, shipping, and returns.
        </p>
      </section>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '5rem 2rem 7rem' }}>

        {/* Size guide */}
        <div style={{ marginBottom: '5rem' }}>
          <h2 style={sectionHeading}>Size Guide</h2>
          <p style={bodyText}>
            All our pieces are designed with a relaxed, inclusive fit. We recommend measuring yourself and comparing to the chart below. Measurements are in inches. If you're between sizes, size up — or reach out for a custom fit.
          </p>

          <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E8DDD3' }}>
                  {['Size', 'Burst', 'Waist', 'Hip'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 500, color: '#2C2C2C', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map(({ size, bust, waist, hip }) => [size, String(bust), String(waist), String(hip)]).map(([size, burst, waist, hip], i) => (
                  <tr key={size} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAF7F4', borderBottom: '1px solid #E8DDD3' }}>
                    {[size, burst, waist, hip].map((val, j) => (
                      <td key={j} style={{ padding: '0.85rem 1rem', color: j === 0 ? '#2C2C2C' : '#9A8F87', fontWeight: j === 0 ? 500 : 300 }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ ...bodyText, marginTop: '1.2rem', fontSize: '0.8rem', color: '#9A8F87' }}>
            Need a size outside 12&ndash;18? <a href="/custom?tab=made-to-order" style={{ color: '#C9A882', borderBottom: '1px solid #C9A882' }}>Made for You</a> covers made-to-order and fully custom pieces.
          </p>
        </div>

        <div style={{ borderTop: '1px solid #E8DDD3' }} />

        {/* How to order */}
        <div style={{ margin: '5rem 0' }}>
          <h2 style={sectionHeading}>How to Order</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}>
            {[
              { step: '1', text: 'Browse the shop and select your piece, size, and quantity.' },
              { step: '2', text: 'Add to bag and proceed to checkout. You\'ll receive a confirmation email immediately.' },
              { step: '3', text: 'Ready-to-wear pieces are available within 3–7 days. For custom orders, please allow 7–10 days for production and delivery.' },
              { step: '4', text: 'Once dispatched, you\'ll receive a dispatch notification with tracking details — international orders travel with DHL, and orders within Nigeria with GIG.' },
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.4rem',
                  color: '#E8DDD3',
                  lineHeight: 1,
                  flexShrink: 0,
                  width: '28px',
                }}>
                  {step}
                </span>
                <p style={bodyText}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #E8DDD3' }} />

        {/* Shipping */}
        <div style={{ margin: '5rem 0' }}>
          <h2 style={sectionHeading}>Shipping</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            {/* Delivery times are quoted for Nigeria only — outside it, transit
                depends on the destination and customs, so we name where we
                deliver rather than promise a window we don't control. */}
            {[
              { label: 'Lagos & Abuja', value: '2–4 business days after dispatch' },
              { label: 'Other States in Nigeria', value: '3–6 business days after dispatch' },
              { label: 'West Africa', value: 'Delivered with DHL' },
              { label: 'Worldwide', value: 'Delivered with DHL' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '1rem 0',
                borderBottom: '1px solid #E8DDD3',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#2C2C2C' }}>{label}</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #E8DDD3' }} />

        {/* Returns */}
        <div style={{ marginTop: '5rem' }}>
          <h2 style={sectionHeading}>Returns &amp; Exchanges</h2>
          <p style={{ ...bodyText, marginTop: '1.5rem' }}>
            All Bloomingdew purchases are final sale and are not eligible for return or exchange — this includes sale, promotional and discounted items, as well as all bespoke and made-to-measure pieces.
          </p>
          <p style={{ ...bodyText, marginTop: '1rem' }}>
            If your item arrives incorrect, damaged in transit, or with a confirmed manufacturing defect, please contact us within 48 hours of delivery with your order number and clear photographs. Once verified, we&apos;ll determine the appropriate resolution.
          </p>
          <p style={{ ...bodyText, marginTop: '1rem' }}>
            Please don&apos;t send anything back before contacting us — unauthorized returns may not be accepted. Read the full{' '}
            <Link href="/refund-policy" style={{ color: '#2C2C2C', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
              Refund, Return &amp; Exchange Policy
            </Link>.
          </p>
        </div>

      </div>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: '1.5rem',
  fontWeight: 500,
  color: '#2C2C2C',
  marginBottom: '1rem',
  marginTop: '3rem',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontSize: '0.92rem',
  fontWeight: 300,
  color: '#5C5450',
  lineHeight: 1.9,
};
