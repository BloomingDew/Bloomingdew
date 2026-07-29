'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { supabase } from '../lib/supabase';
import { imgUrl } from '../lib/imageUrl';

type Category = { id: number; name: string; slug: string; image_url: string | null };
type FeaturedProduct = { id: number; name: string; price: number; discount: number; product_images: { url: string }[] };

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [newCollectionTitle, setNewCollectionTitle] = useState('New Collection');
  const [newCollectionProducts, setNewCollectionProducts] = useState<FeaturedProduct[]>([]);
  const [marqueeOffset, setMarqueeOffset] = useState(0);

  useEffect(() => {
    supabase.from('categories').select('id, name, slug, image_url').order('name')
      .then(({ data }) => setCategories(data || []));
    supabase.from('products').select('id, name, price, discount, product_images(url)')
      .eq('featured', true).eq('available', true).limit(8)
      .then(({ data }) => setFeaturedProducts(data || []));

    fetch('/api/new-collection')
      .then(r => r.json())
      .then(({ title, products }) => {
        if (title) setNewCollectionTitle(title);
        if (products?.length) setNewCollectionProducts(products);
      })
      .catch(() => {});
  }, []);

  // Marquee animation
  useEffect(() => {
    let frame: number;
    let pos = 0;
    const animate = () => {
      pos -= 0.4;
      setMarqueeOffset(pos);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const marqueeText = 'New Collection · Handmade in Nigeria · Made to Order · Free Shipping on Orders Over $250 · ';
  const repeated = marqueeText.repeat(6);

  return (
    <div style={{ overflowX: 'hidden' }}>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', minHeight: '100vh', backgroundColor: '#1A1208', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="hero-section">
        {/* Left — text */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(3rem, 8vw, 7rem) clamp(2rem, 5vw, 5rem)',
          zIndex: 2, position: 'relative',
        }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: '#C9A882', marginBottom: '1.5rem',
          }}>
            Bloomingdew — SS 2025
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
            fontWeight: 500, color: '#FAF7F4',
            lineHeight: 1.1, marginBottom: '1.8rem',
            letterSpacing: '-0.01em',
          }}>
            Wear the<br />
            <em style={{ color: '#C9A882', fontStyle: 'italic' }}>feeling.</em>
          </h1>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '1rem',
            fontWeight: 300, color: '#9A8F87',
            lineHeight: 1.8, marginBottom: '3rem',
            maxWidth: '380px',
          }}>
            Handcrafted pieces that move with you — each garment made with intention, designed to be felt as much as seen.
          </p>
          <Link href="/shop" style={{
            display: 'inline-block', backgroundColor: '#C9A882',
            color: '#1A1208', padding: '1rem 2.5rem',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
            alignSelf: 'flex-start', width: 'fit-content',
          }}>
            Shop the New Collection
          </Link>
        </div>

        {/* Right — image placeholder / editorial frame */}
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg, #3D2B1F 0%, #1A1208 60%, #2C1A0E 100%)',
          minHeight: '100vh',
        }}>
          {/* Decorative gold frame accent */}
          <div style={{
            position: 'absolute', top: '8%', left: '8%', right: '8%', bottom: '8%',
            border: '1px solid #C9A88240', zIndex: 1, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 2,
          }}>
            <p style={{
              fontFamily: "'Playfair Display', serif", fontSize: '0.9rem',
              color: '#C9A88260', letterSpacing: '0.2em', textTransform: 'uppercase',
            }}>
              Editorial image
            </p>
          </div>
          {/* Gradient overlay linking to left panel */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, #1A1208 0%, transparent 30%)',
            zIndex: 3,
          }} />
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hero-section {
              grid-template-columns: 1fr !important;
              min-height: auto !important;
            }
            .hero-section > div:last-child {
              min-height: 50vw;
            }
          }
        `}</style>
      </section>

      {/* ── Marquee Strip ── */}
      <div style={{
        backgroundColor: '#C9A882', overflow: 'hidden',
        padding: '0.85rem 0', whiteSpace: 'nowrap',
      }}>
        <span style={{
          display: 'inline-block',
          transform: `translateX(${marqueeOffset % (marqueeText.length * 8.5)}px)`,
          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: '#1A1208', fontWeight: 500,
        }}>
          {repeated}
        </span>
      </div>

      {/* ── New Collection ── */}
      {newCollectionProducts.length > 0 && (
        <section style={{ padding: '6rem 0 0', backgroundColor: '#FAF7F4' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{
                  fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
                  letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: '#C9A882', marginBottom: '0.6rem',
                }}>
                  Just Arrived
                </p>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                  fontWeight: 500, color: '#2C2C2C', lineHeight: 1.1,
                }}>
                  {newCollectionTitle}
                </h2>
              </div>
              <Link href="/shop" style={{
                fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#2C2C2C', borderBottom: '1px solid #2C2C2C', paddingBottom: '2px',
              }}>
                View All
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '3px',
          }}>
            {newCollectionProducts.slice(0, 4).map((product) => (
              <NewCollectionCard key={product.id} product={product} />
            ))}
          </div>

          {newCollectionProducts.length > 4 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '3px', marginTop: '3px',
            }}>
              {newCollectionProducts.slice(4, 8).map((product) => (
                <NewCollectionCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Best Sellers ── */}
      <section style={{ padding: '7rem 0 0', backgroundColor: '#FAF7F4' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem 2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{
                  fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
                  letterSpacing: '0.28em', textTransform: 'uppercase',
                  color: '#C9A882', marginBottom: '0.6rem',
                }}>
                  Customer Favourites
                </p>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                  fontWeight: 500, color: '#2C2C2C', lineHeight: 1.1,
                }}>
                  Best Sellers
                </h2>
              </div>
              <Link href="/shop" style={{
                fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#2C2C2C', borderBottom: '1px solid #2C2C2C', paddingBottom: '2px',
              }}>
                View All
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '3px',
          }}>
            {featuredProducts.slice(0, 4).map((product) => (
              <NewCollectionCard key={product.id} product={product} />
            ))}
          </div>

          {featuredProducts.length > 4 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '3px', marginTop: '3px',
            }}>
              {featuredProducts.slice(4, 8).map((product) => (
                <NewCollectionCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

      {/* ── Editorial Banner ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        backgroundColor: '#1A1208', padding: '0',
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: '520px',
      }} className="editorial-banner">
        {/* Left — image */}
        <div style={{
          background: 'linear-gradient(135deg, #3D2B1F, #1A1208)',
          minHeight: '520px', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif", fontSize: '0.9rem',
            color: '#C9A88240', letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>Lookbook image</p>
        </div>
        {/* Right — text */}
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'clamp(3rem, 6vw, 6rem) clamp(2rem, 5vw, 5rem)',
        }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#C9A882', marginBottom: '1.2rem',
          }}>
            Custom Orders
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 3.5vw, 3.2rem)',
            fontWeight: 500, color: '#FAF7F4',
            lineHeight: 1.15, marginBottom: '1.5rem',
          }}>
            Made for you,<br />
            <em style={{ color: '#C9A882' }}>exactly.</em>
          </h2>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.95rem',
            fontWeight: 300, color: '#9A8F87',
            lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: '380px',
          }}>
            Have a vision in mind? We craft bespoke pieces tailored to your measurements, your fabric, your story.
          </p>
          <Link href="/custom" style={{
            display: 'inline-block', border: '1px solid #C9A882',
            color: '#C9A882', padding: '0.95rem 2.5rem',
            fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            alignSelf: 'flex-start',
          }}>
            Start Your Custom Order
          </Link>
        </div>
        <style>{`
          @media (max-width: 768px) { .editorial-banner { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* ── Brand Story ── */}
      <section style={{
        backgroundColor: '#E8DDD3', padding: '8rem 2rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* large decorative letter */}
        <div style={{
          position: 'absolute', top: '-0.2em', left: '-0.05em',
          fontFamily: "'Playfair Display', serif", fontSize: '28vw',
          fontWeight: 700, color: '#D4C4B510', lineHeight: 1,
          userSelect: 'none', pointerEvents: 'none',
        }}>B</div>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#9A8F87', marginBottom: '1.5rem',
          }}>Our Story</p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 500, color: '#2C2C2C',
            lineHeight: 1.25, marginBottom: '1.5rem',
          }}>
            Every stitch is made with intention.
          </h2>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '1rem',
            fontWeight: 300, color: '#5C5450',
            lineHeight: 1.9, marginBottom: '2.5rem',
          }}>
            Bloomingdew was born from a love of fabric, form, and the women who wear both with ease.
            Each piece is handcrafted in Nigeria — no shortcuts, no compromises. Just clothing made to last.
          </p>
          <Link href="/about" style={{
            display: 'inline-block', backgroundColor: '#2C2C2C',
            color: '#FAF7F4', padding: '1rem 2.8rem',
            fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>Meet the Maker</Link>
        </div>
      </section>

      {/* ── Instagram Strip ── */}
      <section style={{ padding: '6rem 2rem', backgroundColor: '#FAF7F4' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <a href="https://www.instagram.com/bloomingdeww/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <p style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: '#C9A882', marginBottom: '0.5rem',
            }}>Follow us</p>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 500, color: '#2C2C2C', marginBottom: '0.4rem',
            }}>@bloomingdeww</h2>
            <p style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.82rem',
              fontWeight: 300, color: '#9A8F87', marginBottom: '3rem',
            }}>On Instagram for new arrivals, behind the scenes & styling inspo.</p>
          </a>

          {/* Placeholder grid for Instagram posts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }} className="ig-grid">
            {[0, 1, 2, 3].map(i => (
              <a key={i} href="https://www.instagram.com/bloomingdeww/" target="_blank" rel="noopener noreferrer" style={{
                display: 'block', aspectRatio: '1',
                backgroundColor: i % 2 === 0 ? '#E8DDD3' : '#D4C4B5',
                position: 'relative', overflow: 'hidden',
                cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(44,44,44,0)', transition: 'background 0.25s',
                }} className="ig-hover">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FAF7F4" strokeWidth="1.5" style={{ opacity: 0, transition: 'opacity 0.25s' }} className="ig-icon">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </div>
              </a>
            ))}
          </div>
          <style>{`
            @media (max-width: 600px) { .ig-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            .ig-hover:hover { background: rgba(44,44,44,0.35) !important; }
            .ig-hover:hover .ig-icon { opacity: 1 !important; }
          `}</style>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ padding: '7rem 2rem', backgroundColor: '#1A1208', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          background: 'radial-gradient(circle, #C9A88212, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
            letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#C9A882', marginBottom: '1rem',
          }}>Stay in the loop</p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            fontWeight: 500, color: '#FAF7F4',
            lineHeight: 1.2, marginBottom: '1rem',
          }}>
            New pieces.<br />First access.
          </h2>
          <p style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.9rem',
            fontWeight: 300, color: '#9A8F87',
            lineHeight: 1.8, marginBottom: '2.5rem',
          }}>
            Sign up to hear about new collections, behind-the-scenes, and exclusive early access.
          </p>
          <form style={{ display: 'flex', gap: '0', maxWidth: '440px', margin: '0 auto' }} className="newsletter-form">
            <input
              type="email"
              placeholder="Your email address"
              style={{
                flex: 1, padding: '1rem 1.2rem',
                border: '1px solid #9A8F8750', borderRight: 'none',
                backgroundColor: '#ffffff08', color: '#FAF7F4',
                fontFamily: "'Jost', sans-serif", fontSize: '0.85rem',
                fontWeight: 300, outline: 'none',
              }}
            />
            <button type="submit" style={{
              padding: '1rem 1.5rem', backgroundColor: '#C9A882', color: '#1A1208',
              border: 'none', fontFamily: "'Jost', sans-serif",
              fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase',
              cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 500,
            }}>
              Sign Up
            </button>
          </form>
        </div>
        <style>{`
          @media (max-width: 480px) {
            .newsletter-form { flex-direction: column; }
            .newsletter-form input { border-right: 1px solid #9A8F8750 !important; border-bottom: none; }
          }
        `}</style>
      </section>

    </div>
  );
}

function NewCollectionCard({ product }: { product: FeaturedProduct }) {
  const [hovered, setHovered] = useState(false);
  const { addItem, removeItem, isWishlisted } = useWishlist();
  const { format } = useCurrency();
  const wishlisted = isWishlisted(product.id);
  const mainImage = imgUrl(product.product_images?.[0]?.url, { width: 400, quality: 75 });
  const salePriceUsd = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlisted
      ? removeItem(product.id)
      : addItem({ id: product.id, name: product.name, priceUsd: salePriceUsd, originalPriceUsd: product.discount > 0 ? product.price : undefined, category: '' });
  };

  return (
    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <div style={{
          aspectRatio: '3/4', position: 'relative', overflow: 'hidden',
          backgroundColor: '#FAF7F4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {mainImage ? (
            <img src={mainImage} alt={product.name} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
              transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.5s ease',
            }} />
          ) : (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Photo coming soon
            </span>
          )}
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
        <div style={{ padding: '0.9rem 0.2rem 0' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.3rem' }}>
            {product.name}
          </p>
          {product.discount > 0 ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#C0392B' }}>{format(salePriceUsd)}</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 300, color: '#9A8F87', textDecoration: 'line-through' }}>{format(product.price)}</p>
            </div>
          ) : (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>{format(product.price)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function FeaturedCard({ product }: { product: FeaturedProduct }) {
  const [hovered, setHovered] = useState(false);
  const { addItem, removeItem, isWishlisted } = useWishlist();
  const { format } = useCurrency();
  const wishlisted = isWishlisted(product.id);
  const mainImage = imgUrl(product.product_images?.[0]?.url, { width: 400, quality: 75 });

  const salePriceUsd = product.discount > 0
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlisted
      ? removeItem(product.id)
      : addItem({ id: product.id, name: product.name, priceUsd: salePriceUsd, originalPriceUsd: product.discount > 0 ? product.price : undefined, category: '' });
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
            <img src={mainImage} alt={product.name} style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
              transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.5s ease',
            }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9A8F87' }}>
              Photo coming soon
            </span>
          )}
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
        {product.discount > 0 ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 400, color: '#C0392B' }}>{format(salePriceUsd)}</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 300, color: '#9A8F87', textDecoration: 'line-through' }}>{format(product.price)}</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#C0392B' }}>-{product.discount}%</p>
          </div>
        ) : (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>{format(product.price)}</p>
        )}
      </div>
    </Link>
  );
}
