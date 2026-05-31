'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-cream/90 text-charcoal text-[10px] tracking-widest uppercase px-2 py-1">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="mt-3">
        <p className="text-sm font-medium text-charcoal">{product.name}</p>
        <p className="text-sm text-warm-gray mt-0.5">${(product.price / 100).toFixed(2)}</p>
      </div>
    </Link>
  );
}
