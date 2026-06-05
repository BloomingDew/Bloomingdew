'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '../lib/supabase-admin';

const navLinks = [
  { label: 'Products', href: '/admin' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Homepage', href: '/admin/homepage' },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div style={{
      backgroundColor: '#2C2C2C',
      padding: '0 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/admin" style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '1.1rem', color: '#FAF7F4',
        fontWeight: 500, textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}>
        Bloomingdew
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {navLinks.map(({ label, href }) => (
          <Link key={href} href={href} style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: '0.72rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', textDecoration: 'none',
            padding: '0.4rem 0.9rem',
            color: isActive(href) ? '#FAF7F4' : '#9A8F87',
            backgroundColor: isActive(href) ? 'rgba(255,255,255,0.08)' : 'transparent',
            borderRadius: '2px',
            transition: 'color 0.15s',
          }}>
            {label}
          </Link>
        ))}
      </nav>

      {/* Right */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/" target="_blank" style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#9A8F87', textDecoration: 'none',
        }}>
          View Site
        </Link>
        <button onClick={handleSignOut} style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#9A8F87', background: 'none', border: 'none',
          cursor: 'pointer',
        }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
