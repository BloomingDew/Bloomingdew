import { supabase } from './supabase';
import { getSessionId } from './session';

const RESERVATION_MINUTES = 30;

// Stock is tracked per (product, colour, size). colourId is null for products
// without colourways, which is how every pre-colour product behaves.

export async function getAllSizesStock(
  productId: number,
  sizes: string[],
  colourId: string | null = null,
): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  await Promise.all(sizes.map(async size => {
    const { data, error } = await supabase.rpc('get_available_stock_v2', {
      p_product_id: productId,
      p_size: size,
      p_colour_id: colourId,
    });
    // On a failed lookup, leave the size unknown rather than marking it sold
    // out — createReservation re-checks real stock when the item is added.
    if (!error && data !== null) results[size] = data;
  }));
  return results;
}

export async function getAvailableStock(
  productId: number,
  size: string,
  colourId: string | null = null,
): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_available_stock_v2', {
    p_product_id: productId,
    p_size: size,
    p_colour_id: colourId,
  });
  if (error) return null;
  return data;
}

export async function createReservation(
  productId: number,
  size: string,
  quantity: number,
  colourId: string | null = null,
): Promise<boolean> {
  const sessionId = getSessionId();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();

  // Check available stock first
  const available = await getAvailableStock(productId, size, colourId);
  if (available !== null && available < quantity) return false;

  // Remove any existing reservation for same product/colour/size/session
  await removeReservation(productId, size, colourId);

  const { error } = await supabase.from('cart_reservations').insert({
    product_id: productId,
    size,
    colour_id: colourId,
    quantity,
    session_id: sessionId,
    expires_at: expiresAt,
  });

  return !error;
}

export async function removeReservation(
  productId: number,
  size: string,
  colourId: string | null = null,
): Promise<void> {
  const sessionId = getSessionId();
  let query = supabase.from('cart_reservations')
    .delete()
    .match({ product_id: productId, size, session_id: sessionId });
  // .match can't express "is null", so branch on it.
  query = colourId === null ? query.is('colour_id', null) : query.eq('colour_id', colourId);
  await query;
}

export async function extendReservation(
  productId: number,
  size: string,
  colourId: string | null = null,
): Promise<void> {
  const sessionId = getSessionId();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
  let query = supabase.from('cart_reservations')
    .update({ expires_at: expiresAt })
    .match({ product_id: productId, size, session_id: sessionId });
  query = colourId === null ? query.is('colour_id', null) : query.eq('colour_id', colourId);
  await query;
}

export async function getReservationExpiry(
  productId: number,
  size: string,
  colourId: string | null = null,
): Promise<Date | null> {
  const sessionId = getSessionId();
  let query = supabase.from('cart_reservations')
    .select('expires_at')
    .match({ product_id: productId, size, session_id: sessionId })
    .gt('expires_at', new Date().toISOString());
  query = colourId === null ? query.is('colour_id', null) : query.eq('colour_id', colourId);
  const { data } = await query.single();
  return data ? new Date(data.expires_at) : null;
}

export async function clearAllReservations(): Promise<void> {
  const sessionId = getSessionId();
  await supabase.from('cart_reservations').delete().eq('session_id', sessionId);
}
