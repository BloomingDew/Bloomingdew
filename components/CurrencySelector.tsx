'use client';

import { useCurrency } from '../context/CurrencyContext';
import { CURRENCY_META } from '../lib/currency';

// Inline navbar picker + a forced-choice prompt shown when geo detection failed.
export default function CurrencySelector() {
  const { currency, setCurrency, selectable, needsSelection } = useCurrency();

  const label = (code: string) => {
    const sym = CURRENCY_META[code]?.symbol;
    return sym ? `${code} ${sym}` : code;
  };

  return (
    <>
      <select
        aria-label="Currency"
        value={selectable.includes(currency) ? currency : ''}
        onChange={(e) => setCurrency(e.target.value)}
        style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.08em',
          color: '#2C2C2C', backgroundColor: 'transparent', border: '1px solid #E8DDD3',
          padding: '0.3rem 1.3rem 0.3rem 0.5rem', cursor: 'pointer', outline: 'none', appearance: 'none',
          // Own chevron — an inline background would otherwise beat the shared rule.
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' fill='none' stroke='%232C2C2C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.4rem center',
        }}
      >
        {!selectable.includes(currency) && <option value="" disabled>Currency</option>}
        {selectable.map((code) => (
          <option key={code} value={code}>{label(code)}</option>
        ))}
      </select>

      {needsSelection && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 400,
          backgroundColor: 'rgba(44,44,44,0.45)', backdropFilter: 'blur(2px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
        }}>
          <div style={{
            width: '100%', maxWidth: '420px', backgroundColor: '#FAF7F4',
            border: '1px solid #E8DDD3', padding: '2.5rem 2rem', textAlign: 'center',
          }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.6rem' }}>
              Choose your currency
            </h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87', marginBottom: '1.8rem' }}>
              We couldn&apos;t detect your location. Pick a currency to see prices in — you can change it any time.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {selectable.map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  style={{
                    fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', letterSpacing: '0.08em',
                    color: '#2C2C2C', backgroundColor: 'transparent', border: '1px solid #E8DDD3',
                    padding: '0.85rem', cursor: 'pointer',
                  }}
                >
                  {label(code)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
