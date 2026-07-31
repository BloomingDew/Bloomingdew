'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../lib/supabase-admin';
import { formatAdminPrice } from '../../../lib/adminCurrency';

type CustomerOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  itemCount: number;
};

type Customer = {
  email: string;
  name: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
  firstOrderAt: string;
  recentOrders: CustomerOrder[];
};

type Stats = {
  totalCustomers: number;
  repeatCustomers: number;
  avgOrderValue: number;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'New Order',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FFF8E1', color: '#F57F17' },
  paid: { bg: '#FFF3E0', color: '#E65100' },
  shipped: { bg: '#F3E5F5', color: '#6A1B9A' },
  delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  cancelled: { bg: '#FFEBEE', color: '#C62828' },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const isVip = (c: Customer) => c.totalSpent >= 500 || c.orders >= 3;

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCustomers: 0, repeatCustomers: 0, avgOrderValue: 0 });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getSession().then(s => {
      if (!s) {
        router.push('/admin/login');
      } else {
        fetchCustomers();
      }
    });
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomers(data.customers || []);
      setStats(data.stats || { totalCustomers: 0, repeatCustomers: 0, avgOrderValue: 0 });
    } catch {
      setCustomers([]);
    }
    setLoading(false);
  };

  const q = searchQuery.toLowerCase();
  const filtered = customers.filter(c =>
    !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  );

  return (
    <div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' }}>Customers</h2>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Customers', value: String(stats.totalCustomers) },
            { label: 'Repeat Customers', value: String(stats.repeatCustomers) },
            { label: 'Avg Order Value', value: formatAdminPrice(stats.avgOrderValue) },
          ].map(({ label, value }) => (
            <div key={label} style={{ backgroundColor: '#FFFFFF', padding: '1.2rem 1.5rem', border: '1px solid #E8DDD3' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.4rem' }}>{label}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 500, color: '#2C2C2C' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            style={{ width: '100%', padding: '0.6rem 1rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box' }}
          />
        </div>

        {/* Customers list */}
        {loading ? (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87', textAlign: 'center', padding: '4rem' }}>Loading customers...</p>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>No customers yet</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Customers will appear here once orders come in.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr 40px', gap: '1rem', padding: '0.9rem 1.5rem', borderBottom: '1px solid #E8DDD3', alignItems: 'center' }}>
              {['Customer', 'Orders', 'Total Spent', 'Last Order', ''].map((h, i) => (
                <p key={i} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87' }}>{h}</p>
              ))}
            </div>

            {filtered.map(customer => (
              <div key={customer.email} style={{ borderBottom: '1px solid #F5F5F5' }}>
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1.2fr 40px', gap: '1rem', padding: '1rem 1.5rem', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpanded(expanded === customer.email ? null : customer.email)}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer.name || '—'}
                      </p>
                      {isVip(customer) && (
                        <span style={{ padding: '0.12rem 0.45rem', backgroundColor: '#C9A882', color: '#FFFFFF', fontFamily: "'Jost', sans-serif", fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0 }}>
                          VIP
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer.email}</p>
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{customer.orders}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{formatAdminPrice(customer.totalSpent)}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9A8F87' }}>{formatDate(customer.lastOrderAt)}</p>
                  <span style={{ color: '#9A8F87', fontSize: '0.8rem', textAlign: 'right' }}>{expanded === customer.email ? '▲' : '▼'}</span>
                </div>

                {expanded === customer.email && (
                  <div style={{ borderTop: '1px solid #E8DDD3', padding: '1.25rem 1.5rem', backgroundColor: '#FAF7F4' }}>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.75rem' }}>
                      Orders ({customer.orders}) — customer since {formatDate(customer.firstOrderAt)}
                    </p>
                    {customer.recentOrders.map(order => (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid #F0E9E2', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C9A882', letterSpacing: '0.06em' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>{formatDate(order.created_at)}</span>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                            fontFamily: "'Jost', sans-serif",
                            backgroundColor: STATUS_COLORS[order.status]?.bg || '#F5F5F5',
                            color: STATUS_COLORS[order.status]?.color || '#2C2C2C',
                          }}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{formatAdminPrice(order.total)}</span>
                        </div>
                      </div>
                    ))}
                    {customer.orders > customer.recentOrders.length && (
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', marginTop: '0.6rem' }}>
                        Showing {customer.recentOrders.length} most recent of {customer.orders} orders.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
