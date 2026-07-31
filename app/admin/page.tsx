'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../lib/supabase-admin';
import { supabase } from '../../lib/supabase';
import { formatAdminPrice } from '../../lib/adminCurrency';

type Product = {
  id: number;
  name: string;
  price: number;
  available: boolean;
  made_to_order: boolean;
  stock_quantity: number | null;
  categories: { name: string }[] | null;
  product_images: { url: string }[];
};

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

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'hidden'>('all');
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedRevenue, setCompletedRevenue] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState('3');
  const [thresholdSaved, setThresholdSaved] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.push('/admin/login'); return; }
      fetchProducts();
      fetchAlerts();
    });
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, available, made_to_order, stock_quantity, categories(name), product_images(url)')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/admin/counts');
      if (!res.ok) return;
      const { unreadEnquiries, pendingOrders, deliveredRevenue, lowStock, lowStockThreshold: threshold } = await res.json();
      setLowStock(lowStock || []);
      setUnreadEnquiries(unreadEnquiries || 0);
      setPendingOrders(pendingOrders || 0);
      setCompletedRevenue(deliveredRevenue ?? 0);
      if (threshold !== undefined) setLowStockThreshold(String(threshold));
    } catch {
      // Leave the defaults; the dashboard still works without alert counts.
    }
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) setAnalytics(await res.json());
    } catch {
      // Analytics section simply doesn't render without data.
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
      alert(`Failed to save: ${error}`);
      return;
    }
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 2000);
    fetchAlerts();
  };

  const toggleAvailable = async (id: number, current: boolean) => {
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id], available: !current }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      alert(`Failed to update: ${error}`);
      return;
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !current } : p));
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelected(filtered.map(p => p.id));
  };

  const clearSelection = () => setSelected([]);

  const bulkSetAvailable = async (available: boolean) => {
    if (!available && !window.confirm(`Hide ${selected.length} product${selected.length !== 1 ? 's' : ''}?`)) return;
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected, available }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      alert(`Failed to update: ${error}`);
      return;
    }
    setProducts(prev => prev.map(p => selected.includes(p.id) ? { ...p, available } : p));
    setSelected([]);
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} product${selected.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selected }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      alert(`Failed to delete: ${error}`);
      return;
    }
    setProducts(prev => prev.filter(p => !selected.includes(p.id)));
    setSelected([]);
  };


  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => statusFilter === 'all' ? true : statusFilter === 'live' ? p.available : !p.available);

  return (
    <div>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

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
                    {(item.products as any)?.name} — {item.size}: {item.quantity} left
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending orders / unread enquiries alert cards */}
        {(pendingOrders > 0 || unreadEnquiries > 0) && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {pendingOrders > 0 && (
              <div style={{ backgroundColor: '#FFFBEA', border: '1px solid #F59E0B', padding: '1rem 1.5rem', flex: '1 1 180px' }}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400E', marginBottom: '0.4rem' }}>Pending Orders</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#B45309' }}>{pendingOrders}</p>
              </div>
            )}
            {unreadEnquiries > 0 && (
              <div style={{ backgroundColor: '#FFFBEA', border: '1px solid #F59E0B', padding: '1rem 1.5rem', flex: '1 1 180px' }}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#92400E', marginBottom: '0.4rem' }}>Unread Enquiries</p>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#B45309' }}>{unreadEnquiries}</p>
              </div>
            )}
          </div>
        )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
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

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { label: 'Total Products', value: products.length, filter: 'all' as const },
            { label: 'Live', value: products.filter(p => p.available).length, filter: 'live' as const },
            { label: 'Hidden', value: products.filter(p => !p.available).length, filter: 'hidden' as const },
            { label: 'With Images', value: products.filter(p => p.product_images?.length > 0).length, filter: 'all' as const },
          ].map(({ label, value, filter }) => (
            <div
              key={label}
              onClick={() => setStatusFilter(prev => prev === filter && filter !== 'all' ? 'all' : filter)}
              style={{
                backgroundColor: statusFilter === filter && filter !== 'all' ? '#2C2C2C' : '#FFFFFF',
                padding: '1.5rem', border: '1px solid #E8DDD3',
                cursor: filter !== 'all' ? 'pointer' : 'default',
              }}
            >
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: statusFilter === filter && filter !== 'all' ? '#C9A882' : '#9A8F87', marginBottom: '0.5rem' }}>{label}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: statusFilter === filter && filter !== 'all' ? '#FAF7F4' : '#2C2C2C' }}>{value}</p>
            </div>
          ))}
          {/* Revenue card */}
          <div style={{ backgroundColor: '#2C2C2C', padding: '1.5rem', border: '1px solid #2C2C2C' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.5rem' }}>
              Revenue (Delivered)
            </p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#FAF7F4' }}>
              {completedRevenue === null ? '—' : formatAdminPrice(completedRevenue)}
            </p>
          </div>
        </div>

        {/* Header + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 500, color: '#2C2C2C' }}>Products</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              style={{ padding: '0.6rem 1rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', outline: 'none', backgroundColor: '#FFFFFF', width: '220px' }}
            />
            <Link href="/admin/products/new" style={{
              padding: '0.7rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
              fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
              + Add Product
            </Link>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selected.length > 0 && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, backgroundColor: '#2C2C2C', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#FAF7F4' }}>{selected.length} selected</span>
            <button onClick={() => bulkSetAvailable(true)} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A882', background: 'none', border: '1px solid #C9A882', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
              Set Live
            </button>
            <button onClick={() => bulkSetAvailable(false)} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', background: 'none', border: '1px solid #9A8F87', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
              Set Hidden
            </button>
            <button onClick={bulkDelete} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C0392B', background: 'none', border: '1px solid #C0392B', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
              Delete
            </button>
            <button onClick={clearSelection} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
              Clear
            </button>
          </div>
        )}

        {/* Products table */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9A8F87', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}>
              Loading products...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#9A8F87', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem' }}>
              No products found.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E8DDD3' }}>
                  <th style={{ padding: '1rem 1.2rem', width: '40px' }}>
                    <input type="checkbox" onChange={e => e.target.checked ? selectAll() : clearSelection()} checked={selected.length === filtered.length && filtered.length > 0} />
                  </th>
                  {['Image', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '1rem 1.2rem', textAlign: 'left', fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #E8DDD3', backgroundColor: selected.includes(product.id) ? '#FAF7F4' : i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} />
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <div style={{ width: '48px', height: '60px', background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)', overflow: 'hidden', flexShrink: 0 }}>
                        {product.product_images?.[0] && (
                          <img src={product.product_images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#2C2C2C' }}>{product.name}</p>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#9A8F87' }}>{product.categories?.[0]?.name || '—'}</p>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>{formatAdminPrice(product.price)}</p>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      {product.made_to_order ? (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>MTO</span>
                      ) : product.stock_quantity === null ? (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87' }}>—</span>
                      ) : (
                        <span style={{
                          fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500,
                          color: product.stock_quantity === 0 ? '#C0392B' : product.stock_quantity <= 3 ? '#E65100' : '#2E7D32',
                        }}>
                          {product.stock_quantity === 0 ? 'Sold Out' : product.stock_quantity}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <button onClick={() => toggleAvailable(product.id, product.available)} style={{
                        padding: '0.3rem 0.8rem', border: 'none', cursor: 'pointer',
                        fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        backgroundColor: product.available ? '#E8F5E9' : '#FFF3E0',
                        color: product.available ? '#2E7D32' : '#E65100',
                      }}>
                        {product.available ? 'Live' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.2rem' }}>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <Link href={`/admin/products/${product.id}`} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#C9A882', borderBottom: '1px solid #C9A882', textDecoration: 'none' }}>
                          Edit
                        </Link>
                        <Link href={`/products/${product.id}`} target="_blank" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#9A8F87', borderBottom: '1px solid #9A8F87', textDecoration: 'none' }}>
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
