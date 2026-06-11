'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../lib/supabase-admin';
import { supabase } from '../../lib/supabase';

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

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedRevenue, setCompletedRevenue] = useState<number | null>(null);

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
    const [{ data: stock }, { count: enquiries }, { count: orders }, { data: delivered }] = await Promise.all([
      supabase.from('product_size_inventory').select('product_id, size, quantity, products(name)').lte('quantity', 3).gte('quantity', 0),
      supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('total').eq('status', 'delivered'),
    ]);
    setLowStock(stock || []);
    setUnreadEnquiries(enquiries || 0);
    setPendingOrders(orders || 0);
    const revenue = (delivered || []).reduce((sum, o) => sum + (o.total || 0), 0);
    setCompletedRevenue(revenue);
  };

  const toggleAvailable = async (id: number, current: boolean) => {
    await supabase.from('products').update({ available: !current }).eq('id', id);
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
    for (const id of selected) {
      await supabase.from('products').update({ available }).eq('id', id);
    }
    setProducts(prev => prev.map(p => selected.includes(p.id) ? { ...p, available } : p));
    setSelected([]);
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} product${selected.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    for (const id of selected) {
      await supabase.from('product_images').delete().eq('product_id', id);
      await supabase.from('product_size_inventory').delete().eq('product_id', id);
      await supabase.from('products').delete().eq('id', id);
    }
    setProducts(prev => prev.filter(p => !selected.includes(p.id)));
    setSelected([]);
  };


  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { label: 'Total Products', value: products.length },
            { label: 'Live', value: products.filter(p => p.available).length },
            { label: 'Hidden', value: products.filter(p => !p.available).length },
            { label: 'With Images', value: products.filter(p => p.product_images?.length > 0).length },
          ].map(({ label, value }) => (
            <div key={label} style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', border: '1px solid #E8DDD3' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.5rem' }}>{label}</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#2C2C2C' }}>{value}</p>
            </div>
          ))}
          {/* Revenue card */}
          <div style={{ backgroundColor: '#2C2C2C', padding: '1.5rem', border: '1px solid #2C2C2C' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.5rem' }}>
              Revenue (Delivered)
            </p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 500, color: '#FAF7F4' }}>
              {completedRevenue === null ? '—' : `₦${completedRevenue.toLocaleString()}`}
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
          <div style={{ backgroundColor: '#2C2C2C', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0', borderRadius: '2px 2px 0 0' }}>
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
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>₦{product.price}</p>
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
