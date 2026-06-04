import Link from 'next/link';

export default function OrderConfirmationPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: '#E8DDD3', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 2rem',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A882" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        {/* Heading */}
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem' }}>
          Order Received
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.2rem', lineHeight: 1.2 }}>
          Thank you for your order.
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.92rem', fontWeight: 300, color: '#9A8F87', lineHeight: 1.9, marginBottom: '2.5rem' }}>
          We've received your order and we're so excited to make something beautiful for you. You'll receive a confirmation email shortly, and we'll be in touch within 48 hours.
        </p>

        {/* Info boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '3rem', textAlign: 'left' }}>
          {[
            { label: 'Production Time', value: '2–4 weeks' },
            { label: 'Updates', value: 'Via email' },
            { label: 'Questions?', value: 'hello@bloomingdew.com' },
            { label: 'Made', value: 'By hand, with love' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '1.2rem', backgroundColor: '#FAF7F4', border: '1px solid #E8DDD3' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.4rem' }}>
                {label}
              </p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#2C2C2C' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" style={{
            padding: '1rem 2.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block',
          }}>
            Continue Shopping
          </Link>
          <Link href="/" style={{
            padding: '1rem 2.5rem', backgroundColor: 'transparent', color: '#2C2C2C',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
            border: '1px solid #E8DDD3', display: 'inline-block',
          }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
