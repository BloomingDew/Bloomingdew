'use client';

import { use, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import ProductGallery from '@/components/ProductGallery';

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'shipping'>('description');
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-warm-gray mb-8">
        <Link href="/" className="hover:text-charcoal transition-colors">Home</Link>
        <span>·</span>
        <Link href="/shop" className="hover:text-charcoal transition-colors">Shop</Link>
        <span>·</span>
        <Link
          href={`/shop?category=${product.category}`}
          className="hover:text-charcoal transition-colors capitalize"
        >
          {product.category}
        </Link>
        <span>·</span>
        <span className="text-charcoal">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Product Info */}
        <div className="flex flex-col">
          <p className="text-gold text-xs tracking-widest uppercase mb-2 capitalize">
            {product.category}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3">
            {product.name}
          </h1>
          <p className="text-2xl font-light mb-6">
            ${(product.price / 100).toFixed(2)}
          </p>

          {/* Color Selector */}
          <div className="mb-5">
            <p className="text-xs tracking-widest uppercase mb-3">
              Color: <span className="font-medium">{selectedColor}</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`text-xs px-4 py-1.5 border transition-colors ${
                    selectedColor === color
                      ? 'border-charcoal bg-charcoal text-cream'
                      : 'border-border hover:border-charcoal'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs tracking-widest uppercase">
                Size: {selectedSize && <span className="font-medium">{selectedSize}</span>}
              </p>
              <Link
                href="/size-guide"
                className="text-xs text-warm-gray border-b border-warm-gray hover:text-charcoal hover:border-charcoal transition-colors"
              >
                Size Guide
              </Link>
            </div>
            <div className="flex gap-2 flex-wrap">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`text-xs px-3 py-1.5 border transition-colors ${
                    selectedSize === size
                      ? 'border-charcoal bg-charcoal text-cream'
                      : 'border-border hover:border-charcoal'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {!selectedSize && (
              <p className="text-xs text-warm-gray mt-2">Please select a size</p>
            )}
          </div>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedSize}
            className={`w-full py-4 text-sm tracking-widest uppercase transition-colors ${
              added
                ? 'bg-gold text-cream'
                : selectedSize
                ? 'bg-charcoal text-cream hover:bg-charcoal/80'
                : 'bg-border text-warm-gray cursor-not-allowed'
            }`}
          >
            {added ? 'Added to Cart ✓' : 'Add to Cart'}
          </button>

          {/* Custom Order Note */}
          {product.sizes.includes('Custom') && (
            <p className="text-xs text-warm-gray text-center mt-3">
              Select &quot;Custom&quot; for made-to-measure sizing.{' '}
              <Link href="/about#custom" className="underline hover:text-charcoal transition-colors">
                Learn more
              </Link>
            </p>
          )}

          {/* Tabs */}
          <div className="mt-10 border-t border-border">
            <div className="flex gap-6 pt-5 mb-5">
              {(['description', 'details', 'shipping'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs tracking-widest uppercase transition-colors pb-1 border-b-2 ${
                    activeTab === tab
                      ? 'border-charcoal text-charcoal'
                      : 'border-transparent text-warm-gray hover:text-charcoal'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'description' && (
              <p className="text-sm text-charcoal leading-relaxed">{product.description}</p>
            )}

            {activeTab === 'details' && (
              <ul className="space-y-2">
                {product.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                    <span className="text-gold mt-1">—</span>
                    {d}
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-charcoal">
                  <span className="text-gold mt-1">—</span>
                  Fabric: {product.fabric}
                </li>
              </ul>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 text-sm text-charcoal leading-relaxed">
                <div>
                  <p className="font-medium mb-1">Ready-to-Wear Orders</p>
                  <p className="text-warm-gray">Lagos: 2–4 business days · Nigeria (interstate): 5–7 days · International: 10–15 business days</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Custom Orders</p>
                  <p className="text-warm-gray">Custom pieces are made to order and take 10–21 business days before dispatch. You will receive tracking once shipped.</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Free Shipping</p>
                  <p className="text-warm-gray">All orders over $150 ship free. International duties and taxes may apply.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
