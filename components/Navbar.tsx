'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: '#FAF7F4',
      borderBottom: '1px solid #E8DDD3',
    }}>

      {/* Top row — icons left, logo center, icons right */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 2rem',
        height: '68px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
      }}>

        {/* Left — mobile menu toggle (hidden on desktop) */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            className="mobile-menu-btn"
            style={{ fontSize: '1.2rem', color: '#2C2C2C', letterSpacing: 0 }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Center — Logo */}
        <Link href="/" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.6rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          color: '#2C2C2C',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}>
          Bloomingdew
        </Link>

        {/* Right — icons */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.2rem' }}>
          <button aria-label="Search" style={iconBtn} title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <button aria-label="Account" style={iconBtn} title="Account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <button aria-label="Wishlist" style={iconBtn} title="Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button aria-label="Bag" style={iconBtn} title="Bag">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Second row — nav links, desktop only */}
      <nav className="desktop-nav" style={{
        borderTop: '1px solid #E8DDD3',
        padding: '0 2rem',
      }}>
        <ul style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          listStyle: 'none',
          height: '44px',
          alignItems: 'center',
        }}>
          <li><Link href="/shop" style={navLink}>Shop</Link></li>
          <li><Link href="/custom" style={navLink}>Custom</Link></li>
          <li><Link href="/order-guide" style={navLink}>Order Guide</Link></li>
          <li><Link href="/faq" style={navLink}>FAQ</Link></li>
          <li><Link href="/about" style={navLink}>About</Link></li>
        </ul>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#FAF7F4',
          borderTop: '1px solid #E8DDD3',
          padding: '1.5rem 2rem 2rem',
        }} className="mobile-nav">
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {[
              { label: 'Shop', href: '/shop' },
              { label: 'Custom', href: '/custom' },
              { label: 'Order Guide', href: '/order-guide' },
              { label: 'FAQ', href: '/faq' },
              { label: 'About', href: '/about' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={href} onClick={() => setMenuOpen(false)} style={navLink}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .mobile-menu-btn { display: none; }
        @media (max-width: 768px) {
          .desktop-nav { display: none; }
          .mobile-menu-btn { display: block; }
        }
      `}</style>
    </header>
  );
}

const navLink: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 400,
  fontSize: '0.78rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#2C2C2C',
};

const iconBtn: React.CSSProperties = {
  color: '#2C2C2C',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
};
