import { NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

type OrderRow = {
  total: number | null;
  status: string;
  created_at: string;
  items: { id?: number; name?: string; quantity?: number }[] | null;
};

// Sales analytics for the admin dashboard. All numbers exclude cancelled
// orders; "paid revenue" counts paid/shipped/delivered.
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 60);

  const { data, error } = await supabaseService
    .from('orders')
    .select('total, status, created_at, items')
    .gte('created_at', since.toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = ((data || []) as OrderRow[]).filter(o => o.status !== 'cancelled' && o.status !== 'pending');

  const now = new Date();
  const dayKey = (d: Date) => d.toISOString().slice(0, 10);

  // Revenue per day, last 30 days (zero-filled)
  const perDay: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    perDay.push({ date: dayKey(d), revenue: 0, orders: 0 });
  }
  const byDay = new Map(perDay.map(p => [p.date, p]));
  for (const o of orders) {
    const entry = byDay.get(o.created_at.slice(0, 10));
    if (entry) {
      entry.revenue += Number(o.total) || 0;
      entry.orders += 1;
    }
  }

  // This 30 days vs previous 30 days
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  let current = 0, currentOrders = 0, previous = 0, previousOrders = 0;
  for (const o of orders) {
    const t = new Date(o.created_at);
    if (t >= cutoff) { current += Number(o.total) || 0; currentOrders += 1; }
    else { previous += Number(o.total) || 0; previousOrders += 1; }
  }

  // Best sellers by units over the window
  const unitsByName = new Map<string, number>();
  for (const o of orders) {
    for (const item of o.items || []) {
      if (!item?.name) continue;
      unitsByName.set(item.name, (unitsByName.get(item.name) || 0) + (Number(item.quantity) || 1));
    }
  }
  const bestSellers = [...unitsByName.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, units]) => ({ name, units }));

  return NextResponse.json({
    perDay,
    revenue30d: current,
    orders30d: currentOrders,
    prevRevenue30d: previous,
    prevOrders30d: previousOrders,
    avgOrderValue: currentOrders > 0 ? current / currentOrders : 0,
    bestSellers,
  });
}
