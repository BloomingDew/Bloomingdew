'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from '../lib/supabase-admin';
import { supabase } from '../lib/supabase';

const navLinks = [
  { label: 'Products', href: '/admin' },
  { label: 'Orders', href: '/admin/orders' },
  { label: 'Enquiries', href: '/admin/enquiries' },
  { label: 'Media', href: '/admin/media' },
  { label: 'Email Templates', href: '/admin/email-templates' },
];

export default function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [enquiryCount, setEnquiryCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      const [{ count: eCount }, { count: oCount }] = await Promise.all([
        supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
          .eq('read', false),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);
      setEnquiryCount(eCount ?? 0);
      setOrderCount(oCount ?? 0);
    }
    fetchCounts();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname.startsWith('/admin/products');
    }
    return pathname.startsWith(href);
  };

  const getBadgeCount = (label: string) => {
    if (label === 'Enquiries') return enquiryCount;
    if (label === 'Orders') return orderCount;
    return 0;
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
        {navLinks.map(({ label, href }) => {
          const badgeCount = getBadgeCount(label);
          return (
            <Link key={href} href={href} style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.72rem', letterSpacing: '0.1em',
              textTransform: 'uppercase', textDecoration: 'none',
              padding: '0.4rem 0.9rem',
              color: isActive(href) ? '#FAF7F4' : '#9A8F87',
              backgroundColor: isActive(href) ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderRadius: '2px',
              transition: 'color 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              {label}
              {badgeCount > 0 && (
                <span style={{
                  backgroundColor: '#C8A96E',
                  color: '#2C2C2C',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
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
