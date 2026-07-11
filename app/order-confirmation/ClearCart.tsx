'use client';

import { useEffect } from 'react';
import { useCart } from '../../context/CartContext';

// Clears the cart after a successful payment. Needed for the 3DS redirect flow,
// where Stripe navigates the browser here and the checkout page's inline
// clearCart() never runs. Idempotent, so it's harmless on the inline path too.
export default function ClearCart() {
  const { clearCart } = useCart();
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
