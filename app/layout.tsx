import type { Metadata } from 'next';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';

export const metadata: Metadata = {
  title: 'Bloomingdew',
  description: 'Handcrafted clothing made with love.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
      </body>
    </html>
  );
}
