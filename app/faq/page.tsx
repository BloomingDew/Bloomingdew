'use client';

import { useState } from 'react';

const faqs = [
  {
    category: 'Ordering',
    questions: [
      { q: 'How long does it take to receive my order?', a: 'All pieces are made to order. Once you place your order, please allow 2–4 weeks for production, plus shipping time. You\'ll receive a dispatch notification with tracking when your piece is on its way.' },
      { q: 'Can I change or cancel my order?', a: 'You can cancel or amend your order within 24 hours of placing it. After that, production will have begun and we\'re unable to make changes. Please contact us as soon as possible at hello@bloomingdew.com.' },
      { q: 'Do you restock sold-out items?', a: 'Because everything is made to order, items don\'t technically sell out. If a style is unavailable, it\'s usually because we\'re updating it. Feel free to reach out and we\'ll let you know when it returns.' },
    ],
  },
  {
    category: 'Sizing & Fit',
    questions: [
      { q: 'What if I\'m between sizes?', a: 'We recommend sizing up if you\'re between sizes. Alternatively, our custom service allows us to make any piece to your exact measurements at no extra cost.' },
      { q: 'Do you offer custom sizing?', a: 'Yes — all pieces can be made to your measurements. Head to our Custom page to get started or contact us directly.' },
      { q: 'How do I measure myself?', a: 'You\'ll need a soft measuring tape. Measure your bust (around the fullest part), waist (natural waistline, usually the narrowest point), and hips (around the fullest part). Compare to our size guide on the Order Guide page.' },
    ],
  },
  {
    category: 'Shipping & Returns',
    questions: [
      { q: 'Do you ship internationally?', a: 'Yes, we ship worldwide. Shipping times and costs vary by location — full details are on our Order Guide page.' },
      { q: 'Can I return my order?', a: 'Because every piece is made to order, we\'re unable to accept returns unless the item arrives damaged or faulty. If there\'s an issue, contact us within 7 days of receiving your order and we\'ll resolve it.' },
      { q: 'My order arrived damaged — what do I do?', a: 'We\'re so sorry to hear that. Please email hello@bloomingdew.com with your order number and photos of the damage within 7 days of receiving it. We\'ll send a replacement or issue a full refund.' },
    ],
  },
  {
    category: 'Custom Orders',
    questions: [
      { q: 'How does the custom service work?', a: 'Fill in the enquiry form on our Custom page with your vision — occasion, silhouette, fabric preferences, and budget. We\'ll be in touch within 48 hours to discuss details and agree on a design before anything is made.' },
      { q: 'How much does a custom piece cost?', a: 'Pricing depends on the complexity of the garment, fabric choice, and timeline. Most custom pieces start from £80. Once we understand your vision, we\'ll provide a quote before you commit to anything.' },
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
          Can't find what you're looking for? Email us at{' '}
          <a href="mailto:hello@bloomingdew.com" style={{ color: '#C9A882', borderBottom: '1px solid #C9A882' }}>
            hello@bloomingdew.com
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
