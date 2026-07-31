import { NextResponse } from 'next/server';
import { supabaseService } from '../../../lib/admin-server';

export async function GET() {
  const [{ data: titleRow }, { data: idsRow }] = await Promise.all([
    supabaseService.from('site_settings').select('value').eq('key', 'new_collection_title').single(),
    supabaseService.from('site_settings').select('value').eq('key', 'new_collection_product_ids').single(),
  ]);

  const title: string = titleRow?.value ?? 'New Collection';
  let ids: number[] = [];
  try {
    const parsed = idsRow?.value ? JSON.parse(idsRow.value) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((n): n is number => Number.isInteger(n));
  } catch {
    // Malformed setting — render the section empty rather than 500 the homepage.
  }

  if (ids.length === 0) {
    return NextResponse.json({ title, products: [] });
  }

  const { data: products } = await supabaseService
    .from('products')
    .select('id, name, price, discount, product_images(url)')
    .in('id', ids)
    .eq('available', true);

  // Preserve admin-defined order
  const ordered = ids
    .map(id => (products || []).find((p: { id: number }) => p.id === id))
    .filter(Boolean);

  return NextResponse.json({ title, products: ordered });
}
