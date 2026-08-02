import { NextRequest, NextResponse } from 'next/server';
import { getTaxRate } from '../../../lib/tax';

// Public: the tax rate for a shipping country, so checkout can display the
// tax line. The payment routes recompute this server-side regardless.
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || '';
  const rate = await getTaxRate(country);
  return NextResponse.json({ country, rate });
}
