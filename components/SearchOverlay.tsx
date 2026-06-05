'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

type Product = { id: number; name: string; price: number; discount: number; categories: { name: string }[] | null; product_images: { url: string }[] };

type Props = { isOpen: boolean; onClose: () => void };

export default function SearchOverlay({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      setResults([]);
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, price, discount, categories(name), product_images(url)')
        .eq('available', true)
        .ilike('name', `%${query}%`)
        .limit(8);
      setResults(data || []);
      setLoading(false);
    }, 300);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      backgroundColor: 'rgba(250,247,244,0.97)',
      backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
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
          {loading ? (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C9A882' }}>...</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )}
        </span>
      </div>

      {/* Results */}
      <div style={{ width: '100%', maxWidth: '600px', marginTop: '2rem' }}>
        {query.length > 1 && !loading && results.length === 0 && (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 300, color: '#9A8F87', textAlign: 'center', paddingTop: '2rem' }}>
            No results for "{query}"
          </p>
        )}

        {results.map((product) => {
          const image = product.product_images?.[0]?.url;
          const category = Array.isArray(product.categories) ? product.categories[0]?.name : (product.categories as any)?.name || '';
          const salePrice = product.discount > 0 ? Math.round(product.price * (1 - product.discount / 100)) : null;
          return (
            <Link key={product.id} href={`/products/${product.id}`} onClick={onClose} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem 0', borderBottom: '1px solid #E8DDD3',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px', height: '52px', flexShrink: 0,
                    background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
                    overflow: 'hidden', position: 'relative',
                  }}>
                    {image && <img src={image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.2rem' }}>
                      {product.name}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {category}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {salePrice ? (
                    <>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#C0392B', fontWeight: 400 }}>₦{salePrice.toLocaleString()}</p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87', textDecoration: 'line-through' }}>₦{product.price.toLocaleString()}</p>
                    </>
                  ) : (
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>₦{product.price.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {query.length <= 1 && (
          <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Popular Categories
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
              {['Dresses', 'Sets', 'Tops', 'New In'].map((cat) => (
                <Link key={cat} href={`/shop?category=${cat.toLowerCase().replace(' ', '-')}`} onClick={onClose} style={{
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
