// Shared, dependency-free currency helpers used by BOTH client and server so
// that what the customer sees is exactly what gets charged.
//
// Model: every product price is stored in USD (the base). We convert to the
// visitor's local currency for display using a daily FX rate, round it to a
// clean number, and format it. The same round + convert runs server-side when
// pricing an order, so display === charge.

export const BASE_CURRENCY = 'USD';

// Currencies offered in the picker. Display can still resolve any currency a
// cookie/geo sets, but these are the curated, guaranteed-seeded options.
export const SELECTABLE_CURRENCIES = [
  'USD', 'GBP', 'EUR', 'NGN', 'GHS', 'KES', 'ZAR', 'CAD', 'AUD',
];

// Currencies charged without a ×100 minor unit (Stripe "zero-decimal").
const ZERO_DECIMAL = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG',
  'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

// Currency → display metadata. Anything not listed still works (we fall back to
// Intl defaults); this table just tightens the symbol/locale for common ones.
export const CURRENCY_META: Record<string, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  GBP: { symbol: '£', locale: 'en-GB' },
  EUR: { symbol: '€', locale: 'en-IE' },
  NGN: { symbol: '₦', locale: 'en-NG' },
  GHS: { symbol: '₵', locale: 'en-GH' },
  CAD: { symbol: 'CA$', locale: 'en-CA' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  KES: { symbol: 'KSh', locale: 'en-KE' },
  ZAR: { symbol: 'R', locale: 'en-ZA' },
};

// Vercel geo (ISO-3166 country) → currency. Broad coverage of common markets;
// anything unmapped falls back to the currency selector (the agreed behaviour).
export const COUNTRY_CURRENCY: Record<string, string> = {
  US: 'USD', GB: 'GBP', NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR',
  CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', IN: 'INR',
  BR: 'BRL', MX: 'MXN', AE: 'AED', SA: 'SAR', CH: 'CHF', SE: 'SEK',
  NO: 'NOK', DK: 'DKK', PL: 'PLN', RU: 'RUB', TR: 'TRY', EG: 'EGP',
  // Eurozone
  IE: 'EUR', FR: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
};

export function isZeroDecimal(currency: string): boolean {
  return ZERO_DECIMAL.has(currency.toUpperCase());
}

export function currencyDecimals(currency: string): number {
  return isZeroDecimal(currency) ? 0 : 2;
}

// Round a converted amount to a clean, premium-looking number. Deterministic so
// client display and server charge agree exactly.
export function roundLocal(amount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (code === BASE_CURRENCY) return Math.round(amount * 100) / 100; // USD: exact cents

  // Non-USD: round to a "nice" step scaled to the magnitude so we never show
  // ₦69,021.63 — we show ₦69,000.
  const abs = Math.abs(amount);
  let step: number;
  if (abs >= 100_000) step = 1000;
  else if (abs >= 10_000) step = 500;
  else if (abs >= 1_000) step = 100;
  else if (abs >= 100) step = 10;
  else step = 1;

  const rounded = Math.round(amount / step) * step;
  return isZeroDecimal(code) ? Math.round(rounded) : rounded;
}

// USD base amount → local amount (converted + rounded).
export function convertFromUsd(usd: number, rate: number, currency: string): number {
  return roundLocal(usd * rate, currency);
}

// Format an already-converted local amount for display.
export function formatMoney(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const meta = CURRENCY_META[code];
  const decimals = currencyDecimals(code);
  try {
    return new Intl.NumberFormat(meta?.locale || 'en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Unknown ISO code — fall back to symbol + grouped number.
    const symbol = meta?.symbol || `${code} `;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
}

// Convenience: USD base → formatted local string in one call.
export function formatFromUsd(usd: number, rate: number, currency: string): string {
  return formatMoney(convertFromUsd(usd, rate, currency), currency);
}

// Convert a local amount to Stripe/Paystack minor units (kobo, cents, …).
export function toMinorUnits(amount: number, currency: string): number {
  return isZeroDecimal(currency) ? Math.round(amount) : Math.round(amount * 100);
}
