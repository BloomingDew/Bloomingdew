// Server-only. Recomputes order pricing from authoritative DB prices so the
// client can never dictate what it pays.
import { supabaseService } from './admin-server';

export type IncomingItem = { id: number; size: string; quantity: number };

export type PricedLine = {
  id: number;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;   // sale price per unit, in NGN
  priceLabel: string;  // formatted, e.g. "₦12,000"
};

export type OrderPricing = {
  lines: PricedLine[];
  subtotal: number;     // NGN
  amountMinor: number;  // kobo, what Stripe should charge
};

const isPositiveInt = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n > 0;

// Validates the incoming cart and prices it from the products table.
// Throws on malformed input or unknown/unavailable products.
export async function priceOrder(items: unknown): Promise<OrderPricing> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty.');
  }

  const normalized: IncomingItem[] = items.map((raw) => {
    const id = Number((raw as any)?.id);
    const size = String((raw as any)?.size ?? '').trim();
    const quantity = Number((raw as any)?.quantity);
    if (!isPositiveInt(id) || !size || !isPositiveInt(quantity) || quantity > 50) {
      throw new Error('Invalid cart item.');
    }
    return { id, size, quantity };
  });

  const ids = [...new Set(normalized.map(i => i.id))];
  const { data, error } = await supabaseService
    .from('products')
    .select('id, name, price, discount, available')
    .in('id', ids);

  if (error) throw new Error('Could not price the order.');

  const byId = new Map((data || []).map(p => [p.id, p]));

  const lines: PricedLine[] = normalized.map((item) => {
    const product = byId.get(item.id);
    if (!product || product.available === false) {
      throw new Error('One or more items are no longer available.');
    }
    const rawPrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const unitPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;
    return {
      id: item.id,
      name: product.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice,
      priceLabel: `₦${unitPrice.toLocaleString()}`,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  // Shipping is TBD (finalized with DHL) and not charged at checkout yet.
  const amountMinor = Math.round(subtotal * 100);

  return { lines, subtotal, amountMinor };
}
