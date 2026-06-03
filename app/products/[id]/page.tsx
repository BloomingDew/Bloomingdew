'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { getProductById, type Product } from '../../../lib/products';

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'care'>('details');
  const [addedMsg, setAddedMsg] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();
  const { addItem: wishlistAdd, removeItem: wishlistRemove, isWishlisted } = useWishlist();

  useEffect(() => {
    getProductById(Number(id)).then((data) => { setProduct(data); setLoading(false); });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product.id, name: product.name, price: `£${product.price}`, size: selectedSize || 'M', quantity: 1 });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
  };

  const handleWishlist = () => {
    if (!product) return;
    isWishlisted(product.id)
      ? wishlistRemove(product.id)
      : wishlistAdd({ id: product.id, name: product.name, price: `£${product.price}`, category: product.category });
  };

  if (loading) return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem' }}>
        <div style={{ aspectRatio: '3/4', backgroundColor: '#E8DDD3' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '2rem' }}>
          {[80, 50, 30, 100, 100].map((w, i) => (
            <div key={i} style={{ height: '16px', backgroundColor: '#E8DDD3', width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', marginBottom: '1rem' }}>Product not found</h2>
      <Link href="/shop" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '1px solid #2C2C2C' }}>Back to Shop</Link>
    </div>
  );

  const details = [
    product.fabric && product.fabric,
    'Handmade to order',
    `Available in sizes ${(product.sizes || []).join(', ')}`,
    product.care_instructions && product.care_instructions,
    'Made in the UK',
  ].filter(Boolean) as string[];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: product.name, href: '#' }].map((crumb, i, arr) => (
          <span key={crumb.href} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {i < arr.length - 1 ? (
              <>
                <Link href={crumb.href} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>{crumb.label}</Link>
                <span style={{ color: '#C9A882', fontSize: '0.7rem' }}>›</span>
              </>
            ) : (
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#2C2C2C' }}>{crumb.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }} className="product-grid">

        {/* Left — images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: 0, overflow: 'hidden' }}>
          {/* Main image */}
          <div style={{
            width: '100%', paddingBottom: '133%', position: 'relative',
            background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)', overflow: 'hidden',
          }}>
            {product.images[activeImage] ? (
              <Image src={product.images[activeImage].url} alt={product.images[activeImage].alt_text || product.name} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            ) : (
              <span style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87',
              }}>
                Main photo coming soon
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} style={{
                  width: '72px', height: '88px', border: `2px solid ${activeImage === i ? '#2C2C2C' : 'transparent'}`,
                  padding: 0, cursor: 'pointer', overflow: 'hidden', background: 'none',
                }}>
                  <Image src={img.url} alt={img.alt_text || ''} fill sizes="80px" style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}

          {/* Placeholder thumbnails when no images */}
          {product.images.length === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[1, 2].map((n) => (
                <div key={n} style={{ aspectRatio: '1/1', background: 'linear-gradient(150deg, #EDE4DA, #C9A882)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87' }}>Detail {n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — product info */}
        <div style={{ position: 'sticky', top: '130px' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.75rem' }}>
            {product.category}
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '1rem', lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '1.1rem', fontWeight: 300, color: '#2C2C2C', marginBottom: '2rem' }}>
            £{product.price}
          </p>
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
              {(product.sizes || sizes).map((size) => (
                <button key={size} onClick={() => setSelectedSize(size)} style={{
                  width: '48px', height: '48px', border: '1px solid',
                  borderColor: selectedSize === size ? '#2C2C2C' : '#E8DDD3',
                  backgroundColor: selectedSize === size ? '#2C2C2C' : 'transparent',
                  color: selectedSize === size ? '#FAF7F4' : '#2C2C2C',
                  fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleAddToCart} style={{
            width: '100%', padding: '1.1rem',
            backgroundColor: addedMsg ? '#C9A882' : '#2C2C2C',
            color: '#FAF7F4', fontFamily: "'Jost', sans-serif",
            fontSize: '0.8rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            border: 'none', cursor: 'pointer', marginBottom: '1rem', transition: 'background-color 0.3s',
          }}>
            {addedMsg ? 'Added to Bag ✓' : 'Add to Bag'}
          </button>

          <button onClick={handleWishlist} style={{
            width: '100%', padding: '1.1rem', backgroundColor: 'transparent',
            fontFamily: "'Jost', sans-serif", fontSize: '0.8rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            border: `1px solid ${isWishlisted(product.id) ? '#C9A882' : '#E8DDD3'}`,
            color: isWishlisted(product.id) ? '#C9A882' : '#2C2C2C',
            cursor: 'pointer', marginBottom: '2.5rem', transition: 'all 0.2s',
          }}>
            {isWishlisted(product.id) ? 'Saved to Wishlist ♥' : 'Save to Wishlist'}
          </button>

          {/* Details tabs */}
          <div style={{ borderTop: '1px solid #E8DDD3' }}>
            <div style={{ display: 'flex' }}>
              {(['details', 'care'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '1rem',
                  fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: activeTab === tab ? '#2C2C2C' : '#9A8F87', backgroundColor: 'transparent',
                  border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#2C2C2C' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {tab === 'details' ? 'Product Details' : 'Care & Fabric'}
                </button>
              ))}
            </div>
            <ul style={{ padding: '1.5rem 0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {details.map((d, i) => (
                <li key={i} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#5C5450', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#C9A882', fontSize: '0.5rem' }}>●</span>{d}
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
