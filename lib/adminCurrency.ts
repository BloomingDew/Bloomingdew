// All product prices are stored in USD. Use this everywhere in admin instead of hardcoded ₦.
export function formatAdminPrice(usd: number | null | undefined): string {
  if (usd == null) return '—';
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
