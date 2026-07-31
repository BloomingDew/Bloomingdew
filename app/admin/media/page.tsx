'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, supabaseAuth } from '../../../lib/supabase-admin';
import { supabase } from '../../../lib/supabase';
import { formatAdminPrice } from '../../../lib/adminCurrency';

type Product = { id: number; name: string; price: number; featured: boolean; product_images: { url: string }[] };

export default function MediaAdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [savedMsg, setSavedMsg] = useState('');
  const [savedMsgSection, setSavedMsgSection] = useState<'category' | 'featured' | 'about' | 'new_collection' | ''>('');
  const [aboutImage, setAboutImage] = useState<string | null>(null);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [featuredError, setFeaturedError] = useState('');
  // featuredOrder stores product ids in display order; cosmetic only — no featured_position column in DB
  const [featuredOrder, setFeaturedOrder] = useState<number[]>([]);
  const [newCollectionTitle, setNewCollectionTitle] = useState('New Collection');
  const [newCollectionIds, setNewCollectionIds] = useState<number[]>([]);
  const [newCollectionError, setNewCollectionError] = useState('');
  const [newCollectionSearch, setNewCollectionSearch] = useState('');

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: prods }, { data: setting }, { data: ncTitle }, { data: ncIds }] = await Promise.all([
      supabaseAuth.from('products').select('id, name, price, featured, product_images(url)').eq('available', true).order('name'),
      supabaseAuth.from('site_settings').select('value').eq('key', 'about_image_url').single(),
      supabaseAuth.from('site_settings').select('value').eq('key', 'new_collection_title').single(),
      supabaseAuth.from('site_settings').select('value').eq('key', 'new_collection_product_ids').single(),
    ]);
    const loadedProducts = prods || [];
    setProducts(loadedProducts);
    setFeaturedOrder(loadedProducts.filter(p => p.featured).map(p => p.id));
    setAboutImage(setting?.value ?? null);
    setNewCollectionTitle(ncTitle?.value ?? 'New Collection');
    setNewCollectionIds(ncIds?.value ? JSON.parse(ncIds.value) : []);
  };

  const extractStoragePath = (url: string): string | null => {
    const marker = 'product-image/';
    const idx = url.indexOf(marker);
    return idx !== -1 ? url.slice(idx + marker.length) : null;
  };

  const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAbout(true);

    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileName = `about-image-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabaseAuth.storage.from('product-image').upload(fileName, file, { upsert: true });

    if (uploadError) {
      alert(`Upload failed: ${uploadError.message}`);
      setUploadingAbout(false);
      return;
    }

    const { data: urlData } = supabaseAuth.storage.from('product-image').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const res = await fetch('/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'about_image_url', value: publicUrl }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      alert(`Saved to storage but failed to update database: ${error}`);
      setUploadingAbout(false);
      return;
    }

    setAboutImage(publicUrl);
    setUploadingAbout(false);
    setSavedMsg('Saved!');
    setSavedMsgSection('about');
    setTimeout(() => { setSavedMsg(''); setSavedMsgSection(''); }, 2000);
  };

  const removeAboutImage = async () => {
    // Clear the DB reference first — if this fails, the file stays and the
    // About page keeps working. Storage cleanup only happens after.
    const res = await fetch('/api/admin/site-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'about_image_url', value: null }),
    });
    if (!res.ok) {
      alert('Failed to remove the image. Please try again.');
      return;
    }
    if (aboutImage) {
      const path = extractStoragePath(aboutImage);
      if (path) {
        const { error } = await supabaseAuth.storage.from('product-image').remove([path]);
        if (error) console.error('Storage delete error:', error.message);
      }
    }
    setAboutImage(null);
  };

  const toggleFeatured = async (productId: number, current: boolean) => {
    const featured = products.filter(p => p.featured).length;
    if (!current && featured >= 8) {
      setFeaturedError('Maximum 8 featured products. Remove one first.');
      setTimeout(() => setFeaturedError(''), 3000);
      return;
    }
    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [productId], featured: !current }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setFeaturedError(`Save failed: ${error}`);
      setTimeout(() => setFeaturedError(''), 3000);
      return;
    }
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, featured: !current } : p));
    setFeaturedOrder(prev =>
      !current ? [...prev, productId] : prev.filter(id => id !== productId)
    );
    setSavedMsg('Saved!');
    setSavedMsgSection('featured');
    setTimeout(() => { setSavedMsg(''); setSavedMsgSection(''); }, 2000);
  };

  const moveFeatured = (index: number, direction: -1 | 1) => {
    const newOrder = [...featuredOrder];
    const swapIdx = index + direction;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[index], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[index]];
    setFeaturedOrder(newOrder);
    // Note: cosmetic reorder only — no featured_position column in DB
  };

  const featuredProducts = featuredOrder
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined && p.featured);

  const saveNewCollection = async () => {
    const [r1, r2] = await Promise.all([
      fetch('/api/admin/site-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'new_collection_title', value: newCollectionTitle }) }),
      fetch('/api/admin/site-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'new_collection_product_ids', value: JSON.stringify(newCollectionIds) }) }),
    ]);
    if (!r1.ok || !r2.ok) {
      setNewCollectionError('Save failed. Please try again.');
      setTimeout(() => setNewCollectionError(''), 3000);
      return;
    }
    setSavedMsg('Saved!');
    setSavedMsgSection('new_collection');
    setTimeout(() => { setSavedMsg(''); setSavedMsgSection(''); }, 2000);
  };

  const toggleNewCollection = (productId: number) => {
    setNewCollectionIds(prev => {
      if (prev.includes(productId)) return prev.filter(id => id !== productId);
      if (prev.length >= 8) {
        setNewCollectionError('Maximum 8 products. Remove one first.');
        setTimeout(() => setNewCollectionError(''), 3000);
        return prev;
      }
      return [...prev, productId];
    });
  };

  const moveNewCollection = (index: number, direction: -1 | 1) => {
    setNewCollectionIds(prev => {
      const next = [...prev];
      const swapIdx = index + direction;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next;
    });
  };

  const newCollectionProducts = newCollectionIds.map(id => products.find(p => p.id === id)).filter((p): p is Product => p !== undefined);

  return (
    <div>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>
            Media & Content
          </h2>
        </div>

        {/* New Collection */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <input
                value={newCollectionTitle}
                onChange={e => setNewCollectionTitle(e.target.value)}
                style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C', border: 'none', borderBottom: '1px solid #E8DDD3', outline: 'none', background: 'transparent', minWidth: '200px' }}
              />
              {savedMsg && savedMsgSection === 'new_collection' && (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{savedMsg}</span>
              )}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87' }}>
              The first product section on the homepage (under the hero, labeled &quot;Just Arrived&quot;). Edit the title above and select up to 8 products. Currently selected {newCollectionProducts.length} product{newCollectionProducts.length !== 1 ? 's' : ''}. If no products are selected, the section is hidden on the homepage.
            </p>
            {newCollectionError && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C62828', marginTop: '0.4rem' }}>{newCollectionError}</p>
            )}
          </div>

          {/* Currently selected */}
          {newCollectionProducts.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem' }}>
                Currently Selected
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {newCollectionProducts.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#FAF7F4', border: '1px solid #C9A882' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '0.25rem' }}>
                      <button
                        onClick={() => moveNewCollection(idx, -1)}
                        disabled={idx === 0}
                        style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D4C4B5' : '#9A8F87', fontSize: '0.65rem', lineHeight: 1, padding: '1px 3px' }}
                        title="Move up"
                      >▲</button>
                      <button
                        onClick={() => moveNewCollection(idx, 1)}
                        disabled={idx === newCollectionProducts.length - 1}
                        style={{ background: 'none', border: 'none', cursor: idx === newCollectionProducts.length - 1 ? 'default' : 'pointer', color: idx === newCollectionProducts.length - 1 ? '#D4C4B5' : '#9A8F87', fontSize: '0.65rem', lineHeight: 1, padding: '1px 3px' }}
                        title="Move down"
                      >▼</button>
                    </div>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', flex: 1 }}>{p.name}</span>
                    <button onClick={() => toggleNewCollection(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A8F87', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <input
            placeholder="Search products..."
            value={newCollectionSearch}
            onChange={e => setNewCollectionSearch(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', outline: 'none', width: '100%', marginBottom: '1rem' }}
          />

          {/* All products grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {products.filter(p => p.name.toLowerCase().includes(newCollectionSearch.toLowerCase())).map(product => {
              const selected = newCollectionIds.includes(product.id);
              return (
                <div key={product.id} style={{
                  display: 'flex', gap: '0.75rem', alignItems: 'center',
                  padding: '0.75rem', border: `1px solid ${selected ? '#C9A882' : '#E8DDD3'}`,
                  backgroundColor: selected ? '#FAF7F4' : '#FFFFFF',
                  cursor: 'pointer',
                }} onClick={() => toggleNewCollection(product.id)}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button onClick={saveNewCollection} style={{ padding: '0.6rem 1.8rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none', fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Save
            </button>
          </div>
        </div>

        {/* Best Sellers */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C' }}>
                Best Sellers
              </h3>
              {savedMsg && savedMsgSection === 'featured' && (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{savedMsg}</span>
              )}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87' }}>
              The second product section on the homepage (labeled &quot;Customer Favourites&quot;). Select up to 8 products. Currently selected {featuredProducts.length} product{featuredProducts.length !== 1 ? 's' : ''}.
            </p>
            {featuredError && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C62828', marginTop: '0.4rem' }}>{featuredError}</p>
            )}
          </div>

          {/* Currently featured */}
          {featuredProducts.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem' }}>
                Currently Featured
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {featuredProducts.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#FAF7F4', border: '1px solid #C9A882' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginRight: '0.25rem' }}>
                      <button
                        onClick={() => moveFeatured(idx, -1)}
                        disabled={idx === 0}
                        style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D4C4B5' : '#9A8F87', fontSize: '0.65rem', lineHeight: 1, padding: '1px 3px' }}
                        title="Move up"
                      >▲</button>
                      <button
                        onClick={() => moveFeatured(idx, 1)}
                        disabled={idx === featuredProducts.length - 1}
                        style={{ background: 'none', border: 'none', cursor: idx === featuredProducts.length - 1 ? 'default' : 'pointer', color: idx === featuredProducts.length - 1 ? '#D4C4B5' : '#9A8F87', fontSize: '0.65rem', lineHeight: 1, padding: '1px 3px' }}
                        title="Move down"
                      >▼</button>
                    </div>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', flex: 1 }}>{p.name}</span>
                    <button onClick={() => toggleFeatured(p.id, true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A8F87', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All products list */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {products.map(product => (
              <div key={product.id} style={{
                display: 'flex', gap: '0.75rem', alignItems: 'center',
                padding: '0.75rem', border: `1px solid ${product.featured ? '#C9A882' : '#E8DDD3'}`,
                backgroundColor: product.featured ? '#FAF7F4' : '#FFFFFF',
                cursor: 'pointer',
              }} onClick={() => toggleFeatured(product.id, product.featured)}>
                {/* Thumbnail */}
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
                  border: `2px solid ${product.featured ? '#C9A882' : '#E8DDD3'}`,
                  backgroundColor: product.featured ? '#C9A882' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {product.featured && <span style={{ color: '#FAF7F4', fontSize: '0.6rem' }}>✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Page Image */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C' }}>
                About Page Image
              </h3>
              {savedMsg && savedMsgSection === 'about' && (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{savedMsg}</span>
              )}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87' }}>
              Shown on the About page (&quot;Our Story&quot;), next to the &quot;The woman behind Bloomingdew&quot; text. Not on the homepage.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {/* Preview */}
            <div style={{
              width: '180px', flexShrink: 0,
              aspectRatio: '4/5', backgroundColor: '#F5F5F5', border: '1px solid #E8DDD3',
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {aboutImage ? (
                <>
                  <img src={aboutImage} alt="About page" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={removeAboutImage}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none',
                      width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.7rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </>
              ) : (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87' }}>
                  No image
                </span>
              )}
              {uploadingAbout && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(250,247,244,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C9A882' }}>Uploading...</span>
                </div>
              )}
            </div>

            {/* Upload button */}
            <div>
              <label style={{
                display: 'inline-block', padding: '0.6rem 1.5rem',
                border: '1px solid #E8DDD3', cursor: 'pointer',
                fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87',
                backgroundColor: '#FAFAFA',
              }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAboutImageUpload} />
                {aboutImage ? 'Replace Image' : '+ Upload Image'}
              </label>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 300, color: '#9A8F87', marginTop: '0.75rem' }}>
                Recommended: portrait orientation (4:5 ratio)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
