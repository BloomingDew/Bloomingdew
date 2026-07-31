import { NextRequest, NextResponse } from 'next/server';
import { COUNTRY_CURRENCY } from '../../../lib/currency';

// Debug/verification endpoint: what does geo detection see for this request?
// Visit /api/geo from any device to check country detection and the currency
// it maps to, plus what the visitor's cookie currently says.
export async function GET(req: NextRequest) {
  const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase() || null;
  return NextResponse.json({
    detectedCountry: country,
    mappedCurrency: country ? COUNTRY_CURRENCY[country] ?? null : null,
    cookieCurrency: req.cookies.get('bd_currency')?.value ?? null,
    cookieSource: req.cookies.get('bd_currency_src')?.value ?? 'geo (or unset)',
  });
}
