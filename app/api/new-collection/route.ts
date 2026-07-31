import { NextResponse } from 'next/server';
import { supabaseService } from '../../../lib/admin-server';

// Homepage content: New Collection products plus the marquee text and hero
// image. One endpoint so the homepage makes a single fetch.
export async function GET() {
  const [{ data: titleRow }, { data: idsRow }, { data: marqueeRow }, { data: heroRow }] = await Promise.all([
    supabaseService.from('site_settings').select('value').eq('key', 'new_collection_title').single(),
    supabaseService.from('site_settings').select('value').eq('key', 'new_collection_product_ids').single(),
    supabaseService.from('site_settings').select('value').eq('key', 'marquee_text').single(),
    supabaseService.from('site_settings').select('value').eq('key', 'hero_image_url').single(),
  ]);

  const title: string = titleRow?.value ?? 'New Collection';
  const marqueeText: string | null = marqueeRow?.value ?? null;
  const heroImageUrl: string | null = heroRow?.value ?? null;

  let ids: number[] = [];
  try {
    const parsed = idsRow?.value ? JSON.parse(idsRow.value) : [];
    if (Array.isArray(parsed)) ids = parsed.filter((n): n is number => Number.isInteger(n));
  } catch {
    // Malformed setting — render the section empty rather than 500 the homepage.
  }

  if (ids.length === 0) {
    return NextResponse.json({ title, products: [], marqueeText, heroImageUrl });
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

  return NextResponse.json({ title, products: ordered, marqueeText, heroImageUrl });
}
