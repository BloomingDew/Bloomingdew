import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, supabaseService } from '../../../../lib/admin-server';
import { logActivity } from '../../../../lib/activity';

// Admin product writes. products/product_images/product_size_inventory are
// RLS select-only for browser clients, so every write must run here under the
// service role. Product writes are owner-only; staff admins are read-only here.

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const forbidden = () => NextResponse.json({ error: 'Your admin role cannot modify products.' }, { status: 403 });

// Record stock deltas so "why does this say 0?" is answerable.
async function recordInventoryMovements(
  productId: number,
  next: { size: string; quantity: number }[],
  adminEmail: string | null | undefined,
) {
  try {
    const { data: existing } = await supabaseService
      .from('product_size_inventory').select('size, quantity').eq('product_id', productId);
    const before = new Map((existing || []).map(r => [r.size, Number(r.quantity) || 0]));
    const movements = next
      .map(s => ({ size: s.size, delta: (Number(s.quantity) || 0) - (before.get(s.size) ?? 0) }))
      .filter(m => m.delta !== 0)
      .map(m => ({
        product_id: productId, size: m.size, delta: m.delta,
        reason: 'manual-adjust', admin_email: adminEmail ?? null,
      }));
    if (movements.length > 0) {
      await supabaseService.from('inventory_movements').insert(movements);
    }
  } catch {
    // Auxiliary — never block the save.
  }
}

const storagePathFromUrl = (url: string): string | null => {
  const marker = '/product-image/';
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
};

// POST — create a product with its images, size inventory, and colours.
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return forbidden();

  const { product, images = [], sizeInventory = [], colours = [] } = await req.json();
  if (!product?.name || typeof product.price !== 'number') {
    return NextResponse.json({ error: 'Product name and price are required.' }, { status: 400 });
  }

  const { data: created, error } = await supabaseService
    .from('products').insert(product).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (images.length > 0) {
    const { error: imgError } = await supabaseService.from('product_images').insert(
      images.map((img: { url: string; alt_text: string }, i: number) => ({
        product_id: created.id, url: img.url, alt_text: img.alt_text, position: i,
      })),
    );
    if (imgError) {
      return NextResponse.json(
        { error: `Product saved but images failed: ${imgError.message}`, id: created.id },
        { status: 500 },
      );
    }
  }

  if (sizeInventory.length > 0) {
    const { error: invError } = await supabaseService.from('product_size_inventory').insert(
      sizeInventory.map((s: { size: string; quantity: number }) => ({
        product_id: created.id, size: s.size, quantity: s.quantity,
      })),
    );
    if (invError) {
      return NextResponse.json(
        { error: `Product saved but size inventory failed: ${invError.message}`, id: created.id },
        { status: 500 },
      );
    }
  }

  if (colours.length > 0) {
    const { error: colError } = await supabaseService.from('product_colours').insert(
      colours.map((c: { name: string; hex_code: string }, i: number) => ({
        product_id: created.id, name: c.name, hex_code: c.hex_code, display_order: i, is_available: true,
      })),
    );
    if (colError) {
      return NextResponse.json(
        { error: `Product saved but colours failed: ${colError.message}`, id: created.id },
        { status: 500 },
      );
    }
  }

  logActivity({ adminEmail: admin.user.email, action: 'create', entity: 'product', entityId: created.id, details: { name: product.name } });
  return NextResponse.json({ id: created.id });
}

// PATCH — either a bulk flag update ({ ids, available?/featured? }) or a full
// single-product update ({ id, fields, sizeInventory? }).
export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return forbidden();
  const adminEmail = admin.user.email;

  const body = await req.json();

  // Persist homepage Best Sellers ordering: [{ id, position }]
  if (Array.isArray(body.featuredPositions)) {
    const results = await Promise.all(
      body.featuredPositions.map((p: { id: number; position: number }) =>
        supabaseService.from('products').update({ featured_position: p.position }).eq('id', p.id),
      ),
    );
    const failed = results.find(r => r.error)?.error;
    if (failed) return NextResponse.json({ error: failed.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (Array.isArray(body.ids)) {
    const updates: Record<string, boolean> = {};
    if (typeof body.available === 'boolean') updates.available = body.available;
    if (typeof body.featured === 'boolean') updates.featured = body.featured;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }
    const { error } = await supabaseService.from('products').update(updates).in('id', body.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    logActivity({ adminEmail, action: 'update', entity: 'product', entityId: body.ids.join(','), details: updates });
    return NextResponse.json({ success: true });
  }

  const { id, fields, sizeInventory } = body;
  if (!id || !fields) {
    return NextResponse.json({ error: 'id and fields are required.' }, { status: 400 });
  }

  const { error } = await supabaseService.from('products').update(fields).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(sizeInventory)) {
    // Record deltas before the upsert overwrites the previous quantities.
    await recordInventoryMovements(Number(id), sizeInventory, adminEmail);
    const { error: invError } = await supabaseService.from('product_size_inventory').upsert(
      sizeInventory.map((s: { size: string; quantity: number }) => ({
        product_id: Number(id), size: s.size, quantity: s.quantity,
      })),
      { onConflict: 'product_id,size' },
    );
    if (invError) {
      return NextResponse.json({ error: `Product saved but stock failed: ${invError.message}` }, { status: 500 });
    }
  }

  logActivity({ adminEmail, action: 'update', entity: 'product', entityId: id, details: { name: fields.name } });
  return NextResponse.json({ success: true });
}

// DELETE — { ids: number[] }. Removes related rows and the storage files.
export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return forbidden();

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids array is required.' }, { status: 400 });
  }

  // Collect storage paths before the rows disappear.
  const { data: imageRows } = await supabaseService
    .from('product_images').select('url').in('product_id', ids);

  const results = await Promise.all([
    supabaseService.from('product_images').delete().in('product_id', ids),
    supabaseService.from('product_size_inventory').delete().in('product_id', ids),
    supabaseService.from('product_colours').delete().in('product_id', ids),
  ]);
  const relatedError = results.find(r => r.error)?.error;
  if (relatedError) return NextResponse.json({ error: relatedError.message }, { status: 500 });

  const { error } = await supabaseService.from('products').delete().in('id', ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort storage cleanup — the DB rows are already gone.
  const paths = (imageRows || [])
    .map(r => storagePathFromUrl(r.url))
    .filter((p): p is string => p !== null);
  if (paths.length > 0) {
    await supabaseService.storage.from('product-image').remove(paths);
  }

  logActivity({ adminEmail: admin.user.email, action: 'delete', entity: 'product', entityId: ids.join(',') });
  return NextResponse.json({ success: true });
}
