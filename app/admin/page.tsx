'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, supabaseAuth } from '../../lib/supabase-admin';
import { formatAdminPrice } from '../../lib/adminCurrency';
import { toast } from '../../components/Toast';

type LowStockItem = { product_id: number; size: string; quantity: number; products: { name: string } | { name: string }[] | null };

type Analytics = {
  perDay: { date: string; revenue: number; orders: number }[];
  revenue30d: number;
  orders30d: number;
  prevRevenue30d: number;
  prevOrders30d: number;
  avgOrderValue: number;
  bestSellers: { name: string; units: number }[];
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedRevenue, setCompletedRevenue] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activity, setActivity] = useState<{ id: number; admin_email: string | null; action: string; entity: string; entity_id: string | null; details: Record<string, unknown> | null; created_at: string }[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [thresholdSaved, setThresholdSaved] = useState(false);

  // Destination-based tax rates (percent per shipping country). Must mirror
  // the checkout's country dropdown.
  const TAX_COUNTRIES = ['Nigeria', 'United Kingdom', 'United States', 'Canada', 'Australia', 'France', 'Germany', 'Ghana', 'Other'];
  const [taxRates, setTaxRates] = useState<Record<string, string>>({});
  const [showTaxes, setShowTaxes] = useState(false);
  const [taxSaved, setTaxSaved] = useState(false);
  const [taxError, setTaxError] = useState('');

  const saveTaxRates = async () => {
    setTaxError('');
    const clean: Record<string, number> = {};
    for (const [country, value] of Object.entries(taxRates)) {
      if (value === '' || value === null) continue;
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 50) {
        setTaxError(`"${value}" isn't a valid percentage for ${country} (0–50).`);
        return;
      }
      if (n > 0) clean[country] = n;
    }
    const res = await fetch('/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'tax_rates', value: JSON.stringify(clean) }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setTaxError(error || 'Save failed.');
      return;
    }
    setTaxSaved(true);
    setTimeout(() => setTaxSaved(false), 2000);
  };

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.push('/admin/login'); return; }
      fetchDashboard();
    });
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/counts');
      if (res.ok) {
        const { unreadEnquiries, pendingOrders, deliveredRevenue, lowStock, lowStockThreshold: threshold } = await res.json();
        setLowStock(lowStock || []);
        setUnreadEnquiries(unreadEnquiries || 0);
        setPendingOrders(pendingOrders || 0);
        setCompletedRevenue(deliveredRevenue ?? 0);
        if (threshold !== undefined) setLowStockThreshold(String(threshold));
      }
    } catch {
      // Leave the defaults; the dashboard still works without alert counts.
    }
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch {
      // Analytics section simply doesn't render without data.
    }
    try {
      const { data } = await supabaseAuth
        .from('site_settings').select('value').eq('key', 'tax_rates').maybeSingle();
      if (data?.value) {
        const parsed = JSON.parse(data.value);
        const asStrings: Record<string, string> = {};
        for (const [country, rate] of Object.entries(parsed)) asStrings[country] = String(rate);
        setTaxRates(asStrings);
      }
    } catch {
      // Tax card just starts empty.
    }
    try {
      const res = await fetch('/api/admin/activity');
      if (res.ok) {
        const { activity: rows } = await res.json();
        setActivity(rows || []);
      }
    } catch {
      // Activity card simply doesn't render without data.
    }
  };

  const saveThreshold = async () => {
    const res = await fetch('/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'low_stock_threshold', value: lowStockThreshold }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to save: ${error}`, 'error');
      return;
    }
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 2000);
    fetchDashboard();
  };

  return (
    <div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '2rem' }}>
          Dashboard
        </h1>

        {/* Low stock alerts */}
        {lowStock.length > 0 && (
          <div style={{ backgroundColor: '#FFF3E0', border: '1px solid #FFB74D', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 500, color: '#E65100', marginBottom: '0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Low Stock Alert — {lowStock.length} size{lowStock.length !== 1 ? 's' : ''} running low
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {lowStock.map((item, i) => (
                  <span key={i} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#E65100', backgroundColor: '#FFE0B2', padding: '0.2rem 0.6rem' }}>
                    {(item.products as { name?: string } | null)?.name ?? (Array.isArray(item.products) ? item.products[0]?.name : '')} — {item.size}: {item.quantity} left
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Needs attention + lifetime revenue */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/admin/orders" style={{ textDecoration: 'none', backgroundColor: pendingOrders > 0 ? '#FFFBEA' : '#FFFFFF', border: `1px solid ${pendingOrders > 0 ? '#F59E0B' : '#E8DDD3'}`, padding: '1.2rem 1.5rem', display: 'block' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: pendingOrders > 0 ? '#92400E' : '#9A8F87', marginBottom: '0.4rem' }}>Pending Orders</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: pendingOrders > 0 ? '#B45309' : '#2C2C2C' }}>{pendingOrders}</p>
          </Link>
          <Link href="/admin/enquiries" style={{ textDecoration: 'none', backgroundColor: unreadEnquiries > 0 ? '#FFFBEA' : '#FFFFFF', border: `1px solid ${unreadEnquiries > 0 ? '#F59E0B' : '#E8DDD3'}`, padding: '1.2rem 1.5rem', display: 'block' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: unreadEnquiries > 0 ? '#92400E' : '#9A8F87', marginBottom: '0.4rem' }}>Unread Enquiries</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: unreadEnquiries > 0 ? '#B45309' : '#2C2C2C' }}>{unreadEnquiries}</p>
          </Link>
          <div style={{ backgroundColor: '#2C2C2C', padding: '1.2rem 1.5rem', border: '1px solid #2C2C2C' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.4rem' }}>
              Revenue (Delivered, all time)
            </p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#FAF7F4' }}>
              {completedRevenue === null ? '—' : formatAdminPrice(completedRevenue)}
            </p>
          </div>
        </div>

        {/* Sales analytics */}
        {analytics && (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 500, color: '#2C2C2C' }}>
                Last 30 Days
              </h2>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87' }}>
                vs. previous 30 days
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Revenue', value: formatAdminPrice(analytics.revenue30d), delta: analytics.prevRevenue30d > 0 ? ((analytics.revenue30d - analytics.prevRevenue30d) / analytics.prevRevenue30d) * 100 : null },
                { label: 'Orders', value: String(analytics.orders30d), delta: analytics.prevOrders30d > 0 ? ((analytics.orders30d - analytics.prevOrders30d) / analytics.prevOrders30d) * 100 : null },
                { label: 'Avg Order Value', value: formatAdminPrice(analytics.avgOrderValue), delta: null },
              ].map(({ label, value, delta }) => (
                <div key={label} style={{ border: '1px solid #F0EAE3', padding: '1.2rem' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.4rem' }}>{label}</p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>{value}</p>
                  {delta !== null && (
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: delta >= 0 ? '#2E7D32' : '#C0392B', marginTop: '0.2rem' }}>
                      {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}%
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Revenue-per-day bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '90px', marginBottom: '0.5rem' }}>
              {(() => {
                const max = Math.max(...analytics.perDay.map(d => d.revenue), 1);
                return analytics.perDay.map(d => (
                  <div key={d.date} title={`${d.date}: ${formatAdminPrice(d.revenue)} (${d.orders} order${d.orders !== 1 ? 's' : ''})`}
                    style={{
                      flex: 1, minWidth: 0,
                      height: `${Math.max(2, (d.revenue / max) * 100)}%`,
                      backgroundColor: d.revenue > 0 ? '#C9A882' : '#F0EAE3',
                    }} />
                ));
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', color: '#9A8F87', marginBottom: '1.5rem' }}>
              <span>{analytics.perDay[0]?.date}</span>
              <span>{analytics.perDay[analytics.perDay.length - 1]?.date}</span>
            </div>

            {/* Best sellers */}
            {analytics.bestSellers.length > 0 && (
              <div>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.75rem' }}>
                  Best Sellers (units, last 60 days)
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {analytics.bestSellers.map((b, i) => (
                    <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87', width: '16px' }}>{i + 1}.</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C', flex: 1 }}>{b.name}</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9A8F87' }}>{b.units} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Low-stock threshold setting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>
            Alert me when a size has
          </span>
          <input
            type="number" min={0} max={1000}
            value={lowStockThreshold}
            onChange={e => setLowStockThreshold(e.target.value)}
            style={{ width: '64px', padding: '0.35rem 0.5rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', outline: 'none', textAlign: 'center' }}
          />
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>or fewer left</span>
          <button onClick={saveThreshold} style={{ padding: '0.4rem 1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Save
          </button>
          {thresholdSaved && <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#2E7D32' }}>Saved!</span>}
        </div>

        {/* Tax rates */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
          <button onClick={() => setShowTaxes(!showTaxes)} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 500, color: '#2C2C2C' }}>
                Tax Rates
              </h2>
              {taxSaved && <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#2E7D32' }}>Saved!</span>}
            </span>
            <span style={{ color: '#9A8F87', fontSize: '0.8rem' }}>{showTaxes ? '▲' : '▼'}</span>
          </button>
          {showTaxes && (
            <div style={{ marginTop: '1.2rem' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 300, color: '#9A8F87', marginBottom: '1.2rem', lineHeight: 1.7 }}>
                Charged at checkout based on the customer&apos;s shipping country, on top of the
                (discounted) subtotal. Leave a country empty or 0 to charge no tax there.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
                {TAX_COUNTRIES.map(country => (
                  <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', flex: 1 }}>{country}</span>
                    <input
                      type="number" min={0} max={50} step={0.5}
                      value={taxRates[country] ?? ''}
                      onChange={e => setTaxRates(prev => ({ ...prev, [country]: e.target.value }))}
                      placeholder="0"
                      style={{ width: '72px', padding: '0.35rem 0.5rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', outline: 'none', textAlign: 'right' }}
                    />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#9A8F87' }}>%</span>
                  </div>
                ))}
              </div>
              {taxError && (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#C62828', marginBottom: '0.8rem' }}>{taxError}</p>
              )}
              <button onClick={saveTaxRates} style={{
                padding: '0.5rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none',
                fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              }}>
                Save Tax Rates
              </button>
            </div>
          )}
        </div>

        {/* Recent admin activity */}
        {activity.length > 0 && (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '1.5rem 2rem', marginBottom: '2rem' }}>
            <button onClick={() => setShowActivity(!showActivity)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 500, color: '#2C2C2C' }}>
                Recent Activity
              </h2>
              <span style={{ color: '#9A8F87', fontSize: '0.8rem' }}>{showActivity ? '▲' : '▼'}</span>
            </button>
            {showActivity && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {activity.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid #F5F5F5', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', minWidth: '120px' }}>
                      {new Date(a.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', flex: 1 }}>
                      {a.admin_email ? a.admin_email.split('@')[0] : 'admin'} · {a.action} {a.entity}
                      {a.entity_id ? ` #${String(a.entity_id).slice(0, 8)}` : ''}
                      {a.details && typeof a.details === 'object' && 'status' in a.details ? ` → ${a.details.status}` : ''}
                      {a.details && typeof a.details === 'object' && 'name' in a.details ? ` (${a.details.name})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
