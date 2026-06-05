'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createReservation, removeReservation, clearAllReservations } from '../lib/inventory';

export type CartItem = {
  id: number;
  name: string;
  price: string;
  size: string;
  quantity: number;
  expiresAt?: Date;
  madeToOrder?: boolean;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<{ success: boolean; message?: string }>;
  removeItem: (id: number, size: string) => void;
  updateQuantity: (id: number, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
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
        // Filter out expired reservations
        const now = new Date();
        const valid = parsed.filter(i => i.madeToOrder || !i.expiresAt || new Date(i.expiresAt) > now);
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
      const now = new Date();
      setItems(prev => prev.filter(item => {
        if (item.madeToOrder || !item.expiresAt) return true;
        return item.expiresAt > now;
      }));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const addItem = async (item: CartItem): Promise<{ success: boolean; message?: string }> => {
    // Made to order — no reservation needed
    if (item.madeToOrder) {
      setItems(prev => {
        const existing = prev.find(i => i.id === item.id && i.size === item.size);
        if (existing) {
          return prev.map(i => i.id === item.id && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
          );
        }
        return [...prev, item];
      });
      setIsOpen(true);
      return { success: true };
    }

    // Ready to wear — create reservation
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const success = await createReservation(item.id, item.size, item.quantity);

    if (!success) {
      return { success: false, message: 'Sorry, this item is no longer available in this size.' };
    }

    setItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.size === item.size);
      if (existing) {
        return prev.map(i => i.id === item.id && i.size === item.size
          ? { ...i, quantity: i.quantity + item.quantity, expiresAt }
          : i
        );
      }
      return [...prev, { ...item, expiresAt }];
    });
    setIsOpen(true);
    return { success: true };
  };

  const removeItem = (id: number, size: string) => {
    const item = items.find(i => i.id === id && i.size === size);
    if (item && !item.madeToOrder) removeReservation(id, size);
    setItems(prev => prev.filter(i => !(i.id === id && i.size === size)));
  };

  const updateQuantity = (id: number, size: string, quantity: number) => {
    if (quantity < 1) return removeItem(id, size);
    setItems(prev => prev.map(i => i.id === id && i.size === size ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    clearAllReservations();
    setItems([]);
    localStorage.removeItem('bloomingdew_cart');
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => {
    const price = parseInt(i.price.replace(/\D/g, ''));
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice,
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
