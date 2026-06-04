'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlist } from '../context/WishlistContext';
import { supabase } from '../lib/supabase';

type Category = { id: number; name: string; slug: string; image_url: string | null };
type FeaturedProduct = { id: number; name: string; price: number; product_images: { url: string }[] };

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);

  useEffect(() => {
    supabase.from('categories').select('id, name, slug, image_url').order('name')
      .then(({ data }) => setCategories(data || []));
    supabase.from('products').select('id, name, price, product_images(url)')
      .eq('featured', true).eq('available', true).limit(8)
      .then(({ data }) => setFeaturedProducts(data || []));
  }, []);

  return (
    <div>

      {/* Hero */}
      <section style={{
        position: 'relative',
        height: '90vh',
        backgroundColor: '#E8DDD3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Placeholder bg texture */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #E8DDD3 0%, #D4C4B5 50%, #C9A882 100%)',
          opacity: 0.6,
        }} />

        <div style={{
          position: 'relative',
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '700px',
        }}>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#9A8F87',
            marginBottom: '1.5rem',
          }}>
            New Collection
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 500,
            color: '#2C2C2C',
            lineHeight: 1.15,
            marginBottom: '1.5rem',
          }}>
            Crafted with care,<br />worn with grace.
          </h1>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '1rem',
            fontWeight: 300,
            color: '#5C5450',
            marginBottom: '2.5rem',
            lineHeight: 1.7,
          }}>
            Handmade clothing designed for the woman who moves with intention.
          </p>
          <Link href="/shop" style={{
            display: 'inline-block',
            backgroundColor: '#2C2C2C',
            color: '#FAF7F4',
            padding: '1rem 3rem',
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.78rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 400,
          }}>
            Shop Now
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.8rem',
            fontWeight: 500,
            textAlign: 'center',
            marginBottom: '3rem',
            color: '#2C2C2C',
          }}>
            Shop by Category
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}>
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/shop?category=${cat.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div style={{
                  aspectRatio: '3/4', position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(160deg, #EDE4DA, #C9A882)',
                  display: 'flex', alignItems: 'flex-end', padding: '1.5rem',
                }}>
                  {cat.image_url && (
                    <img src={cat.image_url} alt={cat.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  {!cat.image_url && (
                    <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A8F87' }}>
                      Image coming soon
                    </span>
                  )}
                  {/* Dark overlay for text readability */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)', zIndex: 1 }} />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 500, color: cat.image_url ? '#FAF7F4' : '#2C2C2C', position: 'relative', zIndex: 2 }}>
                    {cat.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '2rem 2rem 6rem', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '3rem',
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.8rem',
              fontWeight: 500,
              color: '#2C2C2C',
            }}>
              Featured Pieces
            </h2>
            <Link href="/shop" style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#9A8F87',
              borderBottom: '1px solid #9A8F87',
              paddingBottom: '2px',
            }}>
              View All
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.5rem',
          }}>
            {featuredProducts.map((product) => (
              <FeaturedCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ padding: '5rem 2rem', backgroundColor: '#E8DDD3' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '1rem' }}>
            Stay in the loop
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.75rem' }}>
            New pieces. First access.
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#5C5450', marginBottom: '2rem', lineHeight: 1.7 }}>
            Sign up to hear about new collections, behind-the-scenes, and exclusive early access.
          </p>
          <form style={{ display: 'flex', gap: '0', maxWidth: '420px', margin: '0 auto' }} className="newsletter-form">
            <input
              type="email"
              placeholder="Your email address"
              style={{
                flex: 1, padding: '1rem 1.2rem',
                border: '1px solid #C9A882', borderRight: 'none',
                backgroundColor: '#FAF7F4', color: '#2C2C2C',
                fontFamily: "'Jost', sans-serif", fontSize: '0.85rem',
                fontWeight: 300, outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '1rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
              border: 'none', fontFamily: "'Jost', sans-serif",
              fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              Sign Up
            </button>
          </form>
        </div>
        <style>{`
          @media (max-width: 480px) {
            .newsletter-form { flex-direction: column; }
            .newsletter-form input { border-right: 1px solid #C9A882 !important; border-bottom: none; }
          }
        `}</style>
      </section>

      {/* Brand Story Teaser */}
      <section style={{
        padding: '7rem 2rem',
        backgroundColor: '#2C2C2C',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: '#C9A882',
            marginBottom: '1.5rem',
          }}>
            Our Story
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 500,
            color: '#FAF7F4',
            lineHeight: 1.3,
            marginBottom: '1.5rem',
          }}>
            Every stitch is made with intention.
          </h2>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.95rem',
            fontWeight: 300,
            color: '#9A8F87',
            lineHeight: 1.9,
            marginBottom: '2.5rem',
          }}>
            Bloomingdew was born from a love of fabric, form, and the women who wear both with ease.
            Each piece is handcrafted — no shortcuts, no compromises.
          </p>
          <Link href="/about" style={{
            display: 'inline-block',
            border: '1px solid #C9A882',
            color: '#C9A882',
            padding: '0.9rem 2.5rem',
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
            Meet the Maker
          </Link>
        </div>
      </section>

    </div>
  );
}

function FeaturedCard({ product }: { product: FeaturedProduct }) {
  const [hovered, setHovered] = useState(false);
  const { addItem, removeItem, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const mainImage = product.product_images?.[0]?.url;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlisted
      ? removeItem(product.id)
      : addItem({ id: product.id, name: product.name, price: `£${product.price}`, category: '' });
  };

  return (
    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{
          aspectRatio: '3/4', marginBottom: '1rem',
          background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {mainImage ? (
            <img src={mainImage} alt={product.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
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
        </div>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.3rem' }}>
          {product.name}
        </p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
          £{product.price}
        </p>
      </div>
    </Link>
  );
}
