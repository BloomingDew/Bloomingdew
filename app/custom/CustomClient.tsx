'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getProducts, type Product } from '../../lib/products';
import { MADE_TO_ORDER_SIZES, STOCKED_SIZES } from '../../lib/sizes';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';

const steps = [
  {
    number: '01',
    title: 'Tell us your vision',
    body: 'Fill in the enquiry form below with your ideas — the occasion, the silhouette, fabrics you love, anything that inspires you.',
  },
  {
    number: '02',
    title: 'We connect',
    body: "Within 48 hours we'll be in touch to discuss your vision in detail, talk through options and agree on a direction.",
  },
  {
    number: '03',
    title: 'Your piece is made',
    body: "Once we've agreed on everything, your garment is handmade from scratch. Please allow 7–10 days for production and delivery.",
  },
  {
    number: '04',
    title: 'Delivered to you',
    body: 'Your finished piece is carefully packaged and sent directly to your door — made for you, no one else.',
  },
];

type Tab = 'custom' | 'made-to-order';

export default function CustomPage() {
  const [tab, setTab] = useState<Tab>('custom');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', occasion: '', vision: '', budget: '',
    bust: '', waist: '', hips: '', height: '', shoulder: '', inseam: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'custom', first_name: form.firstName, last_name: form.lastName, email: form.email, occasion: form.occasion, message: form.vision, budget: form.budget, measurements: { bust: form.bust, waist: form.waist, hips: form.hips, height: form.height, shoulder: form.shoulder, inseam: form.inseam } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again or email info@bloomingdew.com.');
        return;
      }
      setSent(true);
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Made-to-order state. Deep links from a product page arrive as
  // ?tab=made-to-order&product=<id>, so the piece is preselected.
  const [products, setProducts] = useState<Product[]>([]);
  const [mtoForm, setMtoForm] = useState({
    productId: '', size: '', firstName: '', lastName: '', email: '', phone: '',
    colour: '', notes: '',
    bust: '', waist: '', hips: '', height: '', shoulder: '', inseam: '',
  });
  const [mtoSent, setMtoSent] = useState(false);
  const [mtoAdded, setMtoAdded] = useState(false);
  const [surchargePct, setSurchargePct] = useState(20);
  const { addItem } = useCart();
  const { format } = useCurrency();
  const [mtoLoading, setMtoLoading] = useState(false);
  const [mtoError, setMtoError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'made-to-order') setTab('made-to-order');
    const product = params.get('product');
    if (product) setMtoForm(prev => ({ ...prev, productId: product }));
  }, []);

  useEffect(() => {
    getProducts().then(setProducts).catch(() => setProducts([]));
    // Display only — the charge is recomputed server-side at payment.
    fetch('/api/made-to-order')
      .then(r => r.json())
      .then(d => { if (Number.isFinite(d?.surchargePct)) setSurchargePct(d.surchargePct); })
      .catch(() => {});
  }, []);

  const selectedProduct = products.find(p => String(p.id) === mtoForm.productId) || null;
  // Measurements only matter when no standard size fits.
  const needsMeasurements = mtoForm.size === 'custom';

  // A named size can be bought outright. "My measurements" still has to be an
  // enquiry — we can't price a garment before seeing the measurements.
  const canAddToBag = !!selectedProduct && !!mtoForm.size && mtoForm.size !== 'custom';

  const shelfPrice = selectedProduct
    ? (selectedProduct.discount > 0
        ? selectedProduct.price * (1 - selectedProduct.discount / 100)
        : selectedProduct.price)
    : 0;
  const madeToOrderPrice = Math.round(shelfPrice * (1 + surchargePct / 100) * 100) / 100;

  const handleAddMtoToBag = async () => {
    if (!selectedProduct || !canAddToBag) return;
    setMtoError('');
    const colour = selectedProduct.colours.find(c => c.name === mtoForm.colour) || null;
    const result = await addItem({
      id: selectedProduct.id,
      name: selectedProduct.name,
      priceUsd: madeToOrderPrice,
      size: mtoForm.size,
      quantity: 1,
      // No stock is held for these sizes — the piece is cut to order — so the
      // cart must not try to reserve one.
      madeToOrder: true,
      colourId: colour ? colour.id : null,
      colourName: colour ? colour.name : null,
    });
    if (!result.success) {
      setMtoError(result.message || 'Could not add this piece to your bag.');
      return;
    }
    setMtoAdded(true);
    setTimeout(() => setMtoAdded(false), 2500);
  };

  const handleMtoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMtoLoading(true);
    setMtoError('');
    try {
      const piece = selectedProduct ? `${selectedProduct.name} (#${selectedProduct.id})` : 'Not specified';
      const sizeLabel = mtoForm.size === 'custom' ? 'Custom measurements' : `Size ${mtoForm.size}`;
      const message = [
        `Piece: ${piece}`,
        `Requested size: ${sizeLabel}`,
        mtoForm.colour ? `Colour preference: ${mtoForm.colour}` : null,
        mtoForm.notes ? `Notes: ${mtoForm.notes}` : null,
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'made-to-order',
          first_name: mtoForm.firstName,
          last_name: mtoForm.lastName,
          email: mtoForm.email,
          phone: mtoForm.phone,
          subject: selectedProduct ? `Made to order — ${selectedProduct.name}` : 'Made to order',
          occasion: sizeLabel,
          message,
          measurements: needsMeasurements
            ? { bust: mtoForm.bust, waist: mtoForm.waist, hips: mtoForm.hips, height: mtoForm.height, shoulder: mtoForm.shoulder, inseam: mtoForm.inseam }
            : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMtoError(data.error || 'Something went wrong. Please try again or email info@bloomingdew.com.');
        return;
      }
      setMtoSent(true);
    } catch {
      setMtoError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setMtoLoading(false);
    }
  };

  return (
    <div>

      {/* Hero */}
      <section style={{
        height: '55vh',
        background: 'linear-gradient(135deg, #E8DDD3 0%, #D4C4B5 60%, #C9A882 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.72rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#9A8F87',
            marginBottom: '1.2rem',
          }}>
            Bespoke Service
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 500,
            color: '#2C2C2C',
            lineHeight: 1.2,
            marginBottom: '1.5rem',
          }}>
            Something made<br />just for you.
          </h1>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 300,
            color: '#5C5450',
            maxWidth: '480px',
            margin: '0 auto',
            lineHeight: 1.8,
          }}>
            Can't find exactly what you're looking for? We create custom pieces tailored to your measurements, style, and occasion.
          </p>
        </div>
      </section>

      {/* Tab switcher */}
      <section style={{ padding: '3rem 2rem 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {([
            { key: 'custom' as Tab, label: 'Custom', caption: 'Designed from scratch', icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
              </svg>
            ) },
            { key: 'made-to-order' as Tab, label: 'Made to Order', caption: 'Our pieces, your size', icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10a1 1 0 001 1h10a1 1 0 001-1V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
              </svg>
            ) },
          ]).map(({ key, label, caption, icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  padding: '1.4rem 1rem', cursor: 'pointer',
                  backgroundColor: active ? '#2C2C2C' : 'transparent',
                  color: active ? '#FAF7F4' : '#2C2C2C',
                  border: `1px solid ${active ? '#2C2C2C' : '#E8DDD3'}`,
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                {icon}
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', fontWeight: 300, color: active ? '#C9A882' : '#9A8F87' }}>{caption}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      {tab === 'custom' && (
      <section style={{ padding: '7rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.8rem',
            fontWeight: 500,
            color: '#2C2C2C',
            textAlign: 'center',
            marginBottom: '5rem',
          }}>
            How it works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '3rem',
          }}>
            {steps.map((step) => (
              <div key={step.number}>
                <p style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '2.5rem',
                  fontWeight: 400,
                  color: '#E8DDD3',
                  marginBottom: '1rem',
                  lineHeight: 1,
                }}>
                  {step.number}
                </p>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: '#2C2C2C',
                  marginBottom: '0.75rem',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: 300,
                  color: '#9A8F87',
                  lineHeight: 1.8,
                }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      )}

      {/* Enquiry form */}
      {tab === 'custom' && (
      <section style={{
        padding: '7rem 2rem',
        backgroundColor: '#2C2C2C',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.72rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#C9A882',
            marginBottom: '1rem',
            textAlign: 'center',
          }}>
            Get Started
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem',
            fontWeight: 500,
            color: '#FAF7F4',
            textAlign: 'center',
            marginBottom: '3rem',
          }}>
            Custom Enquiry
          </h2>

          {sent ? (
            <div style={{ padding: '2rem', backgroundColor: 'rgba(250,247,244,0.1)', border: '1px solid #9A8F8740', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#FAF7F4', marginBottom: '0.5rem' }}>Enquiry received.</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>{"We'll be in touch within 48 hours."}</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }} className="form-row">
              <div>
                <label style={labelStyle}>First Name</label>
                <input required style={inputStyle} type="text" placeholder="Jane" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input style={inputStyle} type="text" placeholder="Doe" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input required style={inputStyle} type="email" placeholder="jane@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div>
              <label style={labelStyle}>Occasion</label>
              <select style={inputStyle} value={form.occasion} onChange={e => setForm({...form, occasion: e.target.value})}>
                <option value="">Select an occasion</option>
                <option>Wedding / Bridal</option>
                <option>Event / Gala</option>
                <option>Birthday</option>
                <option>Everyday wear</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Tell us about your vision</label>
              <textarea
                required style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
                placeholder="Describe the piece you have in mind — silhouette, colours, fabrics, anything that inspires you..."
                value={form.vision} onChange={e => setForm({...form, vision: e.target.value})}
              />
            </div>

            {/* Measurements */}
            <div style={{ paddingTop: '0.5rem' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem', borderBottom: '1px solid #9A8F8730', paddingBottom: '0.75rem' }}>
                Your Measurements (cm)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }} className="form-row">
                <div><label style={labelStyle}>Bust</label><input style={inputStyle} type="text" placeholder="e.g. 88" value={form.bust} onChange={e => setForm({...form, bust: e.target.value})} /></div>
                <div><label style={labelStyle}>Waist</label><input style={inputStyle} type="text" placeholder="e.g. 70" value={form.waist} onChange={e => setForm({...form, waist: e.target.value})} /></div>
                <div><label style={labelStyle}>Hips</label><input style={inputStyle} type="text" placeholder="e.g. 96" value={form.hips} onChange={e => setForm({...form, hips: e.target.value})} /></div>
                <div><label style={labelStyle}>Height</label><input style={inputStyle} type="text" placeholder="e.g. 165" value={form.height} onChange={e => setForm({...form, height: e.target.value})} /></div>
                <div><label style={labelStyle}>Shoulder Width</label><input style={inputStyle} type="text" placeholder="e.g. 38" value={form.shoulder} onChange={e => setForm({...form, shoulder: e.target.value})} /></div>
                <div><label style={labelStyle}>Inseam (if applicable)</label><input style={inputStyle} type="text" placeholder="e.g. 74" value={form.inseam} onChange={e => setForm({...form, inseam: e.target.value})} /></div>
              </div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 300, color: '#9A8F87', marginTop: '0.75rem', lineHeight: 1.7 }}>
                Not sure how to measure? See our <a href="/order-guide" style={{ color: '#C9A882', borderBottom: '1px solid #C9A882' }}>Order Guide</a>.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Budget (optional)</label>
              <input style={inputStyle} type="text" placeholder="e.g. ₦80,000–₦150,000" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} />
            </div>

            {error && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} style={{
              marginTop: '0.5rem',
              padding: '1.1rem',
              backgroundColor: '#C9A882',
              color: '#2C2C2C',
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.78rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 400,
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sending...' : 'Send Enquiry'}
            </button>
          </form>
          )}
        </div>
      </section>
      )}

      {/* Made to order */}
      {tab === 'made-to-order' && (
      <section style={{ padding: '5rem 2rem 7rem', backgroundColor: '#2C2C2C' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem', textAlign: 'center' }}>
            Our pieces, your size
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#FAF7F4', textAlign: 'center', marginBottom: '1rem' }}>
            Made to Order
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#9A8F87', textAlign: 'center', lineHeight: 1.8, marginBottom: '3rem' }}>
            We stock sizes {STOCKED_SIZES[0]}&ndash;{STOCKED_SIZES[STOCKED_SIZES.length - 1]}. If yours falls outside that, choose the piece you love and we&apos;ll make it to your size. Made-to-order pieces carry a 20&ndash;25% additional cost and take 7&ndash;10 days.
          </p>

          {mtoSent ? (
            <div style={{ padding: '2rem', backgroundColor: 'rgba(250,247,244,0.1)', border: '1px solid #9A8F8740', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#FAF7F4', marginBottom: '0.5rem' }}>Request received.</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
                {"We'll confirm your size, price and timeline within 48 hours."}
              </p>
            </div>
          ) : (
          <form onSubmit={handleMtoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={labelStyle}>Which piece?</label>
              <select
                required
                style={{ ...inputStyle, ...selectStyle }}
                value={mtoForm.productId}
                onChange={e => setMtoForm({ ...mtoForm, productId: e.target.value, colour: '' })}
              >
                <option value="" disabled style={optionStyle}>Select a piece</option>
                {products.map(p => (
                  <option key={p.id} value={String(p.id)} style={optionStyle}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Your size</label>
              <select
                required
                style={{ ...inputStyle, ...selectStyle }}
                value={mtoForm.size}
                onChange={e => setMtoForm({ ...mtoForm, size: e.target.value })}
              >
                <option value="" disabled style={optionStyle}>Select a size</option>
                {MADE_TO_ORDER_SIZES.map(size => (
                  <option key={size} value={size} style={optionStyle}>UK {size}</option>
                ))}
                <option value="custom" style={optionStyle}>My measurements (none of the above)</option>
              </select>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', fontWeight: 300, color: '#9A8F87', marginTop: '0.5rem' }}>
                Sizes {STOCKED_SIZES.join(', ')} are available to buy directly from the shop.
              </p>
            </div>

            {selectedProduct?.has_colours && selectedProduct.colours.length > 0 && (
              <div>
                <label style={labelStyle}>Colour</label>
                <select
                  style={{ ...inputStyle, ...selectStyle }}
                  value={mtoForm.colour}
                  onChange={e => setMtoForm({ ...mtoForm, colour: e.target.value })}
                >
                  <option value="" style={optionStyle}>No preference</option>
                  {selectedProduct.colours.map(c => (
                    <option key={c.id} value={c.name} style={optionStyle}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Price breakdown — shown as soon as a buyable size is chosen, so
                the uplift is never a surprise at checkout. */}
            {canAddToBag && selectedProduct && (
              <div style={{ border: '1px solid #9A8F8740', padding: '1.2rem 1.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Shop price</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>{format(shelfPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Made-to-order ({surchargePct}%)</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>+ {format(madeToOrderPrice - shelfPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.9rem', borderTop: '1px solid #9A8F8740' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#FAF7F4' }}>Your price</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#FAF7F4' }}>{format(madeToOrderPrice)}</span>
                </div>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', fontWeight: 300, color: '#9A8F87', marginTop: '0.9rem', lineHeight: 1.7 }}>
                  Cut to your size and delivered in 7&ndash;10 days. Made-to-order pieces are final sale.
                </p>
              </div>
            )}

            {canAddToBag ? (
              <>
                {mtoError && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#E88' }}>{mtoError}</p>
                )}
                <button
                  type="button"
                  onClick={handleAddMtoToBag}
                  style={{
                    fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.18em',
                    textTransform: 'uppercase', padding: '1rem', marginTop: '0.5rem',
                    backgroundColor: mtoAdded ? '#FAF7F4' : '#C9A882', color: '#2C2C2C',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {mtoAdded ? 'Added to bag' : 'Add to bag'}
                </button>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 300, color: '#9A8F87', textAlign: 'center' }}>
                  Not quite your fit? Choose <em>My measurements</em> above and we&apos;ll make it exactly to you.
                </p>
              </>
            ) : (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }} className="form-row">
              <div>
                <label style={labelStyle}>First Name</label>
                <input required style={inputStyle} value={mtoForm.firstName} onChange={e => setMtoForm({ ...mtoForm, firstName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input style={inputStyle} value={mtoForm.lastName} onChange={e => setMtoForm({ ...mtoForm, lastName: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input required type="email" style={inputStyle} value={mtoForm.email} onChange={e => setMtoForm({ ...mtoForm, email: e.target.value })} />
            </div>

            {needsMeasurements && (
              <div>
                <label style={labelStyle}>Your measurements (inches)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                  {([['bust', 'Bust'], ['waist', 'Waist'], ['hips', 'Hips'], ['height', 'Height'], ['shoulder', 'Shoulder'], ['inseam', 'Inseam']] as const).map(([key, label]) => (
                    <input
                      key={key}
                      style={inputStyle}
                      placeholder={label}
                      value={mtoForm[key]}
                      onChange={e => setMtoForm({ ...mtoForm, [key]: e.target.value })}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Anything else?</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={mtoForm.notes} onChange={e => setMtoForm({ ...mtoForm, notes: e.target.value })} placeholder="Length, sleeves, when you need it by..." />
            </div>

            {mtoError && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#E88' }}>{mtoError}</p>
            )}

            <button type="submit" disabled={mtoLoading} style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', padding: '1rem', marginTop: '0.5rem',
              backgroundColor: '#C9A882', color: '#2C2C2C', border: 'none',
              cursor: mtoLoading ? 'default' : 'pointer', opacity: mtoLoading ? 0.6 : 1,
            }}>
              {mtoLoading ? 'Sending…' : 'Request this piece'}
            </button>
            </>
            )}
          </form>
          )}
        </div>
      </section>
      )}

      <style>{`
        .form-row { grid-template-columns: 1fr 1fr; }
        @media (max-width: 540px) {
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#9A8F87',
  marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  backgroundColor: 'transparent',
  border: '1px solid #9A8F8760',
  color: '#FAF7F4',
  fontFamily: "'Jost', sans-serif",
  fontSize: '0.88rem',
  fontWeight: 300,
  outline: 'none',
  appearance: 'none',
};

// The form sits on the dark panel, so the native select needs its own chevron
// (appearance:none strips it) and explicitly light option text — otherwise
// options inherit white-on-white in several browsers.
const selectStyle: React.CSSProperties = {
  cursor: 'pointer',
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%239A8F87' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  paddingRight: '2.5rem',
};

const optionStyle: React.CSSProperties = {
  backgroundColor: '#2C2C2C',
  color: '#FAF7F4',
};
