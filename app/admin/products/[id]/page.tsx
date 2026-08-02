'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, supabaseAuth } from '../../../../lib/supabase-admin';
import { supabase } from '../../../../lib/supabase';
import { compressImage } from '../../../../lib/compressImage';
import { toast } from '../../../../components/Toast';

type Category = { id: number; name: string };
type ProductImage = { id: number; url: string; alt_text: string; position: number };
type SizeInventory = { size: string; quantity: number };
type InventoryRow = { size: string; quantity: number; colour_id: string | null };
type Colour = { id: string; name: string; hex_code: string; display_order: number; is_available: boolean };

const DEFAULT_SIZES = ['6', '8', '10', '12', '14', '16', '18', '20'];
const MAX_IMAGES = 4;
// Bucket key used when a product has no colourways (colour_id IS NULL).
const NO_COLOUR = '__none';

const zeroedSizes = (): SizeInventory[] => DEFAULT_SIZES.map(size => ({ size, quantity: 0 }));

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  // Stock is per colour: key is the colour id, or NO_COLOUR for products
  // without colourways.
  const [sizeInventory, setSizeInventory] = useState<Record<string, SizeInventory[]>>({
    [NO_COLOUR]: zeroedSizes(),
  });
  const [activeColourId, setActiveColourId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasColours, setHasColours] = useState(false);
  const [colours, setColours] = useState<Colour[]>([]);
  const [newColourName, setNewColourName] = useState('');
  const [newColourHex, setNewColourHex] = useState('#000000');
  const [uploadingColourId, setUploadingColourId] = useState<string | null>(null);
  const [colourImages, setColourImages] = useState<Record<string, ProductImage[]>>({});

  const [form, setForm] = useState({
    name: '', price: '', category_id: '', discount: '0',
    description: '', fabric: '', care_instructions: '',
    available: true, made_to_order: true, lead_time: '2–4 weeks',
  });

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []));
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    const [{ data }, { data: inventory }] = await Promise.all([
      supabase.from('products').select('*, product_images(*)').eq('id', id).single(),
      supabase.from('product_size_inventory').select('size, quantity, colour_id').eq('product_id', id),
    ]);

    if (data) {
      setForm({
        name: data.name, price: data.price.toString(), discount: (data.discount || 0).toString(),
        category_id: data.category_id?.toString() || '',
        description: data.description || '', fabric: data.fabric || '',
        care_instructions: data.care_instructions || '',
        available: data.available, made_to_order: data.made_to_order,
        lead_time: data.lead_time || '2–4 weeks',
      });
      const sorted = [...(data.product_images || [])].sort((a: ProductImage, b: ProductImage) => a.position - b.position);
      setImages(sorted);
      if (data.updated_at) setUpdatedAt(data.updated_at);
      setHasColours(data.has_colours || false);
    }

    const { data: coloursData } = await supabaseAuth.from('product_colours')
      .select('*').eq('product_id', id).order('display_order');
    setColours(coloursData || []);
    if (coloursData?.length) setActiveColourId(coloursData[0].id);
    if (coloursData?.length) {
      const colImgs: Record<string, ProductImage[]> = {};
      for (const c of coloursData) {
        const { data: imgs } = await supabaseAuth.from('product_images')
          .select('*').eq('product_id', parseInt(id)).eq('colour_id', c.id).order('position');
        colImgs[c.id] = imgs || [];
      }
      setColourImages(colImgs);
    }

    // Every colour (plus the no-colour bucket) starts with all sizes at 0, then
    // saved rows are bucketed in by colour_id.
    const buckets: Record<string, SizeInventory[]> = { [NO_COLOUR]: zeroedSizes() };
    for (const c of coloursData || []) buckets[c.id] = zeroedSizes();

    for (const row of (inventory || []) as InventoryRow[]) {
      const key = row.colour_id ?? NO_COLOUR;
      if (!buckets[key]) buckets[key] = zeroedSizes();
      const slot = buckets[key].find(s => s.size === row.size);
      if (slot) slot.quantity = row.quantity || 0;
    }
    setSizeInventory(buckets);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length >= MAX_IMAGES) {
      toast(`Maximum ${MAX_IMAGES} images per product.`, 'error');
      return;
    }
    setUploadingImage(true);

    for (const file of Array.from(files)) {
      if (images.length >= MAX_IMAGES) break;
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabaseAuth.storage.from('product-image').upload(fileName, compressed);
      if (!error) {
        const { data } = supabaseAuth.storage.from('product-image').getPublicUrl(fileName);
        const res = await fetch('/api/admin/product-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: parseInt(id), url: data.publicUrl,
            altText: form.name, position: images.length,
          }),
        });
        if (res.ok) {
          const { image } = await res.json();
          setImages(prev => [...prev, image]);
        } else {
          // DB row failed — remove the orphaned storage file and surface it.
          await supabaseAuth.storage.from('product-image').remove([fileName]);
          const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
          toast(`Image upload failed: ${msg}`, 'error');
        }
      }
    }
    setUploadingImage(false);
  };

  const savePositions = async (updated: ProductImage[]) => {
    const res = await fetch('/api/admin/product-images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positions: updated.map(img => ({ id: img.id, position: img.position })) }),
    });
    return res.ok;
  };

  const deleteImage = async (imageId: number) => {
    const img = images.find(i => i.id === imageId);
    const res = await fetch('/api/admin/product-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId, url: img?.url }),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to delete image: ${msg}`, 'error');
      return;
    }
    const updated = images.filter(i => i.id !== imageId)
      .map((i, idx) => ({ ...i, position: idx }));
    await savePositions(updated);
    setImages(updated);
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    const updated = newImages.map((img, i) => ({ ...img, position: i }));
    const ok = await savePositions(updated);
    if (ok) setImages(updated);
  };

  const addColour = async () => {
    if (!newColourName.trim()) return;
    const res = await fetch('/api/admin/product-colours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: parseInt(id), name: newColourName.trim(),
        hexCode: newColourHex, displayOrder: colours.length,
      }),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to add colour: ${msg}`, 'error');
      return;
    }
    const { colour } = await res.json();
    setColours(prev => [...prev, colour]);
    setColourImages(prev => ({ ...prev, [colour.id]: [] }));
    // A new colour gets its own zeroed size grid straight away.
    setSizeInventory(prev => ({ ...prev, [colour.id]: zeroedSizes() }));
    setActiveColourId(prev => prev ?? colour.id);
    setNewColourName(''); setNewColourHex('#000000');
  };

  const deleteColour = async (colourId: string) => {
    if (!confirm('Delete this colour and its images?')) return;
    const res = await fetch('/api/admin/product-colours', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: colourId }),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to delete colour: ${msg}`, 'error');
      return;
    }
    setColours(prev => {
      const remaining = prev.filter(c => c.id !== colourId);
      setActiveColourId(cur => (cur === colourId ? (remaining[0]?.id ?? null) : cur));
      return remaining;
    });
    setColourImages(prev => { const n = {...prev}; delete n[colourId]; return n; });
    setSizeInventory(prev => { const n = {...prev}; delete n[colourId]; return n; });
  };

  const handleColourImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, colourId: string) => {
    const files = e.target.files;
    if (!files?.length) return;
    const existing = colourImages[colourId] || [];
    if (existing.length >= 4) { toast('Maximum 4 images per colour.', 'error'); return; }
    setUploadingColourId(colourId);
    for (const file of Array.from(files)) {
      if ((colourImages[colourId]?.length || 0) >= 4) break;
      const compressed = await compressImage(file);
      const ext = compressed.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabaseAuth.storage.from('product-image').upload(fileName, compressed);
      if (!error) {
        const { data: urlData } = supabaseAuth.storage.from('product-image').getPublicUrl(fileName);
        const pos = (colourImages[colourId]?.length || 0);
        const res = await fetch('/api/admin/product-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: parseInt(id), url: urlData.publicUrl,
            altText: `${form.name} - ${colours.find(c=>c.id===colourId)?.name}`,
            position: pos, colourId,
          }),
        });
        if (res.ok) {
          const { image } = await res.json();
          setColourImages(prev => ({ ...prev, [colourId]: [...(prev[colourId]||[]), image] }));
        } else {
          await supabaseAuth.storage.from('product-image').remove([fileName]);
          const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
          toast(`Image upload failed: ${msg}`, 'error');
        }
      }
    }
    setUploadingColourId(null);
  };

  const deleteColourImage = async (colourId: string, imageId: number) => {
    const img = (colourImages[colourId] || []).find(i => i.id === imageId);
    const res = await fetch('/api/admin/product-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: imageId, url: img?.url }),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to delete image: ${msg}`, 'error');
      return;
    }
    setColourImages(prev => ({ ...prev, [colourId]: (prev[colourId]||[]).filter(i=>i.id!==imageId) }));
  };

  // When the product has colourways, stock is edited one colour at a time.
  const useColourStock = hasColours && colours.length > 0;
  const activeKey = useColourStock ? (activeColourId ?? colours[0].id) : NO_COLOUR;
  const activeSizes = sizeInventory[activeKey] || zeroedSizes();

  const setQuantity = (size: string, quantity: number) => {
    setSizeInventory(prev => ({
      ...prev,
      [activeKey]: (prev[activeKey] || zeroedSizes()).map(s => s.size === size ? { ...s, quantity } : s),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Flatten every bucket into [{ size, quantity, colourId }] — colourId is
    // null for the no-colour bucket.
    const flatInventory = useColourStock
      ? colours.flatMap(c => (sizeInventory[c.id] || zeroedSizes())
          .map(s => ({ size: s.size, quantity: s.quantity, colourId: c.id })))
      : (sizeInventory[NO_COLOUR] || zeroedSizes())
          .map(s => ({ size: s.size, quantity: s.quantity, colourId: null }));

    const allZero = flatInventory.every(s => s.quantity === 0);
    if (allZero && !window.confirm('All sizes have 0 stock. Save anyway?')) return;

    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: parseInt(id),
        fields: {
          name: form.name,
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
        sizeInventory: flatInventory,
      }),
    });

    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setError(msg || 'Failed to save.');
      setLoading(false);
      return;
    }

    setSuccess('Product updated!');
    setDirty(false);
    setLoading(false);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [parseInt(id)] }),
    });
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: 'Unknown error' }));
      toast(`Failed to delete: ${msg}`, 'error');
      return;
    }
    router.push('/admin');
  };

  const totalStock = activeSizes.reduce((sum, s) => sum + s.quantity, 0);
  const allColoursStock = useColourStock
    ? colours.reduce((sum, c) => sum + (sizeInventory[c.id] || []).reduce((n, s) => n + s.quantity, 0), 0)
    : totalStock;

  // Warn before leaving with unsaved form/stock changes.
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Stock-change history for this product.
  const [movements, setMovements] = useState<{ id: number; size: string; delta: number; reason: string; admin_email: string | null; created_at: string }[]>([]);
  const [showMovements, setShowMovements] = useState(false);
  useEffect(() => {
    fetch(`/api/admin/inventory-movements?productId=${id}`)
      .then(r => r.ok ? r.json() : { movements: [] })
      .then(({ movements: rows }) => setMovements(rows || []))
      .catch(() => {});
  }, [id]);

  return (
    <div>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.3rem' }}>Edit Product</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {updatedAt && (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#B0A89E' }}>
                  Last updated {new Date(updatedAt).toLocaleString()}
                </span>
              )}
              <a href={`/products/${id}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C9A882', textDecoration: 'none', letterSpacing: '0.05em' }}>
                View on site →
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} onChange={() => setDirty(true)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Product Info */}
          <div style={card}>
            <h3 style={cardHeading}>Product Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Product Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Price (USD $) *</label>
                <input required type="number" step="0.01" style={inputStyle} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
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
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              {/* Image slots */}
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
                          <button type="button" onClick={() => deleteImage(img.id)} style={{
                            position: 'absolute', top: '4px', right: '4px',
                            backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none',
                            width: '22px', height: '22px', cursor: 'pointer', fontSize: '0.7rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>✕</button>
                          {/* Move buttons */}
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
                {colours.map(colour => (
                  <div key={colour.id} style={{ border: '1px solid #E8DDD3', padding: '1.25rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: colour.hex_code, border: '2px solid #E8DDD3', flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C', flex: 1 }}>{colour.name}</span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>{colour.hex_code}</span>
                      <button type="button" onClick={() => deleteColour(colour.id)} style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem' }}>Remove</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {(colourImages[colour.id] || []).map(img => (
                        <div key={img.id} style={{ aspectRatio: '3/4', position: 'relative', overflow: 'hidden', background: '#F5F5F5' }}>
                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => deleteColourImage(colour.id, img.id)} style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, backgroundColor: '#2C2C2C', color: '#FFF', border: 'none', cursor: 'pointer', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      ))}
                      {(colourImages[colour.id]?.length || 0) < 4 && (
                        <label style={{ aspectRatio: '3/4', border: '2px dashed #E8DDD3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FAFAFA' }}>
                          <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleColourImageUpload(e, colour.id)} />
                          {uploadingColourId === colour.id ? <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', color: '#C9A882' }}>Uploading...</span> : <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', color: '#9A8F87' }}>+ Add</span>}
                        </label>
                      )}
                    </div>
                  </div>
                ))}

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
              </div>
            )}
          </div>

          {/* Materials */}
          <div style={card}>
            <h3 style={cardHeading}>Materials & Care</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Fabric / Material</label>
                <input style={inputStyle} value={form.fabric} onChange={e => setForm({ ...form, fabric: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Care Instructions</label>
                <input style={inputStyle} value={form.care_instructions} onChange={e => setForm({ ...form, care_instructions: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Lead Time</label>
                <input style={inputStyle} value={form.lead_time} onChange={e => setForm({ ...form, lead_time: e.target.value })} />
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
                    {colours.map(colour => {
                      const active = colour.id === activeKey;
                      return (
                        <button
                          key={colour.id}
                          type="button"
                          onClick={() => setActiveColourId(colour.id)}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/admin" style={{ padding: '1.1rem 2rem', border: '1px solid #E8DDD3', color: '#2C2C2C', fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Cancel
            </Link>
          </div>

          {/* Danger Zone */}
          <div style={{ border: '1px solid #F5C6C2', padding: '1.5rem 2rem', backgroundColor: '#FFF8F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', marginBottom: '0.25rem', fontWeight: 500 }}>Delete this product</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>This action cannot be undone. All images and inventory will be removed.</p>
            </div>
            <button type="button" onClick={handleDelete} style={{ marginLeft: '2rem', padding: '0.6rem 1.4rem', backgroundColor: 'transparent', color: '#C0392B', border: '1px solid #C0392B', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Delete Product
            </button>
          </div>
        </form>

        {/* Stock history */}
        {movements.length > 0 && (
          <div style={{ ...card, marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setShowMovements(!showMovements)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}>
              <span style={cardHeading as React.CSSProperties}>Stock History</span>
              <span style={{ color: '#9A8F87', fontSize: '0.8rem' }}>{showMovements ? '▲' : '▼'}</span>
            </button>
            {showMovements && (
              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {movements.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid #F5F5F5' }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', minWidth: '120px' }}>
                      {new Date(m.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C', flex: 1 }}>
                      Size {m.size}: <span style={{ color: m.delta > 0 ? '#2E7D32' : '#C0392B', fontWeight: 500 }}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
                      <span style={{ color: '#9A8F87' }}> · {m.reason}{m.admin_email ? ` · ${m.admin_email.split('@')[0]}` : ''}</span>
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

const card: React.CSSProperties = { backgroundColor: '#FFFFFF', padding: '2rem', border: '1px solid #E8DDD3' };
const cardHeading: React.CSSProperties = { fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.85rem 1rem', backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', color: '#2C2C2C', fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, outline: 'none', appearance: 'none' };
