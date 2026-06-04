'use client';

import { useCart } from '../context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const router = useRouter();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(44,44,44,0.4)',
            zIndex: 200,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        height: '100vh',
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#FAF7F4',
        zIndex: 201,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #E8DDD3',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C' }}>
              Your Bag
            </h2>
            {totalItems > 0 && (
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          <button onClick={closeCart} style={{ fontSize: '1.2rem', color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C2C2C', marginBottom: '0.75rem' }}>
                Your bag is empty
              </p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87', marginBottom: '2rem' }}>
                Discover pieces made just for you.
              </p>
              <button onClick={closeCart} style={{
                fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.15em',
                textTransform: 'uppercase', background: 'none', border: 'none',
                borderBottom: '1px solid #2C2C2C', cursor: 'pointer', paddingBottom: '2px', color: '#2C2C2C',
              }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {items.map((item) => (
                <div key={`${item.id}-${item.size}`} style={{
                  display: 'flex', gap: '1rem', paddingBottom: '1.5rem',
                  borderBottom: '1px solid #E8DDD3',
                }}>
                  {/* Image placeholder */}
                  <div style={{
                    width: '80px', height: '100px', flexShrink: 0,
                    background: 'linear-gradient(150deg, #F0E8E0, #D4C4B5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '0.55rem', color: '#9A8F87', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Photo</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 400, color: '#2C2C2C', marginBottom: '0.25rem' }}>
                      {item.name}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', fontWeight: 300, color: '#9A8F87', marginBottom: '0.75rem' }}>
                      Size: {item.size}
                    </p>

                    {/* Quantity + remove */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E8DDD3' }}>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          style={{ width: '32px', height: '32px', background: 'none', border: 'none', cursor: 'pointer', color: '#2C2C2C', fontSize: '1rem' }}>
                          −
                        </button>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', width: '28px', textAlign: 'center', color: '#2C2C2C' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          style={{ width: '32px', height: '32px', background: 'none', border: 'none', cursor: 'pointer', color: '#2C2C2C', fontSize: '1rem' }}>
                          +
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>
                          {item.price}
                        </span>
                        <button
                          onClick={() => removeItem(item.id, item.size)}
                          style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #E8DDD3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Subtotal
              </span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.95rem', fontWeight: 400, color: '#2C2C2C' }}>
                £{totalPrice}
              </span>
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', fontWeight: 300, color: '#9A8F87', marginBottom: '1.2rem', textAlign: 'center' }}>
              Shipping calculated at checkout
            </p>
            <button style={{
              width: '100%', padding: '1.1rem',
              backgroundColor: '#2C2C2C', color: '#FAF7F4',
              fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              border: 'none', cursor: 'pointer', marginBottom: '0.75rem',
            }} onClick={() => { closeCart(); router.push('/checkout'); }}>
              Checkout
            </button>
            <button onClick={closeCart} style={{
              width: '100%', padding: '1rem',
              backgroundColor: 'transparent', color: '#2C2C2C',
              fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
              letterSpacing: '0.15em', textTransform: 'uppercase',
              border: '1px solid #E8DDD3', cursor: 'pointer',
            }}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
