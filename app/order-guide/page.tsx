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
                {[
                  ['6',  '34', '26', '36'],
                  ['8',  '36', '28', '38'],
                  ['10', '38', '30', '40'],
                  ['12', '40', '32', '42'],
                  ['14', '42', '34', '44'],
                  ['16', '44', '36', '46'],
                  ['18', '46', '38', '48'],
                  ['20', '48', '40', '50'],
                ].map(([size, burst, waist, hip], i) => (
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
            Not sure? <a href="/custom" style={{ color: '#C9A882', borderBottom: '1px solid #C9A882' }}>Request a custom order</a> and we'll make it to your exact measurements.
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
              { step: '3', text: 'Your order goes into production — each piece is made to order so please allow 2–4 weeks.' },
              { step: '4', text: 'Once complete, your piece is carefully packed and dispatched with tracking.' },
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
            {[
              { label: 'Lagos & Abuja', value: '2–4 business days after dispatch · Free over ₦50,000' },
              { label: 'Other States', value: '3–6 business days after dispatch · ₦3,500' },
              { label: 'West Africa', value: '7–10 business days after dispatch · ₦15,000' },
              { label: 'International', value: '10–14 business days after dispatch · ₦25,000' },
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
          <h2 style={sectionHeading}>Returns & Exchanges</h2>
          <p style={{ ...bodyText, marginTop: '1.5rem' }}>
            Because every piece is made to order, we are unable to accept returns unless the item arrives damaged or faulty. If there is an issue with your order, please contact us within 7 days of receiving it and we'll make it right.
          </p>
          <p style={{ ...bodyText, marginTop: '1rem' }}>
            For custom orders, all sales are final once production has begun.
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
