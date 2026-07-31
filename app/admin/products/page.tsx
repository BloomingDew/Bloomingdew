'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/supabase-admin';
import { supabase } from '../../../lib/supabase';
import { formatAdminPrice } from '../../../lib/adminCurrency';
import { toast } from '../../../components/Toast';

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

export default function ProductsAdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'hidden'>('all');

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.push('/admin/login'); return; }
      fetchProducts();
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

  const toggleAvailable = async (id: number, current: boolean) => {
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id], available: !current }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to update: ${error}`, 'error');
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
      toast(`Failed to update: ${error}`, 'error');
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
      toast(`Failed to delete: ${error}`, 'error');
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
