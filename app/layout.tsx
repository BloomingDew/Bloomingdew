'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { UserProvider } from '../context/UserContext';
import { CurrencyProvider } from '../context/CurrencyContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <html lang="en">
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <CurrencyProvider>
        <UserProvider>
        <CartProvider>
          <WishlistProvider>
            <Navbar />
            <CartDrawer />
            <main style={{ flex: 1 }}>
              {children}
            </main>
            <Footer />
          </WishlistProvider>
        </CartProvider>
        </UserProvider>
        </CurrencyProvider>
        <Analytics />
      </body>
    </html>
  );
}
