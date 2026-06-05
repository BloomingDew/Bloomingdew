'use client';

import './globals.css';
import { usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { UserProvider } from '../context/UserContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return (
      <html lang="en">
        <body>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
      </body>
    </html>
  );
}
