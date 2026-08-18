import { supabaseService } from './admin-server';
import { isMadeToOrderSize } from './sizes';

// Made-to-order surcharge.
//
// Sizes outside the stocked range are cut individually, so they carry an
// uplift over the shelf price. The published range is 20-25%; the charged
// figure lives in site_settings so it can move without a deploy.
//
// Crucially the *server* decides whether a line is made-to-order, from the
// size alone — the browser never gets to say "this one is full price".

const DEFAULT_SURCHARGE_PCT = 20;
const MAX_SURCHARGE_PCT = 100;

export async function getMadeToOrderSurchargePct(): Promise<number> {
  const { data } = await supabaseService
    .from('site_settings')
    .select('value')
    .eq('key', 'made_to_order_surcharge_pct')
    .maybeSingle();

  const n = Number(data?.value);
  // A missing, malformed or absurd value falls back rather than mispricing.
  if (!Number.isFinite(n) || n < 0 || n > MAX_SURCHARGE_PCT) return DEFAULT_SURCHARGE_PCT;
  return n;
}

/** Apply the uplift to a stocked-price line, rounded to cents. */
export function applySurcharge(unitPrice: number, surchargePct: number): number {
  return Math.round(unitPrice * (1 + surchargePct / 100) * 100) / 100;
}

export { isMadeToOrderSize };
