import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, getAdmin, supabaseService } from '../../../../lib/admin-server';

// Admin CRUD for discount codes. discount_codes has RLS with no client
// policies, so all access goes through the service role behind the admin gate.

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseService
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ discounts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'owner') return NextResponse.json({ error: 'Your admin role cannot manage discounts.' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const code = String(body?.code || '').trim().toUpperCase();
  const type = body?.type;
  const value = Number(body?.value);

  if (!code) return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
  if (type !== 'percent' && type !== 'fixed') {
    return NextResponse.json({ error: 'Type must be percent or fixed.' }, { status: 400 });
  }
  if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) {
    return NextResponse.json({ error: 'Value must be a positive number (1–100 for percent).' }, { status: 400 });
  }

  const minSubtotal = Number(body?.min_subtotal) || 0;
  const maxUses = body?.max_uses != null && body.max_uses !== '' ? Number(body.max_uses) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
    return NextResponse.json({ error: 'Max uses must be a positive whole number.' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('discount_codes')
    .insert({
      code,
      type,
      value,
      min_subtotal: minSubtotal,
      starts_at: body?.starts_at || null,
      expires_at: body?.expires_at || null,
      max_uses: maxUses,
      active: body?.active !== false,
    })
    .select('*')
    .single();

  if (error) {
    const msg = /duplicate|unique/i.test(error.message) ? 'A code with that name already exists.' : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ discount: data });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'owner') return NextResponse.json({ error: 'Your admin role cannot manage discounts.' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { id, ...fields } = body || {};
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const allowed = ['code', 'type', 'value', 'min_subtotal', 'starts_at', 'expires_at', 'max_uses', 'active'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key];
  }
  if (typeof updates.code === 'string') updates.code = updates.code.trim().toUpperCase();
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { data, error } = await supabaseService
    .from('discount_codes')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ discount: data });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (admin.role !== 'owner') return NextResponse.json({ error: 'Your admin role cannot manage discounts.' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const id = body?.id;
  if (!id) return NextResponse.json({ error: 'Missing id.' }, { status: 400 });

  const { error } = await supabaseService.from('discount_codes').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
