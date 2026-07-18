'use client';

import { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type IntentItem = { id: number; size: string; quantity: number };

interface StripePaymentFormProps {
  amount: number; // NGN, for display/guard only — the server recomputes the charge
  items: IntentItem[];
  shipping: Record<string, string>;
  userId?: string | null;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}

function CheckoutForm({ onSuccess, onError, loading, setLoading }: Omit<StripePaymentFormProps, 'amount' | 'items' | 'shipping' | 'userId'>) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order-confirmation` },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed. Please try again.');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '1.5rem' }}>
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        style={{
          width: '100%', padding: '1.1rem',
          backgroundColor: loading ? '#9A8F87' : '#2C2C2C',
          color: '#FAF7F4',
          fontFamily: "'Jost', sans-serif", fontSize: '0.8rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function StripePaymentForm({ amount, items, shipping, userId, onSuccess, onError, loading, setLoading }: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  // A PaymentIntent must be created exactly once: Stripe's <Elements clientSecret>
  // is immutable after mount, and duplicate intents clutter the dashboard. This
  // ref also absorbs React StrictMode's double-invoke of effects in development.
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    // Wait for the cart to hydrate from localStorage before pricing.
    if (!items || items.length === 0) return;
    if (!amount || amount <= 0) {
      setInitError('Order total is ₦0 — please check your cart items have a valid price.');
      return;
    }

    createdRef.current = true;
    // The server prices the order from the line items — the client never sends an
    // amount. Shipping + userId are stashed server-side so the webhook can finalize
    // the order if the client callback never runs (3DS redirect, closed tab).
    fetch('/api/stripe/payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, shipping, userId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) setInitError(data.error);
        else setClientSecret(data.clientSecret);
      })
      .catch(() => setInitError('Could not connect to payment service. Please try again.'));
  }, [amount, items]);

  if (initError) {
    return (
      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#C0392B' }}>
        {initError}
      </p>
    );
  }

  if (!clientSecret) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
        <div style={{
          width: '18px', height: '18px', border: '2px solid #E8DDD3',
          borderTopColor: '#2C2C2C', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#9A8F87' }}>
          Loading payment...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{
      clientSecret,
      appearance: {
        theme: 'flat',
        variables: {
          fontFamily: "'Jost', sans-serif",
          colorBackground: '#FFFFFF',
          colorText: '#2C2C2C',
          colorDanger: '#C0392B',
          borderRadius: '0px',
          colorPrimary: '#2C2C2C',
        },
        rules: {
          '.Input': { border: '1px solid #E8DDD3', padding: '0.85rem 1rem', fontSize: '0.88rem' },
          '.Input:focus': { border: '1px solid #2C2C2C', boxShadow: 'none' },
          '.Label': { fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.5rem' },
          '.Tab': { border: '1px solid #E8DDD3' },
          '.Tab--selected': { border: '1px solid #2C2C2C' },
        },
      },
    }}>
      <CheckoutForm onSuccess={onSuccess} onError={onError} loading={loading} setLoading={setLoading} />
    </Elements>
  );
}
