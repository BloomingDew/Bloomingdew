'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '../../../lib/supabase-admin';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', backgroundColor: '#FAF7F4', padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
            Bloomingdew
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
            Admin
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle} placeholder="info@bloomingdew.com"
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle} placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1,
            marginTop: '0.5rem',
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
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
