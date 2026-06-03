'use client';

import { useState, use } from 'react';
import Link from 'next/link';

const products: Record<string, { id: number; name: string; price: string; category: string; description: string; details: string[] }> = {
  '1': { id: 1, name: 'Linen Wrap Dress', price: '£120', category: 'Dresses', description: 'A beautifully draped wrap dress cut from 100% natural linen. Effortlessly elegant — wear it dressed up or down. Handmade to order.', details: ['100% Natural Linen', 'Handmade to order', 'Available in sizes XS–XL', 'Hand wash cold', 'Made in the UK'] },
  '2': { id: 2, name: 'Ivory Slip Set', price: '£95', category: 'Sets', description: 'A matching slip skirt and cami top set in soft ivory. Minimal, feminine, and endlessly versatile. Each set is individually crafted.', details: ['Satin-finish fabric', 'Adjustable cami straps', 'Available in sizes XS–XL', 'Dry clean only', 'Made in the UK'] },
  '3': { id: 3, name: 'Blush Midi Skirt', price: '£75', category: 'Skirts', description: 'A soft blush midi skirt with a floaty silhouette. Cut on the bias for natural movement and a flattering fit.', details: ['Chiffon blend', 'Elasticated waistband', 'Available in sizes XS–XL', 'Hand wash cold', 'Made in the UK'] },
  '4': { id: 4, name: 'Cream Corset Top', price: '£60', category: 'Tops', description: 'A structured corset top in warm cream. Boning detail at the front, adjustable lace-up back. A statement piece, handmade with care.', details: ['Cotton sateen', 'Adjustable lace-up back', 'Available in sizes XS–XL', 'Dry clean only', 'Made in the UK'] },
  '5': { id: 5, name: 'Champagne Maxi Dress', price: '£145', category: 'Dresses', description: 'Floor-length and flowing in a warm champagne tone. A showstopper made for special occasions and slow evenings alike.', details: ['Silk-touch fabric', 'Invisible side zip', 'Available in sizes XS–XL', 'Dry clean only', 'Made in the UK'] },
  '6': { id: 6, name: 'Nude Linen Set', price: '£110', category: 'Sets', description: 'A relaxed co-ord set in nude linen. Wide-leg trousers and a sleeveless top — casual luxury at its finest.', details: ['100% Natural Linen', 'Relaxed wide-leg fit', 'Available in sizes XS–XL', 'Hand wash cold', 'Made in the UK'] },
  '7': { id: 7, name: 'Dusty Rose Blouse', price: '£65', category: 'Tops', description: 'A delicate blouse in dusty rose with a relaxed, feminine silhouette. Finished with subtle ruffle detailing at the cuffs.', details: ['Washed silk blend', 'Ruffle cuff detail', 'Available in sizes XS–XL', 'Hand wash cold', 'Made in the UK'] },
  '8': { id: 8, name: 'Satin Slip Dress', price: '£130', category: 'New In', description: 'The newest addition — a silky slip dress that moves with you. Clean lines, minimal detail, maximum impact.', details: ['Satin finish', 'Adjustable straps', 'Available in sizes XS–XL', 'Dry clean only', 'Made in the UK'] },
  '9': { id: 9, name: 'Tailored Wide Trousers', price: '£85', category: 'New In', description: 'Wide-leg trousers with a sharp tailored waistband. Flattering, comfortable, and made to last.', details: ['Crepe fabric', 'High-rise waist', 'Available in sizes XS–XL', 'Dry clean only', 'Made in the UK'] },
};

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = products[id];
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'care'>('details');

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', marginBottom: '1rem' }}>Product not found</h2>
        <Link href="/shop" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid #2C2C2C' }}>Back to Shop</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: product.name, href: '#' }].map((crumb, i, arr) => (
          <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {i < arr.length - 1 ? (
              <>
                <Link href={crumb.href} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#9A8F87' }}>{crumb.label}</Link>
                <span style={{ color: '#C9A882', fontSize: '0.7rem' }}>›</span>
              </>
            ) : (
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#2C2C2C' }}>{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Main layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '5rem',
        alignItems: 'start',
      }} className="product-grid">

        {/* Left — images */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Main large image */}
          <div style={{
            gridColumn: '1 / -1',
            aspectRatio: '3/4',
            background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Main photo coming soon
            </span>
          </div>
          {/* Two smaller images */}
          {[1, 2].map((n) => (
            <div key={n} style={{
              aspectRatio: '1/1',
              background: 'linear-gradient(150deg, #EDE4DA, #C9A882)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87' }}>
                Detail {n}
              </span>
            </div>
          ))}
        </div>

        {/* Right — product info */}
        <div style={{ position: 'sticky', top: '130px' }}>

          {/* Category */}
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.75rem' }}>
            {product.category}
          </p>

          {/* Name */}
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '1rem', lineHeight: 1.2 }}>
            {product.name}
          </h1>

          {/* Price */}
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '1.1rem', fontWeight: 300, color: '#2C2C2C', marginBottom: '2rem' }}>
            {product.price}
          </p>

          {/* Description */}
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 300, color: '#5C5450', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            {product.description}
          </p>

          {/* Size selector */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2C2C2C' }}>
                Size {selectedSize && `— ${selectedSize}`}
              </span>
              <Link href="/order-guide" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', borderBottom: '1px solid #9A8F87' }}>
                Size Guide
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '1px solid',
                    borderColor: selectedSize === size ? '#2C2C2C' : '#E8DDD3',
                    backgroundColor: selectedSize === size ? '#2C2C2C' : 'transparent',
                    color: selectedSize === size ? '#FAF7F4' : '#2C2C2C',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.78rem',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to bag */}
          <button style={{
            width: '100%',
            padding: '1.1rem',
            backgroundColor: '#2C2C2C',
            color: '#FAF7F4',
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.8rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1rem',
          }}>
            Add to Bag
          </button>

          {/* Wishlist */}
          <button style={{
            width: '100%',
            padding: '1.1rem',
            backgroundColor: 'transparent',
            color: '#2C2C2C',
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.8rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            border: '1px solid #E8DDD3',
            cursor: 'pointer',
            marginBottom: '2.5rem',
          }}>
            Save to Wishlist
          </button>

          {/* Details tabs */}
          <div style={{ borderTop: '1px solid #E8DDD3' }}>
            <div style={{ display: 'flex', gap: '0' }}>
              {(['details', 'care'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.72rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: activeTab === tab ? '#2C2C2C' : '#9A8F87',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab ? '#2C2C2C' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab === 'details' ? 'Product Details' : 'Care & Fabric'}
                </button>
              ))}
            </div>
            <ul style={{ padding: '1.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {product.details.map((d, i) => (
                <li key={i} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#5C5450', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#C9A882', fontSize: '0.5rem' }}>●</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .product-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}
