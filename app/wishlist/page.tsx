'use client';

import { useWishlist } from '../../context/WishlistContext';
import { useCurrency } from '../../context/CurrencyContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { format } = useCurrency();
  const [images, setImages] = useState<Record<number, string>>({});

  // Fetch all wishlist images in a single query instead of one per card.
  useEffect(() => {
    if (items.length === 0) return;
    const ids = [...new Set(items.map(i => i.id))];
    supabase.from('product_images').select('product_id, url').in('product_id', ids).order('position')
      .then(({ data }) => {
        const map: Record<number, string> = {};
        (data || []).forEach(row => { if (!map[row.product_id]) map[row.product_id] = row.url; });
        setImages(map);
      });
  }, [items]);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>
      <div style={{ marginBottom: '3rem', borderBottom: '1px solid #E8DDD3', paddingBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          Your Wishlist
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
        </p>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#2C2C2C', marginBottom: '1rem' }}>
            Nothing saved yet
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#9A8F87', marginBottom: '2rem' }}>
            Browse the collection and save pieces you love.
          </p>
          <Link href="/shop" style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '1rem 2.5rem', backgroundColor: '#2C2C2C',
            color: '#FAF7F4', textDecoration: 'none', display: 'inline-block',
          }}>
            Shop Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} imageUrl={images[item.id] ?? null} format={format} onRemove={() => removeItem(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistCard({ item, imageUrl, format, onRemove }: {
  item: { id: number; name: string; priceUsd: number; originalPriceUsd?: number; category: string };
  imageUrl: string | null;
  format: (usd: number) => string;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Link href={`/products/${item.id}`}>
          <div style={{
            aspectRatio: '3/4', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {imageUrl ? (
              <img src={imageUrl} alt={item.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
                Photo coming soon
              </span>
            )}
          </div>
        </Link>
        <button onClick={onRemove} style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          backgroundColor: '#FAF7F4', border: 'none', cursor: 'pointer',
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', color: '#9A8F87',
        }}>✕</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <div>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.2rem' }}>{item.name}</p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.category}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {item.originalPriceUsd && (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#B0A8A0', textDecoration: 'line-through', marginBottom: '0.1rem' }}>{format(item.originalPriceUsd)}</p>
          )}
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: item.originalPriceUsd ? '#C0392B' : '#2C2C2C', fontWeight: item.originalPriceUsd ? 500 : 400 }}>{format(item.priceUsd)}</span>
        </div>
      </div>
      {/* Sizes are per-product (6–20) with per-size stock, so adding straight
          from the wishlist can't pick one — send the shopper to choose. */}
      <Link href={`/products/${item.id}`} style={{
        display: 'block', textAlign: 'center', width: '100%', padding: '0.85rem',
        backgroundColor: hovered ? '#2C2C2C' : 'transparent',
        color: hovered ? '#FAF7F4' : '#2C2C2C',
        border: '1px solid #2C2C2C', boxSizing: 'border-box',
        fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        textDecoration: 'none', transition: 'all 0.2s',
      }}>
        Select Size
      </Link>
    </div>
  );
}
