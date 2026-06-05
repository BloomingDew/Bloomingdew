import { supabase } from './supabase';
import { getSessionId } from './session';

const RESERVATION_MINUTES = 30;

export async function getAllSizesStock(productId: number, sizes: string[]): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  await Promise.all(sizes.map(async size => {
    const { data } = await supabase.rpc('get_available_stock', { p_product_id: productId, p_size: size });
    results[size] = data ?? 0;
  }));
  return results;
}

export async function getAvailableStock(productId: number, size: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_available_stock', {
    p_product_id: productId,
    p_size: size,
  });
  if (error) return null;
  return data;
}

export async function createReservation(productId: number, size: string, quantity: number): Promise<boolean> {
  const sessionId = getSessionId();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();

  // Check available stock first
  const available = await getAvailableStock(productId, size);
  if (available !== null && available < quantity) return false;

  // Remove any existing reservation for same product/size/session
  await supabase.from('cart_reservations')
    .delete()
    .match({ product_id: productId, size, session_id: sessionId });

  const { error } = await supabase.from('cart_reservations').insert({
    product_id: productId,
    size,
    quantity,
    session_id: sessionId,
    expires_at: expiresAt,
  });

  return !error;
}

export async function removeReservation(productId: number, size: string): Promise<void> {
  const sessionId = getSessionId();
  await supabase.from('cart_reservations')
    .delete()
    .match({ product_id: productId, size, session_id: sessionId });
}

export async function extendReservation(productId: number, size: string): Promise<void> {
  const sessionId = getSessionId();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000).toISOString();
  await supabase.from('cart_reservations')
    .update({ expires_at: expiresAt })
    .match({ product_id: productId, size, session_id: sessionId });
}

export async function getReservationExpiry(productId: number, size: string): Promise<Date | null> {
  const sessionId = getSessionId();
  const { data } = await supabase.from('cart_reservations')
    .select('expires_at')
    .match({ product_id: productId, size, session_id: sessionId })
    .gt('expires_at', new Date().toISOString())
    .single();
  return data ? new Date(data.expires_at) : null;
}

export async function clearAllReservations(): Promise<void> {
  const sessionId = getSessionId();
  await supabase.from('cart_reservations').delete().eq('session_id', sessionId);
}
