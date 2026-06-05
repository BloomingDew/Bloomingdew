'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../../context/UserContext';

export default function LoginPage() {
  const { signIn } = useUser();
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
      router.push('/account');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '6rem auto', padding: '0 2rem 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          Sign In
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          Welcome back
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={label}>Email</label>
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={input} placeholder="your@email.com" />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <label style={{ ...label, marginBottom: 0 }}>Password</label>
            <Link href="/account/forgot-password" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>
              Forgot password?
            </Link>
          </div>
          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} style={input} placeholder="••••••••" />
        </div>

        {error && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', textAlign: 'center' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
          fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
        }}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87', textAlign: 'center', marginTop: '2rem' }}>
        Don't have an account?{' '}
        <Link href="/account/signup" style={{ color: '#2C2C2C', borderBottom: '1px solid #2C2C2C' }}>
          Create one
        </Link>
      </p>
    </div>
  );
}

const label: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#9A8F87', marginBottom: '0.5rem',
};
const input: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem',
  backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
  color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
  fontSize: '0.88rem', fontWeight: 300, outline: 'none',
};
