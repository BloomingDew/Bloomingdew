'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession, supabaseAuth } from '../../../../lib/supabase-admin';
import { supabase } from '../../../../lib/supabase';

type Category = { id: number; name: string };
type ProductImage = { id: number; url: string; alt_text: string; position: number };
type SizeInventory = { size: string; quantity: number };

const DEFAULT_SIZES = ['6', '8', '10', '12', '14', '16', '18', '20'];
const MAX_IMAGES = 4;

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [sizeInventory, setSizeInventory] = useState<SizeInventory[]>(
    DEFAULT_SIZES.map(size => ({ size, quantity: 0 }))
  );
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      supabase.from('product_size_inventory').select('size, quantity').eq('product_id', id),
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
    }

    if (inventory && inventory.length > 0) {
      setSizeInventory(DEFAULT_SIZES.map(size => ({
        size,
        quantity: inventory.find((i: SizeInventory) => i.size === size)?.quantity || 0,
      })));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (images.length >= MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images per product.`);
      return;
    }
    setUploadingImage(true);

    for (const file of Array.from(files)) {
      if (images.length >= MAX_IMAGES) break;
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabaseAuth.storage.from('product-image').upload(fileName, file);
      if (!error) {
        const { data } = supabaseAuth.storage.from('product-image').getPublicUrl(fileName);
        const { data: imgData } = await supabase.from('product_images').insert({
          product_id: parseInt(id), url: data.publicUrl,
          alt_text: form.name, position: images.length,
        }).select().single();
        if (imgData) setImages(prev => [...prev, imgData]);
      }
    }
    setUploadingImage(false);
  };

  const deleteImage = async (imageId: number) => {
    await supabase.from('product_images').delete().eq('id', imageId);
    const updated = images.filter(img => img.id !== imageId)
      .map((img, i) => ({ ...img, position: i }));
    // Update positions
    for (const img of updated) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id);
    }
    setImages(updated);
  };

  const moveImage = async (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    const updated = newImages.map((img, i) => ({ ...img, position: i }));
    setImages(updated);
    for (const img of updated) {
      await supabase.from('product_images').update({ position: img.position }).eq('id', img.id);
    }
  };

  const saveSizeInventory = async () => {
    for (const item of sizeInventory) {
      await supabase.from('product_size_inventory').upsert({
        product_id: parseInt(id),
        size: item.size,
        quantity: item.quantity,
      }, { onConflict: 'product_id,size' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.from('products').update({
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
    }).eq('id', id);

    if (error) { setError(error.message); setLoading(false); return; }

    if (!form.made_to_order) await saveSizeInventory();

    setSuccess('Product updated!');
    setLoading(false);
    setTimeout(() => setSuccess(''), 2500);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('products').delete().eq('id', id);
    router.push('/admin');
  };

  const totalStock = sizeInventory.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>Edit Product</h2>
          <button onClick={handleDelete} style={{ padding: '0.6rem 1.2rem', backgroundColor: 'transparent', color: '#C0392B', border: '1px solid #C0392B', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Delete Product
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Product Info */}
          <div style={card}>
            <h3 style={cardHeading}>Product Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Product Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Price (₦) *</label>
                <input required type="number" step="0.01" style={inputStyle} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Discount (%)</label>
                <input type="number" min="0" max="100" style={inputStyle} value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="0" />
                {parseInt(form.discount) > 0 && form.price && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C0392B', marginTop: '0.4rem' }}>
                    Sale price: ₦{Math.round(parseFloat(form.price) * (1 - parseInt(form.discount) / 100)).toLocaleString()}
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
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                Visible on site
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={form.made_to_order} onChange={e => setForm({ ...form, made_to_order: e.target.checked })} />
                Made to order (no stock limit)
              </label>
            </div>

            {!form.made_to_order && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
                  <label style={labelStyle}>Stock per Size</label>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>
                    Total: {totalStock} units
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.75rem' }}>
                  {sizeInventory.map(({ size, quantity }) => (
                    <div key={size} style={{ textAlign: 'center' }}>
                      <label style={{ ...labelStyle, textAlign: 'center', marginBottom: '0.4rem' }}>{size}</label>
                      <input
                        type="number" min="0"
                        value={quantity}
                        onChange={e => setSizeInventory(prev => prev.map(s => s.size === size ? { ...s, quantity: parseInt(e.target.value) || 0 } : s))}
                        style={{ ...inputStyle, textAlign: 'center', padding: '0.6rem 0.4rem' }}
                      />
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', color: quantity === 0 ? '#C0392B' : quantity <= 3 ? '#E65100' : '#2E7D32', marginTop: '0.3rem' }}>
                        {quantity === 0 ? 'Sold out' : quantity <= 3 ? 'Low stock' : 'In stock'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
        </form>
      </div>
    </div>
  );
}

const card: React.CSSProperties = { backgroundColor: '#FFFFFF', padding: '2rem', border: '1px solid #E8DDD3' };
const cardHeading: React.CSSProperties = { fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.85rem 1rem', backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', color: '#2C2C2C', fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, outline: 'none', appearance: 'none' };
