import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getAdmin, supabaseService } from '../../../../lib/admin-server';

// Collections / drops. Tables are service-role-only (RLS, no client policies).

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

export async function GET() {
  if (!(await getAdminUser())) return unauthorized();

  const [{ data: collections, error }, { data: links }] = await Promise.all([
    supabaseService.from('collections').select('*').order('created_at', { ascending: false }),
    supabaseService.from('collection_products').select('collection_id, product_id, position').order('position'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byCollection = new Map<string, number[]>();
  for (const link of links || []) {
    const list = byCollection.get(link.collection_id) || [];
    list.push(link.product_id);
    byCollection.set(link.collection_id, list);
  }

  return NextResponse.json({
    collections: (collections || []).map(c => ({ ...c, productIds: byCollection.get(c.id) || [] })),
  });
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return NextResponse.json({ error: 'Your admin role cannot manage collections.' }, { status: 403 });

  const { title, launch_at } = await req.json();
  if (typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('collections')
    .insert({ title: title.trim(), launch_at: launch_at || null })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ collection: { ...data, productIds: [] } });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return NextResponse.json({ error: 'Your admin role cannot manage collections.' }, { status: 403 });

  const { id, productIds, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof fields.title === 'string' && fields.title.trim()) updates.title = fields.title.trim();
  if (fields.launch_at !== undefined) updates.launch_at = fields.launch_at || null;
  if (typeof fields.active === 'boolean') updates.active = fields.active;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabaseService.from('collections').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(productIds)) {
    const clean = productIds.filter((n): n is number => Number.isInteger(n));
    const { error: delError } = await supabaseService
      .from('collection_products').delete().eq('collection_id', id);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
    if (clean.length > 0) {
      const { error: insError } = await supabaseService.from('collection_products').insert(
        clean.map((pid, i) => ({ collection_id: id, product_id: pid, position: i })),
      );
      if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return unauthorized();
  if (admin.role !== 'owner') return NextResponse.json({ error: 'Your admin role cannot manage collections.' }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const { error } = await supabaseService.from('collections').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
