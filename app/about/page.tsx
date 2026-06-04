import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';

export const revalidate = 60;

async function getAboutImage(): Promise<string | null> {
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'about_image_url').single();
  return data?.value ?? null;
}

export default async function AboutPage() {
  const aboutImage = await getAboutImage();
  return (
    <div>

      {/* Hero */}
      <section style={{
        height: '60vh',
        background: 'linear-gradient(135deg, #E8DDD3 0%, #D4C4B5 60%, #C9A882 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.72rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#9A8F87',
            marginBottom: '1.2rem',
          }}>
            Our Story
          </p>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 500,
            color: '#2C2C2C',
            lineHeight: 1.2,
          }}>
            Made by hand.<br />Worn with love.
          </h1>
        </div>
      </section>

      {/* Story section */}
      <section style={{ padding: '7rem 2rem' }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6rem',
          alignItems: 'center',
        }} className="about-grid">

          {/* About image */}
          <div style={{ aspectRatio: '4/5', position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)' }}>
            {aboutImage && (
              <Image
                src={aboutImage}
                alt="The woman behind Bloomingdew"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: 'cover' }}
              />
            )}
          </div>

          {/* Text */}
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 500,
              color: '#2C2C2C',
              marginBottom: '1.5rem',
              lineHeight: 1.3,
            }}>
              The woman behind Bloomingdew
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {[
                "Bloomingdew began the way most beautiful things do — quietly, at home, with a love that needed somewhere to go.",
                "Every piece in this collection is cut, sewn, and finished by hand. No factory lines, no shortcuts. Just fabric, intention, and years of craft poured into clothing that's made to be felt as much as worn.",
                "This brand is for the woman who appreciates the difference. Who knows that what you wear is an extension of how you carry yourself — and who deserves something made just for her.",
              ].map((para, i) => (
                <p key={i} style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: 300,
                  color: '#5C5450',
                  lineHeight: 1.9,
                }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section style={{ backgroundColor: '#FAF7F4', padding: '5rem 2rem', borderTop: '1px solid #E8DDD3', borderBottom: '1px solid #E8DDD3' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.6rem',
            fontWeight: 500,
            color: '#2C2C2C',
            textAlign: 'center',
            marginBottom: '4rem',
          }}>
            What we stand for
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            textAlign: 'center',
          }}>
            {[
              { title: 'Handmade', body: 'Every piece is made by hand, one at a time. No mass production, ever.' },
              { title: 'Intentional', body: 'We only make what we believe in. Quality over quantity, always.' },
              { title: 'Made to Order', body: 'Your piece is made for you, when you order it. Nothing sits in a warehouse.' },
              { title: 'Lasting', body: 'Designed to be worn for years, not seasons. Timeless over trend.' },
            ].map((value) => (
              <div key={value.title}>
                <div style={{
                  width: '40px',
                  height: '1px',
                  backgroundColor: '#C9A882',
                  margin: '0 auto 1.5rem',
                }} />
                <h3 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: '#2C2C2C',
                  marginBottom: '0.75rem',
                }}>
                  {value.title}
                </h3>
                <p style={{
                  fontFamily: "'Jost', sans-serif",
                  fontSize: '0.85rem',
                  fontWeight: 300,
                  color: '#9A8F87',
                  lineHeight: 1.8,
                }}>
                  {value.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '7rem 2rem',
        textAlign: 'center',
        backgroundColor: '#2C2C2C',
      }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.72rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: '#C9A882',
          marginBottom: '1.2rem',
        }}>
          Ready to find your piece?
        </p>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.8rem, 4vw, 3rem)',
          fontWeight: 500,
          color: '#FAF7F4',
          marginBottom: '2.5rem',
          lineHeight: 1.3,
        }}>
          Shop the collection.
        </h2>
        <Link href="/shop" style={{
          display: 'inline-block',
          backgroundColor: '#C9A882',
          color: '#2C2C2C',
          padding: '1rem 3rem',
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.78rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 400,
        }}>
          Shop Now
        </Link>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
        }
      `}</style>
    </div>
  );
}
