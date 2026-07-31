'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../lib/supabase-admin';
import { supabase } from '../../../lib/supabase';
import { formatAdminPrice } from '../../../lib/adminCurrency';

type Product = { id: number; name: string; price: number; product_images: { url: string }[] };

type Collection = {
  id: string;
  title: string;
  launch_at: string | null;
  active: boolean;
  created_at: string;
  productIds: number[];
};

// Converts an ISO timestamp to the value a datetime-local input expects (local time).
const toLocalInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (val: string): string | null => {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const formatLaunch = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function CollectionsAdminPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Create card
  const [newTitle, setNewTitle] = useState('');
  const [newLaunch, setNewLaunch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Per-collection edit state (only for the expanded one)
  const [editTitle, setEditTitle] = useState('');
  const [editLaunch, setEditLaunch] = useState('');
  const [editIds, setEditIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [featuredMsg, setFeaturedMsg] = useState<string | null>(null); // collection id

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchData();
  }, []);

  const fetchData = async () => {
    const [colRes, prodRes] = await Promise.all([
      fetch('/api/admin/collections').then(r => r.json()).catch(() => ({ collections: [] })),
      supabase.from('products').select('id, name, price, product_images(url)').eq('available', true).order('name'),
    ]);
    setCollections(colRes.collections || []);
    setProducts((prodRes.data as Product[]) || []);
    setLoading(false);
  };

  const createCollection = async () => {
    if (!newTitle.trim() || creating) return;
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), launch_at: fromLocalInput(newLaunch) }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setCreateError(`Create failed: ${error}`);
    } else {
      const { collection } = await res.json();
      setCollections(prev => [collection, ...prev]);
      setNewTitle('');
      setNewLaunch('');
    }
    setCreating(false);
  };

  const toggleExpand = (c: Collection) => {
    if (expanded === c.id) {
      setExpanded(null);
      return;
    }
    setExpanded(c.id);
    setEditTitle(c.title);
    setEditLaunch(toLocalInput(c.launch_at));
    setEditIds(c.productIds);
    setSearch('');
    setSaveMsg('');
    setErrorMsg('');
  };

  const saveCollection = async (id: string) => {
    setErrorMsg('');
    const launch_at = fromLocalInput(editLaunch);
    const res = await fetch('/api/admin/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title: editTitle.trim(), launch_at, productIds: editIds }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setErrorMsg(`Save failed: ${error}`);
      return;
    }
    setCollections(prev => prev.map(c => c.id === id
      ? { ...c, title: editTitle.trim() || c.title, launch_at, productIds: editIds }
      : c));
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const toggleActive = async (c: Collection) => {
    const res = await fetch('/api/admin/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    if (res.ok) {
      setCollections(prev => prev.map(x => x.id === c.id ? { ...x, active: !c.active } : x));
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm('Delete this collection? This cannot be undone.')) return;
    const res = await fetch('/api/admin/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCollections(prev => prev.filter(c => c.id !== id));
      if (expanded === id) setExpanded(null);
    }
  };

  // Publishes the collection to the homepage's existing "New Collection" section.
  const featureOnHomepage = async (c: Collection) => {
    const ids = expanded === c.id ? editIds : c.productIds;
    const title = expanded === c.id ? editTitle.trim() || c.title : c.title;
    const [r1, r2] = await Promise.all([
      fetch('/api/admin/site-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'new_collection_title', value: title }) }),
      fetch('/api/admin/site-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'new_collection_product_ids', value: JSON.stringify(ids) }) }),
    ]);
    if (!r1.ok || !r2.ok) {
      setErrorMsg('Failed to feature on homepage. Please try again.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setFeaturedMsg(c.id);
    setTimeout(() => setFeaturedMsg(null), 2500);
  };

  const toggleProduct = (productId: number) => {
    setEditIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  const moveProduct = (index: number, direction: -1 | 1) => {
    setEditIds(prev => {
      const next = [...prev];
      const swapIdx = index + direction;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next;
    });
  };

  const selectedProducts = editIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => p !== undefined);

  const labelStyle: React.CSSProperties = { fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.5rem' };
  const inputStyle: React.CSSProperties = { padding: '0.6rem 0.8rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C', outline: 'none', boxSizing: 'border-box' };
  const darkButton: React.CSSProperties = { padding: '0.6rem 1.8rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' };

  return (
    <div>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>
            Collections
          </h2>
        </div>

        {/* Create card */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.25rem' }}>
            New Collection
          </h3>
          {createError && (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C62828', marginBottom: '0.75rem' }}>{createError}</p>
          )}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px' }}>
              <p style={labelStyle}>Title</p>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Harmattan Drop"
                style={{ ...inputStyle, width: '100%' }}
              />
            </div>
            <div>
              <p style={labelStyle}>Launch Date (optional)</p>
              <input
                type="datetime-local"
                value={newLaunch}
                onChange={e => setNewLaunch(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button onClick={createCollection} disabled={creating || !newTitle.trim()} style={{ ...darkButton, opacity: creating || !newTitle.trim() ? 0.5 : 1 }}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Collection list */}
        {loading ? (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87', textAlign: 'center', padding: '4rem' }}>Loading collections...</p>
        ) : collections.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>No collections yet</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Create your first collection above.</p>
          </div>
        ) : (
          collections.map(c => {
            const isOpen = expanded === c.id;
            const count = isOpen ? editIds.length : c.productIds.length;
            const launchFuture = c.launch_at && new Date(c.launch_at).getTime() > Date.now();
            return (
              <div key={c.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', marginBottom: '1.25rem' }}>
                {/* Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => toggleExpand(c)}
                >
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 500, color: '#2C2C2C' }}>{c.title}</p>
                      <span style={{
                        padding: '0.15rem 0.55rem', fontFamily: "'Jost', sans-serif", fontSize: '0.6rem',
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        backgroundColor: c.active ? '#E8F5E9' : '#F5F5F5',
                        color: c.active ? '#2E7D32' : '#9A8F87',
                      }}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                      {featuredMsg === c.id && (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#2E7D32' }}>Now on the homepage ✓</span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87', marginTop: '0.25rem' }}>
                      {count} product{count !== 1 ? 's' : ''}
                      {launchFuture && c.launch_at && (
                        <span style={{ color: '#C9A882' }}> · Launches {formatLaunch(c.launch_at)}</span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => featureOnHomepage(c)}
                      style={{ padding: '0.45rem 1rem', backgroundColor: '#C9A882', color: '#FFFFFF', border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      Feature on Homepage
                    </button>
                    <button
                      onClick={() => toggleActive(c)}
                      style={{ padding: '0.45rem 1rem', backgroundColor: 'transparent', color: '#9A8F87', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <span style={{ color: '#9A8F87', fontSize: '0.8rem' }} onClick={() => toggleExpand(c)}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded editor */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #E8DDD3', padding: '1.5rem' }}>
                    {errorMsg && (
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C62828', marginBottom: '0.75rem' }}>{errorMsg}</p>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      <div style={{ flex: '1 1 260px' }}>
                        <p style={labelStyle}>Title</p>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                      </div>
                      <div>
                        <p style={labelStyle}>Launch Date</p>
                        <input type="datetime-local" value={editLaunch} onChange={e => setEditLaunch(e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* Selected products */}
                    {selectedProducts.length > 0 && (
                      <div style={{ marginBottom: '1.5rem' }}>
                        <p style={labelStyle}>Currently Selected</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {selectedProducts.map((p, idx) => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#FAF7F4', border: '1px solid #C9A882' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '0.25rem' }}>
                                <button
                                  onClick={() => moveProduct(idx, -1)}
                                  disabled={idx === 0}
                                  style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D4C4B5' : '#9A8F87', fontSize: '0.65rem', lineHeight: 1, padding: '1px 3px' }}
                                  title="Move up"
                                >▲</button>
                                <button
                                  onClick={() => moveProduct(idx, 1)}
                                  disabled={idx === selectedProducts.length - 1}
                                  style={{ background: 'none', border: 'none', cursor: idx === selectedProducts.length - 1 ? 'default' : 'pointer', color: idx === selectedProducts.length - 1 ? '#D4C4B5' : '#9A8F87', fontSize: '0.65rem', lineHeight: 1, padding: '1px 3px' }}
                                  title="Move down"
                                >▼</button>
                              </div>
                              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', flex: 1 }}>{p.name}</span>
                              <button onClick={() => toggleProduct(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A8F87', fontSize: '0.8rem' }}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search */}
                    <input
                      placeholder="Search products..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{ ...inputStyle, width: '100%', marginBottom: '1rem', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
                    />

                    {/* All products grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                      {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => {
                        const selected = editIds.includes(product.id);
                        return (
                          <div key={product.id} style={{
                            display: 'flex', gap: '0.75rem', alignItems: 'center',
                            padding: '0.75rem', border: `1px solid ${selected ? '#C9A882' : '#E8DDD3'}`,
                            backgroundColor: selected ? '#FAF7F4' : '#FFFFFF',
                            cursor: 'pointer',
                          }} onClick={() => toggleProduct(product.id)}>
                            <div style={{ width: '44px', height: '56px', flexShrink: 0, overflow: 'hidden', background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)' }}>
                              {product.product_images?.[0] && (
                                <img src={product.product_images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.name}
                              </p>
                              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>{formatAdminPrice(product.price)}</p>
                            </div>
                            <div style={{
                              width: '20px', height: '20px', flexShrink: 0, borderRadius: '50%',
                              border: `2px solid ${selected ? '#C9A882' : '#E8DDD3'}`,
                              backgroundColor: selected ? '#C9A882' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {selected && <span style={{ color: '#FAF7F4', fontSize: '0.6rem' }}>✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                      <button
                        onClick={() => deleteCollection(c.id)}
                        style={{ padding: '0.6rem 1.2rem', backgroundColor: 'transparent', color: '#C62828', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {saveMsg && (
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{saveMsg}</span>
                        )}
                        <button onClick={() => saveCollection(c.id)} style={darkButton}>Save</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
