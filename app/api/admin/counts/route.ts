import { NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Dashboard/topbar counts. The orders table is RLS-gated so browser-side
// counts always returned zero — these run under the service role instead.
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    { count: unreadEnquiries },
    { count: pendingOrders },
    { data: delivered },
    { data: lowStock },
  ] = await Promise.all([
    supabaseService.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
    supabaseService.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseService.from('orders').select('total').eq('status', 'delivered'),
    supabaseService.from('product_size_inventory')
      .select('product_id, size, quantity, products(name)')
      .lte('quantity', 3).gte('quantity', 0),
  ]);

  const deliveredRevenue = (delivered || [])
    .filter(o => o.total != null)
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return NextResponse.json({
    unreadEnquiries: unreadEnquiries ?? 0,
    pendingOrders: pendingOrders ?? 0,
    deliveredRevenue,
    lowStock: lowStock ?? [],
  });
}
