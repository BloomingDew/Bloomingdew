'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, supabaseAuth } from '../../../../lib/supabase-admin';
import { supabase } from '../../../../lib/supabase';
import { compressImage } from '../../../../lib/compressImage';
import { toast } from '../../../../components/Toast';

type Category = { id: number; name: string };
type PendingColour = { name: string; hex_code: string };
type SizeInventory = { size: string; quantity: number };

const DEFAULT_SIZES = ['6', '8', '10', '12', '14', '16', '18', '20'];
const MAX_IMAGES = 12;
// Bucket key used when the product has no colourways.
const NO_COLOUR = '__none';

const zeroedSizes = (): SizeInventory[] => DEFAULT_SIZES.map(size => ({ size, quantity: 0 }));

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  // colourIndex tags a photo to a colourway (null = shown for every colour).
  const [images, setImages] = useState<{ url: string; alt_text: string; path: string; colourIndex: number | null }[]>([]);
  // Colours have no ids until the product is created, so stock buckets are
  // keyed by the colour's index in pendingColours (NO_COLOUR when disabled).
  const [sizeInventory, setSizeInventory] = useState<Record<string, SizeInventory[]>>({
    [NO_COLOUR]: zeroedSizes(),
  });
  const [activeColourIndex, setActiveColourIndex] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasColours, setHasColours] = useState(false);
  const [pendingColours, setPendingColours] = useState<PendingColour[]>([]);
  const [newColourName, setNewColourName] = useState('');
  const [newColourHex, setNewColourHex] = useState('#000000');

  const [form, setForm] = useState({
    name: '', price: '', category_id: '', discount: '0',
    description: '', fabric: '', care_instructions: '',
    available: true, made_to_order: true, lead_time: '2–4 weeks',
  });

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length >= MAX_IMAGES) {
      toast(`Maximum ${MAX_IMAGES} images per product.`, 'error');
      return;
    }
    setUploadingImage(true);

    // Compress client-side (phone photos are often 3-12 MB) and upload in
    // parallel; results are appended in the original selection order.
    const slots = Math.max(0, MAX_IMAGES - images.length);
    const selected = Array.from(files).slice(0, slots);
    const uploaded = await Promise.all(selected.map(async (file) => {
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabaseAuth.storage.from('product-image').upload(fileName, compressed);
      if (error) return null;
      const { data } = supabaseAuth.storage.from('product-image').getPublicUrl(fileName);
      return { url: data.publicUrl, alt_text: form.name || file.name, path: fileName, colourIndex: null };
    }));
    const successful = uploaded.filter((u): u is NonNullable<typeof u> => u !== null);
    if (successful.length > 0) setImages(prev => [...prev, ...successful].slice(0, MAX_IMAGES));
    setUploadingImage(false);
  };

  const removeImage = async (index: number) => {
    const img = images[index];
    if (img?.path) {
      await supabaseAuth.storage.from('product-image').remove([img.path]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    setImages(newImages);
  };

  const setImageColour = (imageIndex: number, colourIndex: number | null) => {
    setImages(prev => prev.map((img, i) => i === imageIndex ? { ...img, colourIndex } : img));
  };

  const addColour = () => {
    if (!newColourName.trim()) return;
    const idx = pendingColours.length;
    setPendingColours(prev => [...prev, { name: newColourName.trim(), hex_code: newColourHex }]);
    // New colour gets its own zeroed size grid straight away.
    setSizeInventory(prev => ({ ...prev, [String(idx)]: zeroedSizes() }));
    setNewColourName(''); setNewColourHex('#000000');
  };

  const removeColour = (idx: number) => {
    setPendingColours(prev => prev.filter((_, i) => i !== idx));
    // Buckets are index-keyed, so drop the removed one and re-index the rest.
    setSizeInventory(prev => {
      const next: Record<string, SizeInventory[]> = { [NO_COLOUR]: prev[NO_COLOUR] || zeroedSizes() };
      let cursor = 0;
      for (let i = 0; i < pendingColours.length; i++) {
        if (i === idx) continue;
        next[String(cursor)] = prev[String(i)] || zeroedSizes();
        cursor++;
      }
      return next;
    });
    setImages(prev => prev.map(img => {
      if (img.colourIndex === null) return img;
      if (img.colourIndex === idx) return { ...img, colourIndex: null };
      return img.colourIndex > idx ? { ...img, colourIndex: img.colourIndex - 1 } : img;
    }));
    setActiveColourIndex(cur => (cur >= idx && cur > 0 ? cur - 1 : cur));
  };

  // When colours are enabled, stock is edited one colour at a time.
  const useColourStock = hasColours && pendingColours.length > 0;
  const activeKey = useColourStock
    ? String(Math.min(activeColourIndex, pendingColours.length - 1))
    : NO_COLOUR;
  const activeSizes = sizeInventory[activeKey] || zeroedSizes();

  const setQuantity = (size: string, quantity: number) => {
    setSizeInventory(prev => ({
      ...prev,
      [activeKey]: (prev[activeKey] || zeroedSizes()).map(s => s.size === size ? { ...s, quantity } : s),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.category_id) {
      setError('Please select a category before saving.');
      setLoading(false);
      return;
    }

    // Flatten to [{ size, quantity, colourIndex }] — colourIndex maps into the
    // `colours` array posted below (null when the product has no colourways).
    const flatInventory = useColourStock
      ? pendingColours.flatMap((_c, idx) => (sizeInventory[String(idx)] || zeroedSizes())
          .map(s => ({ size: s.size, quantity: s.quantity, colourIndex: idx })))
      : (sizeInventory[NO_COLOUR] || zeroedSizes())
          .map(s => ({ size: s.size, quantity: s.quantity, colourIndex: null }));

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product: {
          name: form.name, slug,
          price: parseFloat(form.price),
          discount: parseInt(form.discount) || 0,
          sizes: DEFAULT_SIZES,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          description: form.description,
          fabric: form.fabric,
          care_instructions: form.care_instructions,
          available: form.available,
          made_to_order: form.made_to_order,
          lead_time: form.lead_time,
          has_colours: hasColours,
        },
        images: images.map(img => ({
          url: img.url,
          alt_text: img.alt_text || form.name,
          colourIndex: hasColours ? img.colourIndex : null,
        })),
        sizeInventory: flatInventory,
        colours: hasColours ? pendingColours : [],
      }),
    });

    const result = await res.json().catch(() => ({ error: 'Unknown error' }));

    if (!res.ok) {
      // If the product itself failed (no id returned), clean up uploaded images.
      if (!result.id) {
        const paths = images.map(i => i.path).filter(Boolean);
        if (paths.length > 0) {
          await supabaseAuth.storage.from('product-image').remove(paths);
        }
      }
      setError(result.error || 'Failed to create product.');
      setLoading(false);
      return;
    }

    setSuccess('Product created!');
    setLoading(false);
    setTimeout(() => router.push(`/admin/products/${result.id}`), 2500);
  };

  const totalStock = activeSizes.reduce((sum, s) => sum + s.quantity, 0);
  const allColoursStock = useColourStock
    ? pendingColours.reduce((sum, _c, idx) => sum + (sizeInventory[String(idx)] || []).reduce((n, s) => n + s.quantity, 0), 0)
    : totalStock;

  return (
    <div>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '2.5rem' }}>
          Add New Product
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Product Info */}
          <div style={card}>
            <h3 style={cardHeading}>Product Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Product Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Linen Wrap Dress" />
              </div>
              <div>
                <label style={labelStyle}>Price (USD $) *</label>
                <input required type="number" step="0.01" style={inputStyle} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="120.00" />
              </div>
              <div>
                <label style={labelStyle}>Discount (%)</label>
                <input type="number" min="0" max="100" style={inputStyle} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="0" />
                {parseInt(form.discount) > 0 && form.price && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C0392B', marginTop: '0.4rem' }}>
                    Sale price: ${Math.round(parseFloat(form.price) * (1 - parseInt(form.discount) / 100)).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Category <span style={{ color: '#C0392B' }}>*</span></label>
                <select style={{ ...inputStyle, borderColor: !form.category_id && error ? '#C0392B' : undefined }} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the piece..." />
              </div>
            </div>
          </div>

          {/* Images */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
              <h3 style={{ ...cardHeading, marginBottom: 0 }}>Product Images</h3>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>
                {images.length}/{MAX_IMAGES} images · First image is the main photo
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              {Array.from({ length: MAX_IMAGES }).map((_, i) => {
                const img = images[i];
                return (
                  <div key={i}>
                    <div style={{
                      aspectRatio: '3/4', border: `2px ${img ? 'solid' : 'dashed'} ${i === 0 ? '#C9A882' : '#E8DDD3'}`,
                      position: 'relative', overflow: 'hidden',
                      background: 'linear-gradient(150deg, #F5F5F5, #EBEBEB)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {img ? (
                        <>
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeImage(i)} style={{
                            position: 'absolute', top: '4px', right: '4px',
                            backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none',
                            width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>✕</button>
                          <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '3px' }}>
                            {i > 0 && (
                              <button type="button" onClick={() => moveImage(i, 'up')} style={{ backgroundColor: 'rgba(44,44,44,0.7)', color: '#FAF7F4', border: 'none', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem' }}>←</button>
                            )}
                            {i < images.length - 1 && (
                              <button type="button" onClick={() => moveImage(i, 'down')} style={{ backgroundColor: 'rgba(44,44,44,0.7)', color: '#FAF7F4', border: 'none', width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem' }}>→</button>
                            )}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.6rem', color: '#CCCCCC', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {i === 0 ? 'Main' : `Photo ${i + 1}`}
                        </span>
                      )}
                    </div>
                    {i === 0 && (
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', color: '#C9A882', textAlign: 'center', marginTop: '0.3rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Main</p>
                    )}
                    {/* Tag the photo to a colourway */}
                    {img && hasColours && pendingColours.length > 0 && (
                      <select
                        value={img.colourIndex === null ? '' : String(img.colourIndex)}
                        onChange={e => setImageColour(i, e.target.value === '' ? null : Number(e.target.value))}
                        style={{
                          width: '100%', marginTop: '0.4rem', padding: '0.3rem 0.4rem',
                          border: `1px solid ${img.colourIndex === null ? '#E8DDD3' : '#C9A882'}`,
                          backgroundColor: img.colourIndex === null ? '#FFFFFF' : '#FBF7F2',
                          fontFamily: "'Jost', sans-serif", fontSize: '0.7rem',
                          color: '#2C2C2C', outline: 'none', cursor: 'pointer',
                        }}
                      >
                        <option value="">All colours</option>
                        {pendingColours.map((c, ci) => (
                          <option key={ci} value={ci}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {images.length < MAX_IMAGES && (
              <label style={{ display: 'block', border: '2px dashed #E8DDD3', padding: '1.2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA' }}>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                {uploadingImage
                  ? <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#C9A882' }}>Uploading...</p>
                  : <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87' }}>+ Upload images ({images.length}/{MAX_IMAGES} used)</p>
                }
              </label>
            )}
          </div>

          {/* Colour Variants */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ ...cardHeading, marginBottom: 0 }}>Colour Variants</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={hasColours} onChange={e => setHasColours(e.target.checked)} />
                Enable colour variants for this product
              </label>
            </div>

            {hasColours && (
              <div>
                {pendingColours.map((colour, idx) => {
                  const tagged = images.filter(im => im.colourIndex === idx).length;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid #E8DDD3', marginBottom: '0.5rem' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: colour.hex_code, border: '2px solid #E8DDD3', flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C', flex: 1 }}>{colour.name}</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: tagged > 0 ? '#2E7D32' : '#9A8F87' }}>
                        {tagged > 0 ? `${tagged} photo${tagged !== 1 ? 's' : ''} tagged` : 'uses main photos'}
                      </span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>{colour.hex_code}</span>
                      <button type="button" onClick={() => removeColour(idx)} style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem' }}>Remove</button>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Colour Name</label>
                    <input style={inputStyle} placeholder="e.g. Midnight Navy" value={newColourName} onChange={e => setNewColourName(e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Swatch</label>
                    <input type="color" value={newColourHex} onChange={e => setNewColourHex(e.target.value)} style={{ width: '52px', height: '44px', border: '1px solid #E8DDD3', cursor: 'pointer', padding: '2px' }} />
                  </div>
                  <button type="button" onClick={addColour} style={{ padding: '0.85rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap', height: '44px' }}>
                    Add Colour
                  </button>
                </div>

                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', marginTop: '0.75rem', lineHeight: 1.7 }}>
                  Upload every photo once in Product Images above, then tag each one with the
                  colour it shows. Untagged photos are used for any colour that has none of its
                  own. Stock is set per colour in Size &amp; Stock below.
                </p>
              </div>
            )}
          </div>

          {/* Materials */}
          <div style={card}>
            <h3 style={cardHeading}>Materials & Care</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Fabric / Material</label>
                <input style={inputStyle} value={form.fabric} onChange={e => setForm({ ...form, fabric: e.target.value })} placeholder="e.g. 100% Natural Linen" />
              </div>
              <div>
                <label style={labelStyle}>Care Instructions</label>
                <input style={inputStyle} value={form.care_instructions} onChange={e => setForm({ ...form, care_instructions: e.target.value })} placeholder="e.g. Hand wash cold" />
              </div>
              <div>
                <label style={labelStyle}>Lead Time</label>
                <input style={inputStyle} value={form.lead_time} onChange={e => setForm({ ...form, lead_time: e.target.value })} placeholder="2–4 weeks" />
              </div>
            </div>
          </div>

          {/* Availability & Stock */}
          <div style={card}>
            <h3 style={cardHeading}>Availability & Stock</h3>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                Visible on site
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={form.made_to_order} onChange={e => setForm({ ...form, made_to_order: e.target.checked })} />
                Made to Order
              </label>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                <label style={labelStyle}>{useColourStock ? 'Stock per Size & Colour' : 'Stock per Size'}</label>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>
                  Total: {totalStock} units
                </span>
              </div>

              {useColourStock && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {pendingColours.map((colour, idx) => {
                      const active = String(idx) === activeKey;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveColourIndex(idx)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.9rem', cursor: 'pointer',
                            backgroundColor: active ? '#FBF7F2' : '#FFFFFF',
                            border: `1px solid ${active ? '#C9A882' : '#E8DDD3'}`,
                            color: active ? '#2C2C2C' : '#9A8F87',
                            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                            letterSpacing: '0.05em',
                          }}
                        >
                          <span style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colour.hex_code, border: '1px solid #E8DDD3', flexShrink: 0 }} />
                          {colour.name}
                        </button>
                      );
                    })}
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#9A8F87', marginTop: '0.6rem' }}>
                    All colours: {allColoursStock} units
                  </p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.75rem' }}>
                {activeSizes.map(({ size, quantity }) => (
                  <div key={size} style={{ textAlign: 'center' }}>
                    <label style={{ ...labelStyle, textAlign: 'center', marginBottom: '0.4rem' }}>{size}</label>
                    <input
                      type="number" min="0"
                      value={quantity}
                      onChange={e => setQuantity(size, parseInt(e.target.value) || 0)}
                      style={{ ...inputStyle, textAlign: 'center', padding: '0.6rem 0.4rem' }}
                    />
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', color: quantity === 0 ? '#C0392B' : quantity <= 3 ? '#E65100' : '#2E7D32', marginTop: '0.3rem' }}>
                      {quantity === 0 ? 'Sold out' : quantity <= 3 ? 'Low stock' : 'In stock'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B' }}>{error}</p>}
          {success && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{success}</p>}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Save Product'}
            </button>
            <Link href="/admin" style={{ padding: '1.1rem 2rem', border: '1px solid #E8DDD3', color: '#2C2C2C', fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { backgroundColor: '#FFFFFF', padding: '2rem', border: '1px solid #E8DDD3' };
const cardHeading: React.CSSProperties = { fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.85rem 1rem', backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', color: '#2C2C2C', fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, outline: 'none', appearance: 'none' };
