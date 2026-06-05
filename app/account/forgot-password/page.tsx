'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '6rem auto', padding: '0 2rem 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          Reset Password
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          We'll send you a reset link
        </p>
      </div>

      {sent ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #E8DDD3', backgroundColor: '#FAF7F4' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C', marginBottom: '1rem' }}>
            Check your email — we've sent a password reset link to <strong>{email}</strong>
          </p>
          <Link href="/account/login" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', borderBottom: '1px solid #9A8F87' }}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>Email address</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="your@email.com" />
          </div>
          <button type="submit" disabled={loading} style={{
            padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p style={{ textAlign: 'center' }}>
            <Link href="/account/login" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#9A8F87' }}>
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

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
};
