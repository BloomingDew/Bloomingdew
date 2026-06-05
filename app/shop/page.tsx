'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlist } from '../../context/WishlistContext';
import { getProducts, type Product } from '../../lib/products';

const categories = ['All', 'New In', 'Dresses', 'Sets', 'Tops', 'Skirts', 'Trousers'];
const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('Featured');

  useEffect(() => {
    getProducts().then((data) => { setProducts(data); setLoading(false); });
  }, []);

  const filtered = products.filter(
    (p) => activeCategory === 'All' || p.category === activeCategory
  );

  const sorted = [...filtered].sort((a, b) => {
    if (activeSort === 'Price: Low to High') return a.price - b.price;
    if (activeSort === 'Price: High to Low') return b.price - a.price;
    return 0;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid #E8DDD3', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          All Pieces
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          {loading ? 'Loading...' : `${sorted.length} ${sorted.length === 1 ? 'item' : 'items'}`}
        </p>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0.5rem 1.2rem', border: '1px solid',
              borderColor: activeCategory === cat ? '#2C2C2C' : '#E8DDD3',
              backgroundColor: activeCategory === cat ? '#2C2C2C' : 'transparent',
              color: activeCategory === cat ? '#FAF7F4' : '#2C2C2C',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87' }}>Sort:</span>
          <select value={activeSort} onChange={(e) => setActiveSort(e.target.value)} style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#2C2C2C',
            border: '1px solid #E8DDD3', backgroundColor: '#FAF7F4',
            padding: '0.45rem 0.8rem', cursor: 'pointer', outline: 'none',
          }}>
            {sortOptions.map((opt) => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div style={{ aspectRatio: '3/4', backgroundColor: '#E8DDD3', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: '14px', backgroundColor: '#E8DDD3', marginBottom: '0.5rem', width: '70%' }} />
              <div style={{ height: '14px', backgroundColor: '#E8DDD3', width: '30%' }} />
            </div>
          ))}
        </div>
      )}

      {/* Product grid */}
      {!loading && sorted.length === 0 && (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#9A8F87' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem' }}>No pieces found.</p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
          {sorted.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const { addItem, removeItem, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlisted
      ? removeItem(product.id)
      : addItem({ id: product.id, name: product.name, price: `₦${product.price}`, category: product.category });
  };

  const mainImage = product.images[0]?.url;

  return (
    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{
          aspectRatio: '3/4', marginBottom: '1rem', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mainImage ? (
            <img src={mainImage} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Photo coming soon
            </span>
          )}

          {/* Heart */}
          <button onClick={toggleWishlist} style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            backgroundColor: '#FAF7F4', border: 'none', cursor: 'pointer',
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered || wishlisted ? 1 : 0, transition: 'opacity 0.2s', zIndex: 2,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? '#C9A882' : 'none'} stroke={wishlisted ? '#C9A882' : '#2C2C2C'} strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(44,44,44,0.06)',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '1.5rem',
          }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2C2C2C', backgroundColor: '#FAF7F4', padding: '0.6rem 1.5rem' }}>
              Quick View
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.25rem' }}>{product.name}</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.08em', color: '#9A8F87', textTransform: 'uppercase' }}>{product.category}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {product.discount > 0 ? (
              <>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#9A8F87', textDecoration: 'line-through' }}>₦{product.price.toLocaleString()}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#C0392B' }}>₦{Math.round(product.price * (1 - product.discount / 100)).toLocaleString()}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C0392B' }}>-{product.discount}%</p>
              </>
            ) : (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#2C2C2C' }}>₦{product.price.toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
