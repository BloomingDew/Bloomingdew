import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/admin-server';

// Daily FX refresh (triggered by Vercel Cron — see vercel.json).
// Pulls USD-based rates from a free, no-key source and upserts every row that
// is NOT flagged is_manual. Manual rows (e.g. NGN) are left untouched.
const RATE_SOURCE = 'https://open.er-api.com/v6/latest/USD';

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the env var is set.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const res = await fetch(RATE_SOURCE, { cache: 'no-store' });
    const data = await res.json();
    if (data?.result !== 'success' || !data.rates) {
      return NextResponse.json({ error: 'Rate source unavailable' }, { status: 502 });
    }

    // Which currencies are managed manually — never overwrite these.
    const { data: manualRows } = await supabaseService
      .from('fx_rates')
      .select('currency')
      .eq('is_manual', true);
    const manual = new Set((manualRows || []).map(r => r.currency));

    const now = new Date().toISOString();
    const rows = Object.entries(data.rates as Record<string, number>)
      .filter(([code]) => !manual.has(code))
      .map(([currency, rate_vs_usd]) => ({ currency, rate_vs_usd, is_manual: false, updated_at: now }));

    const { error } = await supabaseService
      .from('fx_rates')
      .upsert(rows, { onConflict: 'currency' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ updated: rows.length, skippedManual: manual.size });
  } catch (err: any) {
    console.error('[cron/refresh-rates] error:', err?.message || err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
