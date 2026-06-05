'use client';

import { useState, use, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import { getProductById, type Product } from '../../../lib/products';
import { getAvailableStock } from '../../../lib/inventory';

const sizes = ['6', '8', '10', '12', '14', '16', '18', '20'];

const SIZE_GUIDE = [
  { size: '6',  bust: 34, waist: 26, hip: 36 },
  { size: '8',  bust: 36, waist: 28, hip: 38 },
  { size: '10', bust: 38, waist: 30, hip: 40 },
  { size: '12', bust: 40, waist: 32, hip: 42 },
  { size: '14', bust: 42, waist: 34, hip: 44 },
  { size: '16', bust: 44, waist: 36, hip: 46 },
  { size: '18', bust: 46, waist: 38, hip: 48 },
  { size: '20', bust: 48, waist: 40, hip: 50 },
];

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'care'>('details');
  const [addedMsg, setAddedMsg] = useState(false);
  const [stockError, setStockError] = useState('');
  const [availableStock, setAvailableStock] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const { addItem } = useCart();
  const { addItem: wishlistAdd, removeItem: wishlistRemove, isWishlisted } = useWishlist();

  useEffect(() => {
    getProductById(Number(id)).then((data) => { setProduct(data); setLoading(false); });
  }, [id]);

  // Close size dropdown on outside click
  useEffect(() => {
    if (!sizeDropdownOpen) return;
    const handler = () => setSizeDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [sizeDropdownOpen]);

  // Fetch stock when size is selected
  useEffect(() => {
    if (!product || !selectedSize) return;
    if (product.made_to_order) { setAvailableStock(null); return; }
    getAvailableStock(product.id, selectedSize).then(setAvailableStock);
  }, [selectedSize, product]);

  const handleAddToCart = async () => {
    if (!product) return;
    setStockError('');
    const result = await addItem({
      id: product.id, name: product.name,
      price: `₦${product.price}`, size: selectedSize || 'M',
      quantity: 1, madeToOrder: product.made_to_order,
    });
    if (!result.success) {
      setStockError(result.message || 'Item unavailable.');
      return;
    }
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2000);
    // Refresh stock
    if (!product.made_to_order && selectedSize) {
      getAvailableStock(product.id, selectedSize).then(setAvailableStock);
    }
  };

  const handleWishlist = () => {
    if (!product) return;
    isWishlisted(product.id)
      ? wishlistRemove(product.id)
      : wishlistAdd({ id: product.id, name: product.name, price: `₦${product.price}`, category: product.category });
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
    'Made in Nigeria',
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
            width: '100%', aspectRatio: '3/4',
            background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {product.images[activeImage] ? (
              <img src={product.images[activeImage].url} alt={product.images[activeImage].alt_text || product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span style={{
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
                  <img src={img.url} alt={img.alt_text || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
            ₦{product.price}
          </p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 300, color: '#5C5450', lineHeight: 1.8, marginBottom: '2.5rem' }}>
            {product.description}
          </p>

          {/* Size selector */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2C2C2C' }}>
                Size
              </span>
              <button onClick={() => setSizeGuideOpen(true)} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', borderBottom: '1px solid #9A8F87', background: 'none', border: 'none', borderBottom: '1px solid #9A8F87', cursor: 'pointer', padding: 0 }}>
                Size Guide
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              {/* Trigger */}
              <button
                onClick={() => setSizeDropdownOpen(o => !o)}
                style={{
                  width: '100%', padding: '1rem 1.2rem',
                  border: '1px solid #2C2C2C',
                  backgroundColor: '#FFFFFF',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', fontFamily: "'Jost', sans-serif",
                  fontSize: '0.88rem', fontWeight: 300,
                  color: selectedSize ? '#2C2C2C' : '#9A8F87',
                }}
              >
                <span>{selectedSize || 'Select a size'}</span>
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="#9A8F87" strokeWidth="1.5" strokeLinecap="round">
                  <path d={sizeDropdownOpen ? 'M1 7l5-5 5 5' : 'M1 1l5 5 5-5'} />
                </svg>
              </button>

              {/* Dropdown list */}
              {sizeDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  border: '1px solid #2C2C2C', borderTop: 'none',
                  backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                  {(product.sizes || sizes).map((size) => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setSizeDropdownOpen(false); }}
                      style={{
                        width: '100%', padding: '0.85rem 1.2rem',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: selectedSize === size ? '#F9F6F3' : '#FFFFFF',
                        border: 'none', borderBottom: '1px solid #F0EBE5',
                        cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '0.88rem',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ color: '#2C2C2C', fontWeight: selectedSize === size ? 500 : 300 }}>
                        {size}
                      </span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#2C2C2C' }}>
                        ₦{product.price?.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stock indicator */}
          {!product.made_to_order && selectedSize && availableStock !== null && (
            <div style={{ marginBottom: '1rem' }}>
              {availableStock === 0 ? (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#C0392B', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Sold Out in this size
                </p>
              ) : availableStock <= 3 ? (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#E65100', letterSpacing: '0.1em' }}>
                  Only {availableStock} left
                </p>
              ) : (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#2E7D32', letterSpacing: '0.1em' }}>
                  In stock
                </p>
              )}
            </div>
          )}

          {stockError && (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', marginBottom: '1rem' }}>
              {stockError}
            </p>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!product.made_to_order && availableStock === 0}
            style={{
              width: '100%', padding: '1.1rem',
              backgroundColor: availableStock === 0 && !product.made_to_order ? '#E8DDD3' : addedMsg ? '#C9A882' : '#2C2C2C',
              color: availableStock === 0 && !product.made_to_order ? '#9A8F87' : '#FAF7F4',
              fontFamily: "'Jost', sans-serif", fontSize: '0.8rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              border: 'none', cursor: availableStock === 0 && !product.made_to_order ? 'not-allowed' : 'pointer',
              marginBottom: '1rem', transition: 'background-color 0.3s',
            }}>
            {availableStock === 0 && !product.made_to_order ? 'Sold Out' : addedMsg ? 'Added to Bag ✓' : 'Add to Bag'}
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

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div onClick={() => setSizeGuideOpen(false)} style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            backgroundColor: '#FAF7F4', maxWidth: '520px', width: '100%',
            padding: '2.5rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <button onClick={() => setSizeGuideOpen(false)} style={{
              position: 'absolute', top: '1.2rem', right: '1.2rem',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '1.1rem', color: '#9A8F87',
            }}>✕</button>

            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.5rem' }}>
              Bloomingdew
            </p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
              Size Guide
            </h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', fontWeight: 300, color: '#9A8F87', marginBottom: '2rem' }}>
              All measurements are in inches.
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E8DDD3' }}>
                  {['Size', 'Bust', 'Waist', 'Hip'].map(h => (
                    <th key={h} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 400 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((row, i) => (
                  <tr key={row.size} style={{ backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F9F6F3', borderBottom: '1px solid #E8DDD3' }}>
                    <td style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C', padding: '0.85rem 1rem' }}>{row.size}</td>
                    <td style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#5C5450', padding: '0.85rem 1rem' }}>{row.bust}"</td>
                    <td style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#5C5450', padding: '0.85rem 1rem' }}>{row.waist}"</td>
                    <td style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#5C5450', padding: '0.85rem 1rem' }}>{row.hip}"</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 300, color: '#9A8F87', marginTop: '1.5rem', lineHeight: 1.7 }}>
              Between sizes? We recommend sizing up. For custom fit, visit our <a href="/custom" style={{ color: '#C9A882', borderBottom: '1px solid #C9A882' }}>Custom page</a>.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .product-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
      `}</style>
    </div>
  );
}
