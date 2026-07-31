import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Admin orders access. RLS gives orders no client write policy and gates
// selects on the customer's own rows, so the admin list and status updates
// must run here under the service role.

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

const PER_PAGE = 25;

// GET — paginated list with search + status filter.
//   ?page=1&q=jane&status=paid          (all optional)
//   ?id=<uuid>                          (single order, for the packing slip)
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const params = req.nextUrl.searchParams;

  const id = params.get('id');
  if (id) {
    const { data, error } = await supabaseService.from('orders').select('*').eq('id', id).single();
    if (error || !data) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    return NextResponse.json({ order: data });
  }

  const page = Math.max(1, Number(params.get('page')) || 1);
  const q = (params.get('q') || '').trim();
  const status = params.get('status') || '';
  const offset = (page - 1) * PER_PAGE;

  let query = supabaseService
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  if (q) {
    // Looks like an order reference (the admin shows the first 8 uuid chars)?
    // uuid columns don't support ilike, so prefix-match ids in the route.
    const looksLikeRef = /^[0-9a-fA-F-]{4,}$/.test(q) && !q.includes('@');
    if (looksLikeRef) {
      const { data: idRows } = await supabaseService
        .from('orders').select('id').order('created_at', { ascending: false }).limit(2000);
      const matching = (idRows || [])
        .map(r => r.id as string)
        .filter(oid => oid.toLowerCase().startsWith(q.toLowerCase()));
      if (matching.length > 0) {
        query = query.in('id', matching.slice(0, 100));
      } else {
        query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);
      }
    } else {
      query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);
    }
  }

  const { data, count, error } = await query.range(offset, offset + PER_PAGE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    orders: data ?? [],
    total: count ?? 0,
    page,
    perPage: PER_PAGE,
  });
}

// PATCH — single: { id, status?|notes?|tracking_number?|tracking_url? }
//         bulk:   { ids: string[], status }
export async function PATCH(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const body = await req.json();

  if (Array.isArray(body.ids)) {
    if (typeof body.status !== 'string' || !body.status) {
      return NextResponse.json({ error: 'status is required for bulk updates.' }, { status: 400 });
    }
    const { error } = await supabaseService
      .from('orders').update({ status: body.status }).in('id', body.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

  const allowed = ['status', 'notes', 'tracking_number', 'tracking_url'] as const;
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (rest[key] !== undefined) updates[key] = rest[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { error } = await supabaseService.from('orders').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
