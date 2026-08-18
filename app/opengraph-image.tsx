import { ImageResponse } from 'next/og';

// Generated rather than a static file, so it can't drift out of date as the
// brand copy changes. Applies to every page that doesn't supply its own.
export const runtime = 'edge';
export const alt = 'Bloomingdew — handcrafted clothing, made in Lagos';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF7F4',
          // next/og has no web fonts loaded here; Georgia-style serif is the
          // closest widely-available stand-in for Playfair Display.
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 14,
            textTransform: 'uppercase',
            color: '#C9A882',
            marginBottom: 40,
          }}
        >
          Bloomingdew
        </div>
        <div style={{ fontSize: 76, color: '#2C2C2C', textAlign: 'center', lineHeight: 1.2, maxWidth: 900 }}>
          Handcrafted clothing,
        </div>
        <div style={{ fontSize: 76, color: '#2C2C2C', fontStyle: 'italic', marginTop: 6 }}>
          made in Lagos.
        </div>
        <div style={{ width: 90, height: 2, backgroundColor: '#C9A882', margin: '46px 0' }} />
        <div style={{ fontSize: 26, color: '#9A8F87', letterSpacing: 3 }}>
          bloomingdew.com
        </div>
      </div>
    ),
    size,
  );
}
