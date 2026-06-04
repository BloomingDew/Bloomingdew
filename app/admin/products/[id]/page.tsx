'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../../lib/supabase-admin';
import { supabase } from '../../../../lib/supabase';

type Category = { id: number; name: string };
type ProductImage = { id: number; url: string; alt_text: string; position: number };

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '', price: '', category_id: '',
    description: '', fabric: '', care_instructions: '',
    available: true, made_to_order: true, lead_time: '2–4 weeks',
    stock_quantity: '',
  });

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    supabase.from('categories').select('id, name').then(({ data }) => setCategories(data || []));
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();
    if (data) {
      setForm({
        name: data.name, price: data.price.toString(),
        category_id: data.category_id?.toString() || '',
        description: data.description || '', fabric: data.fabric || '',
        care_instructions: data.care_instructions || '',
        available: data.available, made_to_order: data.made_to_order,
        lead_time: data.lead_time || '2–4 weeks',
        stock_quantity: data.stock_quantity?.toString() || '',
      });
      setImages(data.product_images || []);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-image').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('product-image').getPublicUrl(fileName);
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
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.from('products').update({
      name: form.name,
      price: parseFloat(form.price),
      category_id: form.category_id ? parseInt(form.category_id) : null,
      description: form.description,
      fabric: form.fabric,
      care_instructions: form.care_instructions,
      available: form.available,
      made_to_order: form.made_to_order,
      lead_time: form.lead_time,
      stock_quantity: form.made_to_order ? null : (form.stock_quantity ? parseInt(form.stock_quantity) : null),
    }).eq('id', id);

    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess('Product updated!');
    setLoading(false);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    await supabase.from('products').delete().eq('id', id);
    router.push('/admin');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      <div style={{ backgroundColor: '#2C2C2C', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#FAF7F4', fontWeight: 500 }}>Bloomingdew Admin</h1>
        <Link href="/admin" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', textDecoration: 'none' }}>
          ← Back to Products
        </Link>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>
            Edit Product
          </h2>
          <button onClick={handleDelete} style={{
            padding: '0.6rem 1.2rem', backgroundColor: 'transparent', color: '#C0392B',
            border: '1px solid #C0392B', fontFamily: "'Jost', sans-serif",
            fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
            Delete Product
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={card}>
            <h3 style={cardHeading}>Product Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Product Name *</label>
                <input required style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Price (£) *</label>
                <input required type="number" step="0.01" style={inputStyle} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
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

          {/* Images */}
          <div style={card}>
            <h3 style={cardHeading}>Product Images</h3>
            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {images.map((img, i) => (
                  <div key={img.id} style={{ position: 'relative' }}>
                    <img src={img.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => deleteImage(img.id)} style={{
                      position: 'absolute', top: '4px', right: '4px',
                      backgroundColor: '#2C2C2C', color: '#FAF7F4',
                      border: 'none', width: '22px', height: '22px',
                      cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                    {i === 0 && (
                      <span style={{ position: 'absolute', bottom: '4px', left: '4px', backgroundColor: '#C9A882', color: '#FAF7F4', fontFamily: "'Jost', sans-serif", fontSize: '0.55rem', padding: '2px 5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <label style={{ display: 'block', border: '2px dashed #E8DDD3', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA' }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
              {uploadingImage
                ? <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#C9A882' }}>Uploading...</p>
                : <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87' }}>+ Upload more images</p>
              }
            </label>
          </div>

          <div style={card}>
            <h3 style={cardHeading}>Availability & Stock</h3>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                Visible on site
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>
                <input type="checkbox" checked={form.made_to_order} onChange={e => setForm({ ...form, made_to_order: e.target.checked })} />
                Made to order
              </label>
            </div>
            {!form.made_to_order && (
              <div>
                <label style={labelStyle}>Stock Quantity (Ready to Wear)</label>
                <input
                  type="number" min="0" style={{ ...inputStyle, maxWidth: '160px' }}
                  value={form.stock_quantity}
                  onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
                  placeholder="e.g. 10"
                />
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', marginTop: '0.5rem' }}>
                  Leave blank for made-to-order. Set a number for ready-to-wear items.
                </p>
              </div>
            )}
          </div>

          {error && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B' }}>{error}</p>}
          {success && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{success}</p>}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '1.1rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
              fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.18em',
              textTransform: 'uppercase', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/admin" style={{
              padding: '1.1rem 2rem', border: '1px solid #E8DDD3', color: '#2C2C2C',
              fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center',
            }}>
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
