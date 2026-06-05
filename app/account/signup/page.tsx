'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../../context/UserContext';
import PasswordInput from '../../../components/PasswordInput';

export default function SignupPage() {
  const { signUp } = useUser();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    const { error } = await signUp(form.email, form.password, form.firstName, form.lastName);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.push('/account?welcome=1');
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '6rem auto', padding: '0 2rem 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          Create Account
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          Join Bloomingdew
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input required style={inputStyle} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Jane" />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input required style={inputStyle} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Doe" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input required type="email" style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
        </div>
        <div>
          <label style={labelStyle}>Password</label>
          <PasswordInput required style={inputStyle} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
        </div>
        <div>
          <label style={labelStyle}>Confirm Password</label>
          <PasswordInput required style={inputStyle} value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" />
        </div>

        {error && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', textAlign: 'center' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{
          padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
          fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1, marginTop: '0.5rem',
        }}>
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87', textAlign: 'center', marginTop: '2rem' }}>
        Already have an account?{' '}
        <Link href="/account/login" style={{ color: '#2C2C2C', borderBottom: '1px solid #2C2C2C' }}>
          Sign in
        </Link>
      </p>
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
