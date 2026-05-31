'use client';

import { useState } from 'react';
import { products } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const categories: { label: string; value: Product['category'] | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Sets', value: 'sets' },
  { label: 'Dresses', value: 'dresses' },
  { label: 'Jumpsuits', value: 'jumpsuits' },
  { label: 'Accessories', value: 'accessories' },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get('category') as Product['category']) || 'all';
  const [activeCategory, setActiveCategory] = useState<Product['category'] | 'all'>(initialCategory);

  const filtered =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <>
      {/* Category Tabs */}
      <div className="flex gap-1 flex-wrap mb-10">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`text-xs tracking-widest uppercase px-5 py-2.5 border transition-colors ${
              activeCategory === cat.value
                ? 'bg-charcoal text-cream border-charcoal'
                : 'border-border text-charcoal hover:border-charcoal'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-warm-gray py-20 text-sm">
          No products in this category yet. Check back soon.
        </p>
      )}
    </>
  );
}

export default function ShopPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">The Collection</p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold">Our Pieces</h1>
      </div>

      <Suspense fallback={<div className="text-warm-gray text-sm">Loading...</div>}>
        <ShopContent />
      </Suspense>
    </div>
  );
}
