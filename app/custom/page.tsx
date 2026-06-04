'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

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
    body: "Once we've agreed on everything, your garment is handmade from scratch. Typical turnaround is 2–4 weeks.",
  },
  {
    number: '04',
    title: 'Delivered to you',
    body: 'Your finished piece is carefully packaged and sent directly to your door — made for you, no one else.',
  },
];

export default function CustomPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', occasion: '', vision: '', budget: '',
    bust: '', waist: '', hips: '', height: '', shoulder: '', inseam: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('enquiries').insert({
      type: 'custom',
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      occasion: form.occasion,
      message: form.vision,
      budget: form.budget,
      measurements: { bust: form.bust, waist: form.waist, hips: form.hips, height: form.height, shoulder: form.shoulder, inseam: form.inseam },
      status: 'unread',
    });
    setSent(true);
    setLoading(false);
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

      {/* How it works */}
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

      {/* Enquiry form */}
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
