import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Admin orders access. RLS gives orders no client write policy and gates
// selects on the customer's own rows, so the admin list and status updates
// must run here under the service role.

const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// GET — full orders list, newest first.
export async function GET() {
  if (!(await getAdminUser())) return unauthorized();

  const { data, error } = await supabaseService
    .from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data ?? [] });
}

// PATCH — { id, status? | notes? | tracking_number? | tracking_url? }
export async function PATCH(req: NextRequest) {
  if (!(await getAdminUser())) return unauthorized();

  const { id, ...rest } = await req.json();
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
