'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const allProducts = [
  { id: 1, name: 'Linen Wrap Dress', price: '₦120', category: 'Dresses' },
  { id: 2, name: 'Ivory Slip Set', price: '₦95', category: 'Sets' },
  { id: 3, name: 'Blush Midi Skirt', price: '₦75', category: 'Skirts' },
  { id: 4, name: 'Cream Corset Top', price: '₦60', category: 'Tops' },
  { id: 5, name: 'Champagne Maxi Dress', price: '₦145', category: 'Dresses' },
  { id: 6, name: 'Nude Linen Set', price: '₦110', category: 'Sets' },
  { id: 7, name: 'Dusty Rose Blouse', price: '₦65', category: 'Tops' },
  { id: 8, name: 'Satin Slip Dress', price: '₦130', category: 'New In' },
  { id: 9, name: 'Tailored Wide Trousers', price: '₦85', category: 'New In' },
];

type Props = { isOpen: boolean; onClose: () => void };

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length > 1
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      backgroundColor: 'rgba(250,247,244,0.97)',
      backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', paddingTop: '6rem',
      padding: '6rem 2rem 2rem',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: '1.5rem', right: '2rem',
        fontSize: '1.2rem', color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer',
      }}>✕</button>

      {/* Search input */}
      <div style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a piece..."
          style={{
            width: '100%',
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
            fontWeight: 400,
            color: '#2C2C2C',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: '1px solid #2C2C2C',
            outline: 'none',
            padding: '0.75rem 2rem 0.75rem 0',
          }}
        />
        <span style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', color: '#9A8F87' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
      </div>

      {/* Results */}
      <div style={{ width: '100%', maxWidth: '600px', marginTop: '2rem' }}>
        {query.length > 1 && results.length === 0 && (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 300, color: '#9A8F87', textAlign: 'center', paddingTop: '2rem' }}>
            No results for "{query}"
          </p>
        )}
        {results.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1rem 0', borderBottom: '1px solid #E8DDD3',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px', height: '52px', flexShrink: 0,
                  background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
                }} />
                <div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.2rem' }}>
                    {product.name}
                  </p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {product.category}
                  </p>
                </div>
              </div>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>
                {product.price}
              </span>
            </div>
          </Link>
        ))}

        {query.length <= 1 && (
          <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Popular Categories
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
              {['Dresses', 'Sets', 'Tops', 'New In'].map((cat) => (
                <Link key={cat} href={`/shop?category=${cat}`} onClick={onClose} style={{
                  fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  padding: '0.5rem 1.2rem', border: '1px solid #E8DDD3',
                  color: '#2C2C2C', textDecoration: 'none',
                }}>
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
