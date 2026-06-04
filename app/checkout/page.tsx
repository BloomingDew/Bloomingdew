'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', apartment: '', city: '', postcode: '', country: 'United Kingdom',
  });

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    await supabase.from('orders').insert({
      customer_name: `${shipping.firstName} ${shipping.lastName}`,
      customer_email: shipping.email,
      customer_phone: shipping.phone,
      shipping_address: {
        address: shipping.address,
        apartment: shipping.apartment,
        city: shipping.city,
        postcode: shipping.postcode,
        country: shipping.country,
      },
      items: items.map(i => ({ id: i.id, name: i.name, size: i.size, quantity: i.quantity, price: i.price })),
      subtotal: totalPrice,
      shipping_cost: shippingCost,
      total: orderTotal,
      status: 'pending',
    });
    clearCart();
    router.push('/order-confirmation');
  };

  const shippingCost = totalPrice >= 100 ? 0 : 5.95;
  const orderTotal = totalPrice + shippingCost;

  if (items.length === 0 && !loading) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', color: '#2C2C2C', marginBottom: '1rem' }}>
          Your bag is empty
        </h2>
        <Link href="/shop" style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em',
          textTransform: 'uppercase', padding: '1rem 2.5rem',
          backgroundColor: '#2C2C2C', color: '#FAF7F4', textDecoration: 'none', display: 'inline-block',
        }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C', textDecoration: 'none' }}>
          Bloomingdew
        </Link>
      </div>

      {/* Steps indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        {['Bag', 'Shipping', 'Payment'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: i === 0 ? '#C9A882' : step === 'payment' && i === 2 ? '#C9A882' : step === 'shipping' && i === 1 ? '#C9A882' : '#E8DDD3',
                fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#FAF7F4',
              }}>
                {i + 1}
              </div>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2C2C2C' }}>
                {s}
              </span>
            </div>
            {i < 2 && <div style={{ width: '40px', height: '1px', backgroundColor: '#E8DDD3' }} />}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '4rem', alignItems: 'start' }} className="checkout-grid">

        {/* Left — forms */}
        <div>
          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit}>
              <h2 style={sectionHeading}>Shipping Information</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="form-row">
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input required style={inputStyle} value={shipping.firstName} onChange={e => setShipping({ ...shipping, firstName: e.target.value })} placeholder="Jane" />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input required style={inputStyle} value={shipping.lastName} onChange={e => setShipping({ ...shipping, lastName: e.target.value })} placeholder="Doe" />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Email *</label>
                <input required type="email" style={inputStyle} value={shipping.email} onChange={e => setShipping({ ...shipping, email: e.target.value })} placeholder="jane@example.com" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={shipping.phone} onChange={e => setShipping({ ...shipping, phone: e.target.value })} placeholder="+44 7700 000000" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Address *</label>
                <input required style={inputStyle} value={shipping.address} onChange={e => setShipping({ ...shipping, address: e.target.value })} placeholder="123 Example Street" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Apartment, suite, etc. (optional)</label>
                <input style={inputStyle} value={shipping.apartment} onChange={e => setShipping({ ...shipping, apartment: e.target.value })} placeholder="Apt 4B" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="form-row">
                <div>
                  <label style={labelStyle}>City *</label>
                  <input required style={inputStyle} value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} placeholder="London" />
                </div>
                <div>
                  <label style={labelStyle}>Postcode *</label>
                  <input required style={inputStyle} value={shipping.postcode} onChange={e => setShipping({ ...shipping, postcode: e.target.value })} placeholder="SW1A 1AA" />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Country *</label>
                <select required style={inputStyle} value={shipping.country} onChange={e => setShipping({ ...shipping, country: e.target.value })}>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>France</option>
                  <option>Germany</option>
                  <option>Nigeria</option>
                  <option>Ghana</option>
                  <option>Other</option>
                </select>
              </div>

              <button type="submit" style={primaryBtn}>
                Continue to Payment
              </button>
            </form>
          )}

          {step === 'payment' && (
            <div>
              {/* Shipping summary */}
              <div style={{ padding: '1.5rem', backgroundColor: '#FAF7F4', border: '1px solid #E8DDD3', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87' }}>Shipping to</span>
                  <button onClick={() => setStep('shipping')} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C9A882', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #C9A882' }}>Edit</button>
                </div>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>
                  {shipping.firstName} {shipping.lastName} — {shipping.address}, {shipping.city}, {shipping.postcode}
                </p>
              </div>

              <h2 style={sectionHeading}>Payment</h2>

              {/* Payment placeholder */}
              <div style={{
                padding: '2rem', border: '2px dashed #E8DDD3', borderRadius: '2px',
                textAlign: 'center', marginBottom: '2rem', backgroundColor: '#FAFAFA',
              }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>
                  Payment coming soon
                </p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87', lineHeight: 1.7 }}>
                  Stripe payment integration will be added here. For now, place your order and we'll be in touch to arrange payment.
                </p>
              </div>

              {/* Terms */}
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 300, color: '#9A8F87', lineHeight: 1.7, marginBottom: '2rem' }}>
                By placing your order you agree to our terms of service. All pieces are made to order — please allow 2–4 weeks for production.
              </p>

              <button onClick={handlePlaceOrder} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Placing Order...' : `Place Order — £${orderTotal.toFixed(2)}`}
              </button>
            </div>
          )}
        </div>

        {/* Right — order summary */}
        <div style={{ position: 'sticky', top: '120px', backgroundColor: '#FAF7F4', border: '1px solid #E8DDD3', padding: '2rem' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' }}>
            Order Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem' }}>
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{
                  width: '64px', height: '80px', flexShrink: 0,
                  background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    backgroundColor: '#2C2C2C', color: '#FAF7F4',
                    borderRadius: '50%', width: '20px', height: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Jost', sans-serif", fontSize: '0.65rem',
                  }}>
                    {item.quantity}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.2rem' }}>{item.name}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>Size: {item.size}</p>
                </div>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{item.price}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #E8DDD3', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={summaryLabel}>Subtotal</span>
              <span style={summaryValue}>£{totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={summaryLabel}>Shipping</span>
              <span style={summaryValue}>{shippingCost === 0 ? 'Free' : `£${shippingCost.toFixed(2)}`}</span>
            </div>
            {shippingCost === 0 && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C9A882' }}>
                Free shipping on orders over £100 ✓
              </p>
            )}
            <div style={{ borderTop: '1px solid #E8DDD3', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C' }}>Total</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 500, color: '#2C2C2C' }}>£{orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif", fontSize: '1.3rem',
  fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#9A8F87', marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem',
  backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
  color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
  fontSize: '0.88rem', fontWeight: 300, outline: 'none',
  appearance: 'none', marginBottom: '0',
};

const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '1.1rem',
  backgroundColor: '#2C2C2C', color: '#FAF7F4',
  fontFamily: "'Jost', sans-serif", fontSize: '0.8rem',
  letterSpacing: '0.18em', textTransform: 'uppercase',
  border: 'none', cursor: 'pointer',
};

const summaryLabel: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87',
};

const summaryValue: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C',
};
