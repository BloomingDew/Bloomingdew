'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import PasswordInput from '../../../components/PasswordInput';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  // null = still checking, true/false = whether a recovery session exists
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase auto-detects the recovery token in the URL and fires PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setHasSession(true);
    });
    // Also cover the case where the session was already established before this listener ran.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(prev => (prev === null ? !!session : prev));
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || 'Could not reset your password. The link may have expired — please request a new one.');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/account/login'), 2500);
  };

  return (
    <div style={{ maxWidth: '440px', margin: '6rem auto', padding: '0 2rem 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          Set a New Password
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          Choose a new password for your account
        </p>
      </div>

      {done ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #E8DDD3', backgroundColor: '#FAF7F4' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C', marginBottom: '1rem' }}>
            Your password has been reset. Redirecting you to sign in…
          </p>
          <Link href="/account/login" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', borderBottom: '1px solid #9A8F87' }}>
            Sign In Now
          </Link>
        </div>
      ) : hasSession === false ? (
        <div style={{ textAlign: 'center', padding: '2rem', border: '1px solid #E8DDD3', backgroundColor: '#FAF7F4' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C', marginBottom: '1rem' }}>
            This reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/account/forgot-password" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', borderBottom: '1px solid #9A8F87' }}>
            Request New Link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>New password</label>
            <PasswordInput required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="At least 8 characters" />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <PasswordInput required value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle} placeholder="Re-enter password" />
          </div>

          {error && (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || hasSession === null} style={{
            padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: (loading || hasSession === null) ? 0.7 : 1,
          }}>
            {loading ? 'Saving...' : 'Reset Password'}
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
