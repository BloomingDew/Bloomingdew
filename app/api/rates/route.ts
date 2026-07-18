import { NextResponse } from 'next/server';
import { supabaseService } from '../../../lib/admin-server';
import { BASE_CURRENCY } from '../../../lib/currency';

// Public: current FX rates (units of <currency> per 1 USD) for the storefront.
// Cached briefly at the edge; rates only change once a day via the refresh cron.
export async function GET() {
  const { data, error } = await supabaseService
    .from('fx_rates')
    .select('currency, rate_vs_usd');

  if (error) {
    // Fail soft: USD-only so the store still renders (in USD) if rates are down.
    return NextResponse.json(
      { base: BASE_CURRENCY, rates: { [BASE_CURRENCY]: 1 } },
      { status: 200 },
    );
  }

  const rates: Record<string, number> = { [BASE_CURRENCY]: 1 };
  for (const row of data || []) rates[row.currency] = Number(row.rate_vs_usd);

  return NextResponse.json(
    { base: BASE_CURRENCY, rates },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
  );
}
