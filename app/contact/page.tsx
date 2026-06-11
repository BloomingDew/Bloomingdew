'use client';

import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'contact', first_name: form.firstName, last_name: form.lastName, email: form.email, subject: form.subject, message: form.message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again or email hello@bloomingdew.com.');
        return;
      }
      setSent(true);
    } catch {
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: '6rem 2rem 5rem', textAlign: 'center',
        borderBottom: '1px solid #E8DDD3',
      }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem' }}>
          We'd love to hear from you
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '1rem' }}>
          Get in Touch
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 300, color: '#9A8F87', maxWidth: '460px', margin: '0 auto', lineHeight: 1.8 }}>
          Questions about an order, a custom piece, or just want to say hello — we're here.
        </p>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '5rem 2rem 7rem', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '6rem', alignItems: 'start' }} className="contact-grid">

        {/* Left — contact info */}
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '2rem' }}>
            Contact Information
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {[
              { label: 'Email', value: 'hello@bloomingdew.com', href: 'mailto:hello@bloomingdew.com' },
              { label: 'Instagram', value: '@bloomingdew', href: '#' },
              { label: 'Response Time', value: 'We aim to reply within 48 hours', href: null },
            ].map(({ label, value, href }) => (
              <div key={label}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.4rem' }}>
                  {label}
                </p>
                {href ? (
                  <a href={href} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.92rem', fontWeight: 300, color: '#2C2C2C' }}>{value}</a>
                ) : (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.92rem', fontWeight: 300, color: '#2C2C2C' }}>{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '2rem' }}>
            Send a Message
          </h2>
          {sent ? (
            <div style={{ padding: '2rem', backgroundColor: '#FAF7F4', border: '1px solid #E8DDD3', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>Message sent.</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>We'll be in touch within 48 hours.</p>
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
              <label style={labelStyle}>Subject</label>
              <select style={inputStyle} value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                <option value="">Select a subject</option>
                <option>Order Enquiry</option>
                <option>Custom Order</option>
                <option>Returns & Exchanges</option>
                <option>General Question</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea required style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }} placeholder="How can we help?" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            </div>
            {error && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} style={{
              padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
              fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer', marginTop: '0.5rem', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem',
  backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
  color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
  fontSize: '0.88rem', fontWeight: 300, outline: 'none',
  appearance: 'none',
};
