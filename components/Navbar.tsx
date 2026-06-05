'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useUser } from '../context/UserContext';
import SearchOverlay from './SearchOverlay';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { openCart, totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user } = useUser();

  return (
    <>
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: '#FAF7F4',
        borderBottom: '1px solid #E8DDD3',
      }}>
        {/* Top row */}
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 2rem',
          height: '68px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'relative',
        }}>
          {/* Left — mobile toggle */}
          <div style={{ flex: 1 }}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn"
              style={{ fontSize: '1.2rem', color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer' }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Center — Logo */}
          <Link href="/" style={{
            fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500,
            letterSpacing: '0.08em', color: '#2C2C2C',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          }}>
            Bloomingdew
          </Link>

          {/* Right — icons */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.2rem' }}>
            <button onClick={() => setSearchOpen(true)} aria-label="Search" style={iconBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <Link href={user ? '/account' : '/account/login'} aria-label="Account" style={{ ...iconBtn, textDecoration: 'none', position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              {user && <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', backgroundColor: '#C9A882', borderRadius: '50%' }} />}
            </Link>

            <Link href="/wishlist" aria-label="Wishlist" style={{ ...iconBtn, position: 'relative', textDecoration: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {wishlistCount > 0 && <Badge count={wishlistCount} />}
            </Link>

            <button onClick={openCart} aria-label="Bag" style={{ ...iconBtn, position: 'relative' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {totalItems > 0 && <Badge count={totalItems} />}
            </button>
          </div>
        </div>

        {/* Second row — desktop nav */}
        <nav className="desktop-nav" style={{ borderTop: '1px solid #E8DDD3', padding: '0 2rem' }}>
          <ul style={{
            maxWidth: '1280px', margin: '0 auto',
            display: 'flex', justifyContent: 'center', gap: '3rem',
            listStyle: 'none', height: '44px', alignItems: 'center',
          }}>
            {navLinks.map(({ label, href }) => (
              <li key={href}><Link href={href} style={navLink}>{label}</Link></li>
            ))}
          </ul>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ backgroundColor: '#FAF7F4', borderTop: '1px solid #E8DDD3', padding: '1.5rem 2rem 2rem' }}>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {navLinks.map(({ label, href }) => (
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
    </>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span style={{
      position: 'absolute', top: '-6px', right: '-8px',
      backgroundColor: '#C9A882', color: '#FAF7F4',
      borderRadius: '50%', width: '16px', height: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Jost', sans-serif", fontSize: '0.6rem', fontWeight: 500,
    }}>
      {count}
    </span>
  );
}

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Custom', href: '/custom' },
  { label: 'Order Guide', href: '/order-guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'About', href: '/about' },
];

const navLink: React.CSSProperties = {
  fontFamily: "'Jost', sans-serif", fontWeight: 400,
  fontSize: '0.78rem', letterSpacing: '0.14em',
  textTransform: 'uppercase', color: '#2C2C2C',
};

const iconBtn: React.CSSProperties = {
  color: '#2C2C2C', display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '4px',
  background: 'none', border: 'none', cursor: 'pointer',
};
