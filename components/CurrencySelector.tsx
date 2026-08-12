'use client';

import { useCurrency } from '../context/CurrencyContext';
import { CURRENCY_META } from '../lib/currency';

// Inline navbar currency picker. Currency is resolved silently from geo (see
// CurrencyContext) — no blocking prompt on arrival.
export default function CurrencySelector() {
  const { currency, setCurrency, selectable } = useCurrency();

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

    </>
  );
}
