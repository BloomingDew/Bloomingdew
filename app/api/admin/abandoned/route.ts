import { NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Admin-only listing of abandoned checkouts from the last 30 days.

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: rows, error }, { count: recoveredCount }] = await Promise.all([
    supabaseService
      .from('abandoned_checkouts')
      .select('id, email, first_name, items, subtotal, created_at, updated_at')
      .eq('status', 'started')
      .gte('created_at', since)
      .order('created_at', { ascending: false }),
    supabaseService
      .from('abandoned_checkouts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'recovered')
      .gte('updated_at', since),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    abandoned: rows || [],
    counts: { started: (rows || []).length, recoveredLast30d: recoveredCount ?? 0 },
  });
}
