import Link from 'next/link';

const categories = [
  { label: 'New In', slug: 'new-in' },
  { label: 'Dresses', slug: 'dresses' },
  { label: 'Sets', slug: 'sets' },
  { label: 'Tops', slug: 'tops' },
];

const featuredProducts = [
  { id: 1, name: 'Linen Wrap Dress', price: '£120' },
  { id: 2, name: 'Ivory Slip Set', price: '£95' },
  { id: 3, name: 'Blush Midi Skirt', price: '£75' },
  { id: 4, name: 'Cream Corset Top', price: '£60' },
];

export default function Home() {
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
              <Link key={cat.slug} href={`/shop?category=${cat.slug}`} style={{
                display: 'block',
                textDecoration: 'none',
              }}>
                <div style={{
                  backgroundColor: '#E8DDD3',
                  aspectRatio: '3/4',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '1.5rem',
                  background: `linear-gradient(160deg, #EDE4DA, #C9A882)`,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* placeholder label in center */}
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: '#9A8F87',
                  }}>
                    Image coming soon
                  </span>
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '1.3rem',
                    fontWeight: 500,
                    color: '#2C2C2C',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {cat.label}
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
              <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                <div>
                  {/* Product image placeholder */}
                  <div style={{
                    backgroundColor: '#E8DDD3',
                    aspectRatio: '3/4',
                    marginBottom: '1rem',
                    background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: '0.7rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: '#9A8F87',
                    }}>
                      Photo coming soon
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: 400,
                    color: '#2C2C2C',
                    marginBottom: '0.3rem',
                  }}>
                    {product.name}
                  </p>
                  <p style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: 300,
                    color: '#9A8F87',
                  }}>
                    {product.price}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
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
