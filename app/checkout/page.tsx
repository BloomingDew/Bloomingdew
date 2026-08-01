'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useUser } from '../../context/UserContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatMoney, convertFromUsd } from '../../lib/currency';
import { supabase } from '../../lib/supabase';
import SquarePaymentForm from '../../components/SquarePaymentForm';

export default function CheckoutPage() {
  const { items, totalPriceUsd, clearCart } = useCart();
  const { user, profile } = useUser();
  const { format, currency, rates } = useCurrency();
  const router = useRouter();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [itemImages, setItemImages] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [reservationExpired, setReservationExpired] = useState(false);

  useEffect(() => {
    const reservedItems = items.filter(i => !i.madeToOrder && i.expiresAt);
    if (reservedItems.length === 0) { setTimeLeft(null); setReservationExpired(false); return; }
    const earliest = new Date(Math.min(...reservedItems.map(i => new Date(i.expiresAt!).getTime())));
    const tick = () => {
      const diff = earliest.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); setReservationExpired(true); return; }
      setReservationExpired(false);
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [items]);

  useEffect(() => {
    if (items.length === 0) return;
    const ids = [...new Set(items.map(i => i.id))];
    supabase.from('product_images').select('product_id, url').in('product_id', ids).order('position')
      .then(({ data }) => {
        const map: Record<number, string> = {};
        (data || []).forEach(row => { if (!map[row.product_id]) map[row.product_id] = row.url; });
        setItemImages(map);
      });
  }, [items]);

  const [shipping, setShipping] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', apartment: '', city: '', postcode: '', country: 'Nigeria',
  });

  // Pre-fill from profile when logged in
  useEffect(() => {
    if (profile || user) {
      setShipping(prev => ({
        ...prev,
        firstName: profile?.first_name || prev.firstName,
        lastName: profile?.last_name || prev.lastName,
        email: user?.email || prev.email,
        phone: profile?.phone || prev.phone,
      }));
    }
  }, [profile, user]);

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
    // Fire-and-forget abandoned-checkout capture — never blocks checkout.
    try {
      fetch('/api/abandoned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: shipping.email,
          firstName: shipping.firstName,
          items: items.map(i => ({ id: i.id, size: i.size, quantity: i.quantity })),
        }),
      }).catch(() => {});
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paystack'>('card');
  const [paystackLoading, setPaystackLoading] = useState(false);

  // Returning from a failed/cancelled Paystack redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'failed') {
      setStep('payment');
      setPaymentMethod('paystack');
      setPaymentError('Your Paystack payment was not completed. You have not been charged — please try again.');
      window.history.replaceState(null, '', '/checkout');
    }
  }, []);

  // Discount code — validated server-side against the re-priced cart; the
  // server re-checks again at charge time, so this is display + intent only.
  const [discountInput, setDiscountInput] = useState('');
  const [discountError, setDiscountError] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amountUsd: number } | null>(null);

  const applyDiscount = async () => {
    const code = discountInput.trim();
    if (!code || applyingDiscount) return;
    setApplyingDiscount(true);
    setDiscountError('');
    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: items.map(i => ({ id: i.id, size: i.size, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valid) {
        setAppliedDiscount({ code: data.code, amountUsd: data.discountUsd });
        setDiscountInput('');
      } else {
        setDiscountError(data.reason || 'That code isn’t valid.');
      }
    } catch {
      setDiscountError('Could not check that code. Please try again.');
    }
    setApplyingDiscount(false);
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError('');
  };

  // Square: payment + order saved in one API call, returns orderId directly
  const handleSquareSuccess = (orderId: string) => {
    setRedirecting(true);
    clearCart();
    router.push(`/order-confirmation?ref=${encodeURIComponent(orderId)}`);
  };

  // Paystack: initialize server-side (re-priced + converted to NGN), then send
  // the customer to Paystack's hosted page. The callback route verifies the
  // payment, records the order, and lands them on the confirmation page.
  const payWithPaystack = async () => {
    if (paystackLoading) return;
    setPaystackLoading(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ id: i.id, size: i.size, quantity: i.quantity })),
          shipping,
          userId: user?.id ?? null,
          discountCode: appliedDiscount?.code ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.authorizationUrl) {
        setPaymentError(data.error || 'Could not start the Paystack payment. Please try again.');
        setPaystackLoading(false);
        return;
      }
      setRedirecting(true);
      window.location.href = data.authorizationUrl;
    } catch {
      setPaymentError('Could not start the Paystack payment. Please try again.');
      setPaystackLoading(false);
    }
  };

  // orderTotal is in USD (base). Charging stays USD until local-currency
  // payment routing (Paystack/Stripe presentment) lands in a later PR.
  const discountUsd = appliedDiscount ? Math.min(appliedDiscount.amountUsd, totalPriceUsd) : 0;
  const orderTotal = Math.max(0, totalPriceUsd - discountUsd);

  // Naira preview for the Paystack option — same rate the server charges at.
  const ngnTotal = rates.NGN
    ? formatMoney(convertFromUsd(orderTotal, rates.NGN, 'NGN'), 'NGN')
    : null;

  if (items.length === 0 && !loading && !redirecting) {
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

      {/* Reservation timer */}
      {timeLeft && (
        <div style={{
          backgroundColor: '#FFF8F0', border: '1px solid #C9A882',
          padding: '0.75rem 1.5rem', marginBottom: '2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A882" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#5C5450', fontWeight: 300 }}>
            Your items are reserved for <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, color: '#2C2C2C' }}>{timeLeft}</span> — complete your order before they're released.
          </p>
        </div>
      )}

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
                <input style={inputStyle} value={shipping.phone} onChange={e => setShipping({ ...shipping, phone: e.target.value })} placeholder="+234 801 234 5678" />
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
                  <input required style={inputStyle} value={shipping.city} onChange={e => setShipping({ ...shipping, city: e.target.value })} placeholder="Lagos" />
                </div>
                <div>
                  <label style={labelStyle}>Postal Code *</label>
                  <input required style={inputStyle} value={shipping.postcode} onChange={e => setShipping({ ...shipping, postcode: e.target.value })} placeholder="100001" />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={labelStyle}>Country *</label>
                <select required style={inputStyle} value={shipping.country} onChange={e => setShipping({ ...shipping, country: e.target.value })}>
                  <option>Nigeria</option>
                  <option>United Kingdom</option>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>France</option>
                  <option>Germany</option>
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
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 300, color: '#9A8F87', marginBottom: '1.2rem' }}>
                All transactions are secure and encrypted.
              </p>

              {reservationExpired ? (
                <div style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFB74D', padding: '1.2rem 1.5rem' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#E65100', lineHeight: 1.7 }}>
                    Your reservation has expired, so we can no longer guarantee these
                    items are in stock. Please return to your bag to re-add them.
                  </p>
                  <Link href="/shop" style={{
                    display: 'inline-block', marginTop: '0.8rem',
                    fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: '#E65100', borderBottom: '1px solid #E65100', textDecoration: 'none',
                  }}>
                    Back to Shop
                  </Link>
                </div>
              ) : (
                <div style={{ border: '1px solid #E8DDD3', backgroundColor: '#FFFFFF' }}>
                  {/* ── Credit card ── */}
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('card'); setPaymentError(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%',
                      padding: '1rem 1.2rem', background: paymentMethod === 'card' ? '#FAF7F4' : 'none',
                      border: 'none', borderLeft: `3px solid ${paymentMethod === 'card' ? '#C9A882' : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${paymentMethod === 'card' ? '#C9A882' : '#D4C4B5'}`,
                      backgroundColor: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {paymentMethod === 'card' && <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#C9A882' }} />}
                    </span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#2C2C2C', flex: 1 }}>
                      Credit / Debit card
                    </span>
                    <span style={{ display: 'flex', gap: '0.3rem' }}>
                      {['VISA', 'MC', 'AMEX'].map(b => (
                        <span key={b} style={{
                          fontFamily: "'Jost', sans-serif", fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em',
                          padding: '0.2rem 0.4rem', border: '1px solid #E8DDD3', color: '#5C5450', backgroundColor: '#FFFFFF',
                        }}>{b}</span>
                      ))}
                    </span>
                  </button>
                  {paymentMethod === 'card' && (
                    <div style={{ padding: '1.2rem', borderTop: '1px solid #F0EAE3' }}>
                      <SquarePaymentForm
                        amount={orderTotal}
                        items={items.map(i => ({ id: i.id, name: i.name, size: i.size, quantity: i.quantity, price: i.priceUsd }))}
                        shipping={shipping}
                        userId={user?.id ?? null}
                        discountCode={appliedDiscount?.code ?? null}
                        loading={loading}
                        setLoading={setLoading}
                        onSuccess={handleSquareSuccess}
                        onError={(msg) => setPaymentError(msg)}
                      />
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #E8DDD3' }} />

                  {/* ── Paystack (NGN) ── */}
                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('paystack'); setPaymentError(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%',
                      padding: '1rem 1.2rem', background: paymentMethod === 'paystack' ? '#FAF7F4' : 'none',
                      border: 'none', borderLeft: `3px solid ${paymentMethod === 'paystack' ? '#C9A882' : 'transparent'}`,
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${paymentMethod === 'paystack' ? '#C9A882' : '#D4C4B5'}`,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {paymentMethod === 'paystack' && <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#C9A882' }} />}
                    </span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', color: '#2C2C2C', flex: 1 }}>
                      Paystack <span style={{ color: '#9A8F87', fontSize: '0.78rem' }}>— pay in Naira</span>
                    </span>
                    <span style={{ display: 'flex', gap: '0.3rem' }}>
                      {['CARD', 'BANK', 'USSD'].map(b => (
                        <span key={b} style={{
                          fontFamily: "'Jost', sans-serif", fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.04em',
                          padding: '0.2rem 0.4rem', border: '1px solid #E8DDD3', color: '#5C5450', backgroundColor: '#FFFFFF',
                        }}>{b}</span>
                      ))}
                    </span>
                  </button>
                  {paymentMethod === 'paystack' && (
                    <div style={{ padding: '1.2rem', borderTop: '1px solid #F0EAE3' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#5C5450', lineHeight: 1.7, marginBottom: '1rem' }}>
                        Pay in Nigerian Naira{ngnTotal ? <> — <strong style={{ fontWeight: 500 }}>{ngnTotal}</strong></> : null}{' '}
                        by card, bank transfer, or USSD. You&apos;ll be securely redirected to Paystack to complete your payment.
                      </p>
                      <button
                        type="button"
                        onClick={payWithPaystack}
                        disabled={paystackLoading}
                        style={{
                          width: '100%', padding: '1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
                          border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                          letterSpacing: '0.15em', textTransform: 'uppercase',
                          cursor: paystackLoading ? 'default' : 'pointer', opacity: paystackLoading ? 0.7 : 1,
                        }}>
                        {paystackLoading ? 'Starting…' : `Pay with Paystack${ngnTotal ? ` — ${ngnTotal}` : ''}`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {paymentError && (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', marginTop: '1rem' }}>
                  {paymentError}
                </p>
              )}

              {/* Terms */}
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 300, color: '#9A8F87', lineHeight: 1.7, marginTop: '1.5rem' }}>
                By placing your order you agree to our terms of service.
                {items.some(i => i.madeToOrder)
                  ? ' Made-to-order pieces take 2–4 weeks for production.'
                  : ''}
              </p>
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
                  position: 'relative', overflow: 'hidden',
                }}>
                  {itemImages[item.id] && (
                    <Image src={itemImages[item.id]} alt={item.name} fill sizes="64px" style={{ objectFit: 'cover' }} />
                  )}
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
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{format(item.priceUsd * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Discount code */}
          <div style={{ borderTop: '1px solid #E8DDD3', paddingTop: '1.2rem', marginBottom: '1.2rem' }}>
            {appliedDiscount ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#2E7D32' }}>
                  Code {appliedDiscount.code} applied
                </span>
                <button onClick={removeDiscount} aria-label="Remove discount code" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87',
                }}>
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={discountInput}
                    onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyDiscount(); } }}
                    placeholder="Discount code"
                    style={{
                      flex: 1, minWidth: 0, padding: '0.6rem 0.8rem',
                      backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
                      color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
                      fontSize: '0.82rem', fontWeight: 300, outline: 'none',
                    }}
                  />
                  <button onClick={applyDiscount} disabled={applyingDiscount || !discountInput.trim()} style={{
                    padding: '0.6rem 1.1rem',
                    backgroundColor: applyingDiscount || !discountInput.trim() ? '#9A8F87' : '#2C2C2C',
                    color: '#FAF7F4', fontFamily: "'Jost', sans-serif", fontSize: '0.7rem',
                    letterSpacing: '0.12em', textTransform: 'uppercase', border: 'none',
                    cursor: applyingDiscount || !discountInput.trim() ? 'not-allowed' : 'pointer',
                  }}>
                    {applyingDiscount ? '…' : 'Apply'}
                  </button>
                </div>
                {discountError && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C62828', marginTop: '0.5rem' }}>
                    {discountError}
                  </p>
                )}
              </>
            )}
          </div>

          <div style={{ borderTop: '1px solid #E8DDD3', paddingTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={summaryLabel}>Subtotal</span>
              <span style={summaryValue}>{format(totalPriceUsd)}</span>
            </div>
            {appliedDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ ...summaryLabel, color: '#2E7D32' }}>Code {appliedDiscount.code}</span>
                <span style={{ ...summaryValue, color: '#2E7D32' }}>− {format(discountUsd)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={summaryLabel}>Shipping</span>
              <span style={{ ...summaryValue, color: '#C9A882' }}>TBD</span>
            </div>
            <div style={{ borderTop: '1px solid #E8DDD3', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C' }}>Total</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 500, color: '#2C2C2C' }}>{format(orderTotal)}</span>
            </div>
            {currency !== 'USD' && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', fontWeight: 300, color: '#9A8F87', marginTop: '0.25rem' }}>
                Charged in USD ({formatMoney(orderTotal, 'USD')}). Local-currency charging is coming soon.
              </p>
            )}
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
