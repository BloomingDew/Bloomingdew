import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '../../../../lib/admin-server';

// Daily FX refresh (triggered by Vercel Cron — see vercel.json).
// Pulls USD-based rates from a free, no-key source and upserts every row that
// is NOT flagged is_manual. Manual rows are left untouched.
//
// Margins: the source tracks OFFICIAL rates, which for some currencies sit well
// below the rate a business actually transacts at. Rather than pinning those
// currencies (which then silently go stale), a per-currency multiplier in
// site_settings.fx_margins scales the source rate — so the price still follows
// the market daily, at the level we actually sell at.
//   {"NGN": 1.177645}  ->  official 1358.64 becomes 1600.00
const RATE_SOURCE = 'https://open.er-api.com/v6/latest/USD';

// A stored rate moving more than this in one refresh is surprising enough to
// log. Applied anyway — currencies really do move — but it leaves a trail if
// the source ever returns something wrong and prices shift underneath us.
const NOTABLE_MOVE = 0.1;

async function loadMargins(): Promise<Record<string, number>> {
  const { data } = await supabaseService
    .from('site_settings')
    .select('value')
    .eq('key', 'fx_margins')
    .maybeSingle();
  if (!data?.value) return {};
  try {
    const parsed = JSON.parse(data.value);
    const out: Record<string, number> = {};
    for (const [code, mult] of Object.entries(parsed)) {
      const n = Number(mult);
      // A zero/negative/garbage multiplier would zero out prices.
      if (Number.isFinite(n) && n > 0) out[code] = n;
    }
    return out;
  } catch {
    console.error('[cron/refresh-rates] fx_margins is not valid JSON — ignoring');
    return {};
  }
}

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

    // Existing rows: which are manual (never overwrite), and what we currently
    // store (so a large move can be reported).
    const { data: existingRows } = await supabaseService
      .from('fx_rates')
      .select('currency, rate_vs_usd, is_manual');
    const manual = new Set((existingRows || []).filter(r => r.is_manual).map(r => r.currency));
    const previous = new Map((existingRows || []).map(r => [r.currency, Number(r.rate_vs_usd)]));

    const margins = await loadMargins();
    const now = new Date().toISOString();
    const moved: string[] = [];

    const rows = Object.entries(data.rates as Record<string, number>)
      .filter(([code]) => !manual.has(code))
      .map(([currency, sourceRate]) => {
        const rate = Number(sourceRate) * (margins[currency] ?? 1);
        const before = previous.get(currency);
        if (before && before > 0 && Math.abs(rate - before) / before > NOTABLE_MOVE) {
          moved.push(`${currency} ${before.toFixed(2)}->${rate.toFixed(2)}`);
        }
        return { currency, rate_vs_usd: rate, is_manual: false, updated_at: now };
      })
      // A non-finite or non-positive rate would make everything free.
      .filter(r => Number.isFinite(r.rate_vs_usd) && r.rate_vs_usd > 0);

    const { error } = await supabaseService
      .from('fx_rates')
      .upsert(rows, { onConflict: 'currency' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (moved.length) {
      console.warn('[cron/refresh-rates] notable moves:', moved.join(', '));
    }

    return NextResponse.json({
      updated: rows.length,
      skippedManual: manual.size,
      marginsApplied: Object.keys(margins),
      notableMoves: moved,
    });
  } catch (err: any) {
    console.error('[cron/refresh-rates] error:', err?.message || err);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
