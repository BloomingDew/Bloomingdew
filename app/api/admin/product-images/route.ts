import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Admin product_images writes (RLS select-only for browser clients).

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const storagePathFromUrl = (url: string): string | null => {
  const marker = '/product-image/';
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
};

// POST — insert one image row, returns the created row.
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const { productId, url, altText, position, colourId } = await req.json();
  if (!productId || !url) {
    return NextResponse.json({ error: 'productId and url are required.' }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    product_id: Number(productId), url, alt_text: altText || '', position: position ?? 0,
  };
  if (colourId) row.colour_id = colourId;

  const { data, error } = await supabaseService.from('product_images').insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ image: data });
}

// PATCH — { positions: [{ id, position }] } reorder,
//       or { id, colourId } to tag a photo with a colourway (null = shown for
//       every colour / used as the fallback).
export async function PATCH(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const body = await req.json();

  if (body.id !== undefined && 'colourId' in body) {
    const colourId = body.colourId ?? null;
    const { error } = await supabaseService
      .from('product_images')
      .update({ colour_id: colourId })
      .eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { positions } = body;
  if (!Array.isArray(positions)) {
    return NextResponse.json({ error: 'positions array is required.' }, { status: 400 });
  }

  const results = await Promise.all(
    positions.map((p: { id: number; position: number }) =>
      supabaseService.from('product_images').update({ position: p.position }).eq('id', p.id),
    ),
  );
  const failed = results.find(r => r.error)?.error;
  if (failed) return NextResponse.json({ error: failed.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — { id, url? }. Deletes the row and (if url given) the storage file.
export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const { id, url } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const { error } = await supabaseService.from('product_images').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (url) {
    const path = storagePathFromUrl(url);
    if (path) await supabaseService.storage.from('product-image').remove([path]);
  }

  return NextResponse.json({ success: true });
}
