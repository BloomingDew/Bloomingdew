'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../lib/supabase-admin';
import { supabase } from '../../../lib/supabase';

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: { address: string; city: string; postcode: string; country: string };
  items: { id: number; name: string; size: string; quantity: number; price: string }[];
  subtotal: number;
  shipping_cost: number;
  total: number;
  status: string;
  notes: string;
  created_at: string;
};

const STATUSES = ['paid', 'shipped', 'delivered', 'cancelled'];
const STATUS_LABELS: Record<string, string> = {
  paid: 'New Order', shipped: 'Shipped',
  delivered: 'Delivered', cancelled: 'Cancelled',
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: '#FFF3E0', color: '#E65100' },
  shipped: { bg: '#F3E5F5', color: '#6A1B9A' },
  delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const saveNotes = async (orderId: string, notes: string) => {
    await supabase.from('orders').update({ notes }).eq('id', orderId);
  };

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  return (
    <div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Orders', value: orders.length },
            { label: 'New Orders', value: orders.filter(o => o.status === 'paid').length },
            { label: 'Shipped', value: orders.filter(o => o.status === 'shipped').length },
            { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
          ].map(({ label, value }) => (
            <div key={label} style={{ backgroundColor: '#FFFFFF', padding: '1.2rem 1.5rem', border: '1px solid #E8DDD3' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.4rem' }}>{label}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 500, color: '#2C2C2C' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '0.4rem 1rem', border: '1px solid', cursor: 'pointer',
              fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase',
              borderColor: filterStatus === s ? '#2C2C2C' : '#E8DDD3',
              backgroundColor: filterStatus === s ? '#2C2C2C' : '#FFFFFF',
              color: filterStatus === s ? '#FAF7F4' : '#2C2C2C',
            }}>
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87', textAlign: 'center', padding: '4rem' }}>Loading orders...</p>
          ) : filtered.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '4rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>No orders yet</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Orders will appear here when customers check out.</p>
            </div>
          ) : filtered.map(order => (
            <div key={order.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3' }}>
              {/* Order header */}
              <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C' }}>{order.customer_name}</p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>{order.customer_email}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>
                      {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>₦{order.total?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select
                    value={order.status}
                    onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value); }}
                    onClick={e => e.stopPropagation()}
                    style={{
                      padding: '0.4rem 0.8rem', border: '1px solid #E8DDD3', cursor: 'pointer',
                      fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', outline: 'none',
                      backgroundColor: STATUS_COLORS[order.status]?.bg || '#F5F5F5',
                      color: STATUS_COLORS[order.status]?.color || '#2C2C2C',
                    }}>
                    {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <span style={{ color: '#9A8F87', fontSize: '0.8rem' }}>{expanded === order.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === order.id && (
                <div style={{ borderTop: '1px solid #E8DDD3', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <p style={detailLabel}>Items Ordered</p>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F5F5F5' }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{item.name} — Size {item.size} × {item.quantity}</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87' }}>{item.price}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>Subtotal</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#2C2C2C' }}>₦{order.subtotal?.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>Shipping</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#2C2C2C' }}>{order.shipping_cost === 0 ? 'Free' : `₦${order.shipping_cost?.toFixed(2)}`}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8DDD3', paddingTop: '0.3rem' }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#2C2C2C' }}>Total</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, color: '#2C2C2C' }}>₦{order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p style={detailLabel}>Shipping Address</p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#2C2C2C', lineHeight: 1.8 }}>
                      {order.shipping_address?.address}<br />
                      {order.shipping_address?.city}, {order.shipping_address?.postcode}<br />
                      {order.shipping_address?.country}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#9A8F87', marginTop: '0.5rem' }}>{order.customer_phone}</p>

                    <p style={{ ...detailLabel, marginTop: '1.5rem' }}>Internal Notes</p>
                    <textarea
                      defaultValue={order.notes || ''}
                      onBlur={e => saveNotes(order.id, e.target.value)}
                      placeholder="Add notes about this order..."
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#2C2C2C', outline: 'none', resize: 'vertical', minHeight: '80px', backgroundColor: '#FAFAFA' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const detailLabel: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif", fontSize: '0.68rem',
  letterSpacing: '0.14em', textTransform: 'uppercase',
  color: '#C9A882', marginBottom: '0.75rem',
};
