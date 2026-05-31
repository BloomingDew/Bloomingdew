'use client';

import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            name: i.product.name,
            size: i.size,
            color: i.color,
            price: i.product.price,
            quantity: i.quantity,
            image: i.product.images[0],
          })),
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-cream z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-display text-lg tracking-wide">
            Your Cart {items.length > 0 && <span className="text-warm-gray text-base">({items.length})</span>}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-charcoal hover:text-gold transition-colors"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="h-12 w-12 text-warm-gray mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-warm-gray text-sm">Your cart is empty</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="flex gap-4 py-5"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 flex-shrink-0 bg-stone-100 overflow-hidden">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal">{item.product.name}</p>
                    <p className="text-xs text-warm-gray mt-0.5">
                      {item.color} · {item.size}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      ${(item.product.price / 100).toFixed(2)}
                    </p>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)
                        }
                        className="w-6 h-6 border border-border flex items-center justify-center text-xs hover:border-charcoal transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)
                        }
                        className="w-6 h-6 border border-border flex items-center justify-center text-xs hover:border-charcoal transition-colors"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeItem(item.product.id, item.size, item.color)}
                        className="ml-auto text-warm-gray hover:text-charcoal transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-warm-gray">Subtotal</span>
              <span className="text-sm font-medium">${(total / 100).toFixed(2)}</span>
            </div>
            <p className="text-xs text-warm-gray mb-4">Shipping calculated at checkout</p>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-charcoal text-cream text-sm tracking-widest uppercase py-3 hover:bg-charcoal/80 transition-colors disabled:opacity-60"
            >
              {loading ? 'Redirecting...' : 'Checkout →'}
            </button>
            <button
              onClick={clearCart}
              className="w-full mt-2 text-xs text-warm-gray hover:text-charcoal transition-colors py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
