'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type WishlistItem = {
  id: number;
  name: string;
  price: string;
  category: string;
};

type WishlistContextType = {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  isWishlisted: (id: number) => boolean;
  totalItems: number;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  const addItem = (item: WishlistItem) => {
    setItems((prev) => prev.find((i) => i.id === item.id) ? prev : [...prev, item]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const isWishlisted = (id: number) => items.some((i) => i.id === id);

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isWishlisted, totalItems: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
