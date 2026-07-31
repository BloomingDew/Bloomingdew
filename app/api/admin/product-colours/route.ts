import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Admin product_colours writes via the service role.

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const storagePathFromUrl = (url: string): string | null => {
  const marker = '/product-image/';
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
};

// POST — add a colour, returns the created row.
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const { productId, name, hexCode, displayOrder } = await req.json();
  if (!productId || !name) {
    return NextResponse.json({ error: 'productId and name are required.' }, { status: 400 });
  }

  const { data, error } = await supabaseService.from('product_colours').insert({
    product_id: Number(productId), name, hex_code: hexCode || '#000000',
    display_order: displayOrder ?? 0, is_available: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ colour: data });
}

// DELETE — { id }. Deletes the colour, its image rows, and their storage files.
export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const { data: imageRows } = await supabaseService
    .from('product_images').select('url').eq('colour_id', id);

  const { error: imgError } = await supabaseService.from('product_images').delete().eq('colour_id', id);
  if (imgError) return NextResponse.json({ error: imgError.message }, { status: 500 });

  const { error } = await supabaseService.from('product_colours').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = (imageRows || [])
    .map(r => storagePathFromUrl(r.url))
    .filter((p): p is string => p !== null);
  if (paths.length > 0) {
    await supabaseService.storage.from('product-image').remove(paths);
  }

  return NextResponse.json({ success: true });
}
