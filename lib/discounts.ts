// Server-only. Discount code validation and usage tracking. Uses the service
// role because discount_codes has RLS enabled with no client policies.
import { supabaseService } from './admin-server';

export type DiscountCodeRow = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  active: boolean;
  created_at: string;
};

export type DiscountValidation =
  | { valid: true; discountUsd: number; codeRow: DiscountCodeRow }
  | { valid: false; reason: string };

// Validates a code against the current subtotal (USD). Returns the discount in
// USD, capped at the subtotal so a total can never go negative.
export async function validateDiscountCode(code: string, subtotal: number): Promise<DiscountValidation> {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { valid: false, reason: 'Please enter a discount code.' };

  const { data, error } = await supabaseService
    .from('discount_codes')
    .select('*')
    .eq('code', normalized)
    .maybeSingle();

  if (error) return { valid: false, reason: 'Could not check that code. Please try again.' };
  if (!data) return { valid: false, reason: 'That code isn’t valid.' };

  const row = data as DiscountCodeRow;
  const now = Date.now();

  if (!row.active) return { valid: false, reason: 'That code isn’t valid.' };
  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    return { valid: false, reason: 'This code isn’t active yet.' };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < now) {
    return { valid: false, reason: 'This code has expired.' };
  }
  if (row.max_uses !== null && row.use_count >= row.max_uses) {
    return { valid: false, reason: 'This code has reached its usage limit.' };
  }
  const minSubtotal = Number(row.min_subtotal) || 0;
  if (subtotal < minSubtotal) {
    return { valid: false, reason: `This code requires a minimum order of $${minSubtotal.toFixed(2)}.` };
  }

  const value = Number(row.value) || 0;
  const discountUsd = row.type === 'percent'
    ? Math.min(subtotal * value / 100, subtotal)
    : Math.min(value, subtotal);

  return { valid: true, discountUsd: Math.round(discountUsd * 100) / 100, codeRow: row };
}

// Best-effort usage increment after a successful payment.
export async function incrementUse(code: string): Promise<void> {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return;
  const { data } = await supabaseService
    .from('discount_codes')
    .select('id, use_count')
    .eq('code', normalized)
    .maybeSingle();
  if (!data) return;
  const { error } = await supabaseService
    .from('discount_codes')
    .update({ use_count: (Number(data.use_count) || 0) + 1 })
    .eq('id', data.id);
  if (error) console.error('[discounts] incrementUse failed:', error.message);
}
