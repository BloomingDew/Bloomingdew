'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../../../lib/supabase-admin';

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: { address: string; apartment?: string; city: string; postcode: string; country: string };
  items: { name: string; size: string; quantity: number }[];
  notes?: string;
  created_at: string;
};

// Printable packing slip — intentionally no prices (it goes in the parcel).
export default function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(({ order: o, error: e }) => {
        if (o) setOrder(o);
        else setError(e || 'Order not found.');
      })
      .catch(() => setError('Failed to load the order.'));
  }, [id]);

  useEffect(() => {
    if (order) {
      // Let the fonts/layout settle, then open the print dialog.
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [order]);

  if (error) {
    return <p style={{ fontFamily: "'Jost', sans-serif", padding: '3rem', color: '#C62828' }}>{error}</p>;
  }
  if (!order) {
    return <p style={{ fontFamily: "'Jost', sans-serif", padding: '3rem', color: '#9A8F87' }}>Loading packing slip…</p>;
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 2rem', backgroundColor: '#FFFFFF', color: '#1A1A1A' }}>
      <style>{`
        @media print {
          header, nav, .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 500, letterSpacing: '0.06em' }}>
          Bloomingdew
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A8F87', marginTop: '0.3rem' }}>
          Packing Slip
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}>
        <div>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.4rem' }}>Ship To</p>
          <p style={{ fontWeight: 500 }}>{order.customer_name}</p>
          <p>{order.shipping_address?.address}</p>
          {order.shipping_address?.apartment && <p>{order.shipping_address.apartment}</p>}
          <p>{order.shipping_address?.city}, {order.shipping_address?.postcode}</p>
          <p>{order.shipping_address?.country}</p>
          <p style={{ marginTop: '0.4rem', color: '#5C5450' }}>{order.customer_phone}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.4rem' }}>Order</p>
          <p style={{ fontWeight: 500 }}>#{order.id.slice(0, 8).toUpperCase()}</p>
          <p>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', marginBottom: '2.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1A1A1A' }}>
            <th style={{ textAlign: 'left', padding: '0.6rem 0', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 400 }}>Item</th>
            <th style={{ textAlign: 'center', padding: '0.6rem 0', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 400 }}>Size</th>
            <th style={{ textAlign: 'right', padding: '0.6rem 0', fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 400 }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #E8DDD3' }}>
              <td style={{ padding: '0.75rem 0' }}>{item.name}</td>
              <td style={{ padding: '0.75rem 0', textAlign: 'center' }}>{item.size}</td>
              <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#5C5450', textAlign: 'center', lineHeight: 1.8 }}>
        Made with love, just for you.<br />
        bloomingdew.com
      </p>

      <div className="no-print" style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <button onClick={() => window.print()} style={{
          padding: '0.7rem 2rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
          border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
          letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Print
        </button>
      </div>
    </div>
  );
}
