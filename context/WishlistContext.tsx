'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type WishlistItem = {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('bloomingdew_wishlist');
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  // Track logged-in user and sync wishlist from DB
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        syncFromDB(session.user.id);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        syncFromDB(session.user.id);
      } else {
        setUserId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const syncFromDB = async (uid: string) => {
    const { data } = await supabase
      .from('wishlists')
      .select('product_id, products(id, name, price, discount, categories(name))')
      .eq('user_id', uid);
    if (!data) return;
    const dbItems: WishlistItem[] = data.map((row: any) => {
      const rawPrice = row.products?.price || 0;
      const discount = row.products?.discount || 0;
      const salePrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;
      return {
        id: row.product_id,
        name: row.products?.name || '',
        price: `₦${salePrice}`,
        originalPrice: discount > 0 ? `₦${rawPrice}` : undefined,
        category: row.products?.categories?.name || '',
      };
    });
    setItems(dbItems);
    localStorage.setItem('bloomingdew_wishlist', JSON.stringify(dbItems));
  };

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('bloomingdew_wishlist', JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = (item: WishlistItem) => {
    setItems(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
    if (userId) {
      supabase.from('wishlists').insert({ user_id: userId, product_id: item.id }).then(() => {});
    }
  };

  const removeItem = (id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (userId) {
      supabase.from('wishlists').delete().match({ user_id: userId, product_id: id }).then(() => {});
    }
  };

  const isWishlisted = (id: number) => items.some(i => i.id === id);

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
