'use client';

import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { useState } from 'react';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem, openCart } = useCart();

  const handleAddToCart = (item: { id: number; name: string; price: string }) => {
    addItem({ id: item.id, name: item.name, price: item.price, size: 'M', quantity: 1 });
  };

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
            <WishlistCard key={item.id} item={item} onRemove={() => removeItem(item.id)} onAddToCart={() => handleAddToCart(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistCard({ item, onRemove, onAddToCart }: {
  item: { id: number; name: string; price: string; category: string };
  onRemove: () => void;
  onAddToCart: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Link href={`/products/${item.id}`}>
          <div style={{
            aspectRatio: '3/4',
            background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Photo coming soon
            </span>
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
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>{item.price}</span>
      </div>
      <button onClick={onAddToCart} style={{
        width: '100%', padding: '0.85rem',
        backgroundColor: hovered ? '#2C2C2C' : 'transparent',
        color: hovered ? '#FAF7F4' : '#2C2C2C',
        border: '1px solid #2C2C2C',
        fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
        letterSpacing: '0.15em', textTransform: 'uppercase',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
        Add to Bag
      </button>
    </div>
  );
}
