import { supabaseService } from './admin-server';

// Destination-based tax. Rates are admin-configured per shipping country
// (site_settings key 'tax_rates', JSON like {"Nigeria": 7.5}) and default to
// 0% anywhere unset. Applied to the discounted subtotal.

// Must match the checkout's country dropdown options.
export const TAX_COUNTRIES = [
  'Nigeria', 'United Kingdom', 'United States', 'Canada',
  'Australia', 'France', 'Germany', 'Ghana', 'Other',
] as const;

export async function getTaxRates(): Promise<Record<string, number>> {
  const { data } = await supabaseService
    .from('site_settings').select('value').eq('key', 'tax_rates').maybeSingle();
  if (!data?.value) return {};
  try {
    const parsed = JSON.parse(data.value);
    if (parsed && typeof parsed === 'object') {
      const clean: Record<string, number> = {};
      for (const [country, rate] of Object.entries(parsed)) {
        const n = Number(rate);
        if (Number.isFinite(n) && n >= 0 && n <= 50) clean[country] = n;
      }
      return clean;
    }
  } catch {
    // Malformed setting -> no tax rather than a broken checkout.
  }
  return {};
}

export async function getTaxRate(country: string | null | undefined): Promise<number> {
  if (!country) return 0;
  const rates = await getTaxRates();
  return rates[country] ?? 0;
}

// Tax on the discounted subtotal, rounded to cents.
export function taxAmountUsd(taxableUsd: number, ratePercent: number): number {
  if (ratePercent <= 0 || taxableUsd <= 0) return 0;
  return Math.round(taxableUsd * ratePercent) / 100;
}
