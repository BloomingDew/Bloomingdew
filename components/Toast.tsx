'use client';

import { useEffect, useState } from 'react';

// Tiny event-based toast system: call toast('...') from anywhere client-side;
// <Toaster /> (mounted in the admin layout) renders the stack. No context
// wiring needed.
export function toast(message: string, type: 'success' | 'error' = 'success') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('bd-toast', { detail: { message, type } }));
}

type ToastItem = { id: number; message: string; type: 'success' | 'error' };

let nextId = 1;

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail || {};
      if (!message) return;
      const id = nextId++;
      setToasts(prev => [...prev, { id, message, type: type === 'error' ? 'error' : 'success' }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, type === 'error' ? 5000 : 3200);
    };
    window.addEventListener('bd-toast', onToast);
    return () => window.removeEventListener('bd-toast', onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '360px',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          backgroundColor: t.type === 'error' ? '#2C2C2C' : '#2C2C2C',
          borderLeft: `3px solid ${t.type === 'error' ? '#C0392B' : '#C9A882'}`,
          color: '#FAF7F4', padding: '0.85rem 1.2rem',
          fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', lineHeight: 1.5,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          animation: 'bd-toast-in 0.2s ease',
        }}
          onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
        >
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes bd-toast-in {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
