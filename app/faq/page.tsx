'use client';

import { useState } from 'react';

const faqs = [
  {
    category: 'Ordering',
    questions: [
      { q: 'How long does it take to receive my order?', a: 'Our ready-to-wear pieces are available within 3–7 days. For custom orders, please allow 7–10 days for production and delivery. Once your order has been dispatched, you\'ll receive a dispatch notification with tracking details, allowing you to follow your piece every step of the way.' },
      { q: 'Can I change or cancel my order?', a: 'All purchases are final sale, so orders cannot be cancelled or amended once placed. For bespoke and made-to-measure pieces, an order cannot be cancelled once production or material procurement has begun. If something is wrong with your order, please contact us straight away via our contact page and we\'ll do our best to help.' },
      { q: 'Is everything shown available to order?', a: 'At Bloomingdew, we only display ready-to-wear pieces that are currently available and ready to be ordered. If your preferred size is not currently available on the website, simply visit our Custom Order page to select your desired piece and size. Alternatively, feel free to reach out to us, and we\'ll be happy to let you know when the style becomes available again.' },
    ],
  },
  {
    category: 'Sizing & Fit',
    questions: [
      { q: 'What if I\'m between sizes?', a: 'If you\'re between sizes, we recommend sizing up for a more comfortable fit. Alternatively, our Custom Order service allows us to make any piece to your exact measurements. Custom orders carry a standard 20–25% additional cost, with the possibility of a higher additional charge depending on the sizing and specific requirements of the piece. This ensures your Bloomingdew piece is thoughtfully made to your measurements for a more personalised fit.' },
      { q: 'Do you offer custom sizing?', a: 'Yes — all pieces can be made to your measurements. Custom orders carry a standard 20–25% additional cost, which may be higher depending on the sizing and specific requirements of the piece. Head to our Custom page to get started, or contact us directly and we\'ll talk you through it.' },
      { q: 'How do I measure myself?', a: 'You\'ll need a soft measuring tape. Measure your bust (around the fullest part), waist (natural waistline, usually the narrowest point), and hips (around the fullest part). Compare to our size guide on the Order Guide page.' },
    ],
  },
  {
    category: 'Shipping & Returns',
    questions: [
      { q: 'Do you ship internationally?', a: 'Yes, Bloomingdew ships worldwide. For international orders we use DHL, while orders within Nigeria are delivered through GIG. Delivery times vary depending on your location. Once your order is dispatched, you\'ll receive a dispatch notification with tracking details so you can follow your delivery.' },
      { q: 'Can I return my order?', a: 'All Bloomingdew purchases are final sale and are not eligible for return or exchange — including sale and promotional items. The only exception is an item that arrives incorrect, damaged in transit, or with a confirmed manufacturing defect: contact us within 48 hours of delivery and we\'ll put it right. Please read our full Refund, Return & Exchange Policy for details.' },
      { q: 'My order arrived damaged — what do I do?', a: 'We\'re so sorry to hear that. Please contact us within 48 hours of delivery with your order number and clear photographs showing the issue. Once verified, we may repair, replace or alter the item, or provide another suitable resolution. A refund will be considered where appropriate and subject to applicable law.' },
    ],
  },
  {
    category: 'Custom Orders',
    questions: [
      { q: 'How does the custom service work?', a: 'Fill in the enquiry form on our Custom page with your vision — occasion, silhouette, fabric preferences, and budget. We\'ll be in touch within 48 hours to discuss details and agree on a design before anything is made.' },
      { q: 'How much does a custom piece cost?', a: 'Pricing depends on the complexity of the garment, fabric choice, and timeline. Most custom pieces start from ₦50,000. Once we understand your vision, we\'ll provide a quote before you commit to anything.' },
      { q: 'Can I request a specific fabric or colour?', a: 'Absolutely. We work with a range of natural and luxury fabrics. Share your preferences in your enquiry and we\'ll let you know what\'s available and suggest alternatives if needed.' },
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (key: string) => setOpenItem(openItem === key ? null : key);

  return (
    <div>

      {/* Hero */}
      <section style={{
        padding: '6rem 2rem 5rem',
        textAlign: 'center',
        borderBottom: '1px solid #E8DDD3',
      }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.72rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#C9A882',
          marginBottom: '1rem',
        }}>
          Got questions?
        </p>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2rem, 4vw, 3.2rem)',
          fontWeight: 500,
          color: '#2C2C2C',
          lineHeight: 1.2,
          marginBottom: '1.2rem',
        }}>
          Frequently Asked Questions
        </h1>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.95rem',
          fontWeight: 300,
          color: '#9A8F87',
          maxWidth: '460px',
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          Can't find what you're looking for?{' '}
          <a href="/contact" style={{ color: '#C9A882', borderBottom: '1px solid #C9A882' }}>
            Get in touch
          </a>
        </p>
      </section>

      {/* FAQ accordion */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '5rem 2rem 7rem' }}>
        {faqs.map((section) => (
          <div key={section.category} style={{ marginBottom: '4rem' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.3rem',
              fontWeight: 500,
              color: '#2C2C2C',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #E8DDD3',
            }}>
              {section.category}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {section.questions.map((item) => {
                const key = `${section.category}-${item.q}`;
                const isOpen = openItem === key;

                return (
                  <div key={key} style={{ borderBottom: '1px solid #E8DDD3' }}>
                    <button
                      onClick={() => toggle(key)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1.3rem 0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '1rem',
                      }}
                    >
                      <span style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: '0.92rem',
                        fontWeight: 400,
                        color: '#2C2C2C',
                        lineHeight: 1.5,
                      }}>
                        {item.q}
                      </span>
                      <span style={{
                        color: '#C9A882',
                        fontSize: '1.1rem',
                        flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                      }}>
                        +
                      </span>
                    </button>

                    {isOpen && (
                      <p style={{
                        fontFamily: "'Jost', sans-serif",
                        fontSize: '0.88rem',
                        fontWeight: 300,
                        color: '#5C5450',
                        lineHeight: 1.9,
                        paddingBottom: '1.5rem',
                      }}>
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
