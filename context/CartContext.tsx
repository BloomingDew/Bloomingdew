'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createReservation, removeReservation, clearAllReservations } from '../lib/inventory';

export type CartItem = {
  id: number;
  name: string;
  priceUsd: number;          // unit price in USD (base currency)
  originalPriceUsd?: number; // pre-discount unit price in USD
  size: string;
  quantity: number;
  expiresAt?: Date;
  madeToOrder?: boolean;
  // Colourway. Stock, reservations and cart lines are keyed on
  // (product, colour, size), so Red/10 and Green/10 are separate lines.
  colourId?: string | null;
  colourName?: string | null;
};

// A cart line is identified by product + colour + size.
export const sameLine = (
  a: { id: number; size: string; colourId?: string | null },
  b: { id: number; size: string; colourId?: string | null },
) => a.id === b.id && a.size === b.size && (a.colourId ?? null) === (b.colourId ?? null);

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<{ success: boolean; message?: string }>;
  removeItem: (id: number, size: string, colourId?: string | null) => void;
  updateQuantity: (id: number, size: string, quantity: number, colourId?: string | null) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => void;
  totalItems: number;
  totalPriceUsd: number; // cart subtotal in USD; format per currency at display time
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bloomingdew_cart');
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        const now = new Date();
        const valid = parsed.filter(i =>
          // Drop legacy items saved before the USD refactor (no numeric priceUsd)…
          typeof i.priceUsd === 'number' &&
          // …and expired reservations.
          (i.madeToOrder || !i.expiresAt || new Date(i.expiresAt) > now),
        );
        setItems(valid);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('bloomingdew_cart', JSON.stringify(items));
  }, [items, hydrated]);

  // Check for expired reservations every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(item => {
        if (item.madeToOrder || !item.expiresAt) return true;
        // expiresAt may be a string after rehydration from localStorage
        return new Date(item.expiresAt).getTime() > now;
      }));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const addItem = async (item: CartItem): Promise<{ success: boolean; message?: string }> => {
    const colourId = item.colourId ?? null;

    // Made to order — no reservation needed
    if (item.madeToOrder) {
      setItems(prev => {
        const existing = prev.find(i => sameLine(i, item));
        if (existing) {
          return prev.map(i => sameLine(i, item)
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
          );
        }
        return [...prev, item];
      });
      setIsOpen(true);
      return { success: true };
    }

    // Ready to wear — reserve the FULL new quantity, not just the delta.
    // createReservation replaces our existing hold, so reserving only the
    // added amount would shrink the hold below what the cart shows.
    const existing = items.find(i => sameLine(i, item));
    const newQuantity = (existing?.quantity || 0) + item.quantity;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    if (existing) await removeReservation(item.id, item.size, colourId);
    const success = await createReservation(item.id, item.size, newQuantity, colourId);

    if (!success) {
      // Restore the previous hold so the cart stays consistent.
      if (existing) await createReservation(item.id, item.size, existing.quantity, colourId);
      return { success: false, message: 'Sorry, this item is no longer available in this size.' };
    }

    setItems(prev => {
      const current = prev.find(i => sameLine(i, item));
      if (current) {
        return prev.map(i => sameLine(i, item)
          ? { ...i, quantity: newQuantity, expiresAt }
          : i
        );
      }
      return [...prev, { ...item, expiresAt }];
    });
    setIsOpen(true);
    return { success: true };
  };

  const removeItem = (id: number, size: string, colourId: string | null = null) => {
    const key = { id, size, colourId };
    const item = items.find(i => sameLine(i, key));
    if (item && !item.madeToOrder) removeReservation(id, size, colourId);
    setItems(prev => prev.filter(i => !sameLine(i, key)));
  };

  const updateQuantity = async (
    id: number,
    size: string,
    quantity: number,
    colourId: string | null = null,
  ): Promise<{ success: boolean; message?: string }> => {
    const key = { id, size, colourId };
    if (quantity < 1) {
      removeItem(id, size, colourId);
      return { success: true };
    }

    const item = items.find(i => sameLine(i, key));
    if (!item) return { success: false };

    // Made to order — no stock limit
    if (item.madeToOrder) {
      setItems(prev => prev.map(i => sameLine(i, key) ? { ...i, quantity } : i));
      return { success: true };
    }

    // Ready to wear — re-reserve at the new quantity so we never exceed stock.
    // Release our current hold first so our own reserved units count as available.
    await removeReservation(id, size, colourId);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const success = await createReservation(id, size, quantity, colourId);

    if (!success) {
      // Restore the previous hold and report the cap.
      await createReservation(id, size, item.quantity, colourId);
      return { success: false, message: 'Sorry, there is not enough stock in this size.' };
    }

    setItems(prev => prev.map(i => sameLine(i, key) ? { ...i, quantity, expiresAt } : i));
    return { success: true };
  };

  const clearCart = () => {
    clearAllReservations();
    setItems([]);
    localStorage.removeItem('bloomingdew_cart');
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPriceUsd = items.reduce((sum, i) => sum + i.priceUsd * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPriceUsd,
      isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
