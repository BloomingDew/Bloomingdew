'use client';

import { usePathname } from 'next/navigation';
import TikTokPixel from './TikTokPixel';
import Navbar from './Navbar';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { UserProvider } from '../context/UserContext';
import { CurrencyProvider } from '../context/CurrencyContext';

// The chrome and client-side providers.
//
// This used to live in app/layout.tsx, which made the root layout a client
// component — and a client component cannot export `metadata`, so the whole
// site shipped without a single title tag. Keeping the shell here lets the
// layout stay a server component.
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The admin runs on its own subdomain with none of the storefront chrome,
  // and deliberately without the marketing pixel.
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <>
      <CurrencyProvider>
        <UserProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <CartDrawer />
              <main style={{ flex: 1 }}>{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </UserProvider>
      </CurrencyProvider>
      <TikTokPixel />
    </>
  );
}
