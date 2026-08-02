'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  amount: number;
  items: { id: number; name: string; size: string; quantity: number; price: number; colourId?: string | null }[];
  shipping: {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; apartment: string; city: string; postcode: string; country: string;
  };
  userId: string | null;
  discountCode?: string | null;
  loading: boolean;
  setLoading: (v: boolean) => void;
  onSuccess: (orderId: string) => void;
  onError: (msg: string) => void;
};

declare global {
  interface Window { Square?: any }
}

export default function SquarePaymentForm({ amount, items, shipping, userId, discountCode, loading, setLoading, onSuccess, onError }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInstance = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const [cardReady, setCardReady] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    // Load Square Web Payments SDK
    if (document.getElementById('square-sdk')) {
      initSquare();
      return;
    }
    const script = document.createElement('script');
    script.id = 'square-sdk';
    script.src = process.env.NEXT_PUBLIC_SQUARE_ENV === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js';
    script.onload = initSquare;
    script.onerror = () => setInitError('Failed to load payment SDK. Please refresh.');
    document.head.appendChild(script);

    return () => {
      cardInstance.current?.destroy?.();
    };
  }, []);

  const initSquare = async () => {
    if (!window.Square) { setInitError('Payment SDK not available.'); return; }
    try {
      const payments = window.Square.payments(
        process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
      );
      paymentsRef.current = payments;
      const card = await payments.card({
        style: {
          '.input-container': { borderColor: '#E8DDD3', borderRadius: '0px' },
          '.input-container.is-focus': { borderColor: '#2C2C2C' },
          '.input-container.is-error': { borderColor: '#C0392B' },
          input: { color: '#2C2C2C' },
          'input::placeholder': { color: '#9A8F87' },
          '.message-icon': { color: '#C0392B' },
        },
      });
      if (cardRef.current) {
        await card.attach(cardRef.current);
        cardInstance.current = card;
        setCardReady(true);
      }
    } catch (err: any) {
      console.error('Square init error:', err);
      setInitError('Could not initialize payment form. Please refresh and try again.');
    }
  };

  const handlePay = async () => {
    if (!cardInstance.current || !cardReady) return;
    setLoading(true);
    onError('');

    try {
      const result = await cardInstance.current.tokenize();
      if (result.status !== 'OK') {
        const msg = result.errors?.map((e: any) => e.message).join(', ') || 'Card details invalid.';
        onError(msg);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/square/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: result.token,
          amountUsd: amount,
          items,
          shipping,
          userId,
          discountCode: discountCode || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        onError(data.error || 'Payment failed. Please try again.');
        setLoading(false);
        return;
      }

      onSuccess(data.orderId);
    } catch {
      onError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (initError) {
    return (
      <div style={{ padding: '1.5rem', border: '1px solid #E8DDD3', backgroundColor: '#FFF8F0' }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#C0392B' }}>{initError}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Square card input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>Card Details</label>
        <div
          ref={cardRef}
          style={{
            minHeight: '48px',
            border: '1px solid #E8DDD3',
            padding: '0.75rem 1rem',
            backgroundColor: '#FFFFFF',
          }}
        />
        {!cardReady && !initError && (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', marginTop: '0.5rem' }}>
            Loading card form...
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8F87" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', letterSpacing: '0.05em' }}>
          Payments secured by Square — your card details are never stored.
        </span>
      </div>

      <button
        onClick={handlePay}
        disabled={loading || !cardReady}
        style={{
          width: '100%', padding: '1.1rem',
          backgroundColor: loading || !cardReady ? '#9A8F87' : '#2C2C2C',
          color: '#FAF7F4',
          fontFamily: "'Jost', sans-serif", fontSize: '0.8rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          border: 'none', cursor: loading || !cardReady ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? 'Processing...' : `Pay £${amount.toFixed(2)}`}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#9A8F87', marginBottom: '0.5rem',
};
