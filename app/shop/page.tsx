'use client';

import { useState } from 'react';
import Link from 'next/link';

const categories = ['All', 'New In', 'Dresses', 'Sets', 'Tops', 'Skirts'];

const products = [
  { id: 1, name: 'Linen Wrap Dress', price: '£120', category: 'Dresses' },
  { id: 2, name: 'Ivory Slip Set', price: '£95', category: 'Sets' },
  { id: 3, name: 'Blush Midi Skirt', price: '£75', category: 'Skirts' },
  { id: 4, name: 'Cream Corset Top', price: '£60', category: 'Tops' },
  { id: 5, name: 'Champagne Maxi Dress', price: '£145', category: 'Dresses' },
  { id: 6, name: 'Nude Linen Set', price: '£110', category: 'Sets' },
  { id: 7, name: 'Dusty Rose Blouse', price: '£65', category: 'Tops' },
  { id: 8, name: 'Satin Slip Dress', price: '£130', category: 'New In' },
  { id: 9, name: 'Tailored Wide Trousers', price: '£85', category: 'New In' },
];

const sortOptions = ['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('Featured');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = products.filter(
    (p) => activeCategory === 'All' || p.category === activeCategory
  );

  const sorted = [...filtered].sort((a, b) => {
    const priceA = parseInt(a.price.replace(/\D/g, ''));
    const priceB = parseInt(b.price.replace(/\D/g, ''));
    if (activeSort === 'Price: Low to High') return priceA - priceB;
    if (activeSort === 'Price: High to Low') return priceB - priceA;
    return 0;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>

      {/* Page header */}
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid #E8DDD3', paddingBottom: '2rem' }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 500,
          color: '#2C2C2C',
          marginBottom: '0.5rem',
        }}>
          All Pieces
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.85rem',
          fontWeight: 300,
          color: '#9A8F87',
        }}>
          {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Filters bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: '0.75rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '0.5rem 1.2rem',
                border: '1px solid',
                borderColor: activeCategory === cat ? '#2C2C2C' : '#E8DDD3',
                backgroundColor: activeCategory === cat ? '#2C2C2C' : 'transparent',
                color: activeCategory === cat ? '#FAF7F4' : '#2C2C2C',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#9A8F87',
          }}>
            Sort:
          </span>
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.8rem',
              color: '#2C2C2C',
              border: '1px solid #E8DDD3',
              backgroundColor: '#FAF7F4',
              padding: '0.45rem 0.8rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {sortOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0', color: '#9A8F87' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem' }}>No pieces found.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '2rem',
        }}>
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: { id: number; name: string; price: string; category: string } }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image placeholder */}
        <div style={{
          aspectRatio: '3/4',
          backgroundColor: '#E8DDD3',
          background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <span style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#9A8F87',
          }}>
            Photo coming soon
          </span>

          {/* Hover overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(44,44,44,0.06)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '1.5rem',
          }}>
            <span style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.72rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#2C2C2C',
              backgroundColor: '#FAF7F4',
              padding: '0.6rem 1.5rem',
            }}>
              Quick View
            </span>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.88rem',
              fontWeight: 400,
              color: '#2C2C2C',
              marginBottom: '0.25rem',
            }}>
              {product.name}
            </p>
            <p style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              color: '#9A8F87',
              textTransform: 'uppercase',
            }}>
              {product.category}
            </p>
          </div>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.88rem',
            fontWeight: 300,
            color: '#2C2C2C',
          }}>
            {product.price}
          </p>
        </div>
      </div>
    </Link>
  );
}
