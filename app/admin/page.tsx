'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, signOut } from '../../lib/supabase-admin';
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

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    await supabase.from('products').update({ available: !current }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !current } : p));
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>

      {/* Topbar */}
      <div style={{ backgroundColor: '#2C2C2C', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#FAF7F4', fontWeight: 500 }}>
            Bloomingdew Admin
          </h1>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Products', href: '/admin' },
              { label: 'View Site', href: '/' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <button onClick={handleSignOut} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', background: 'none', border: 'none', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>

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
                  {['Image', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '1rem 1.2rem', textAlign: 'left', fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((product, i) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #E8DDD3', backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
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
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>£{product.price}</p>
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
