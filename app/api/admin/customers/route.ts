import { NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

type OrderRow = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  total: number | null;
  status: string;
  created_at: string;
  items: { id: number; name: string; size: string; quantity: number; price: string | number }[] | null;
};

type CustomerOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  itemCount: number;
};

type Customer = {
  email: string;
  name: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string;
  firstOrderAt: string;
  recentOrders: CustomerOrder[];
};

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseService
    .from('orders')
    .select('id, customer_name, customer_email, total, status, created_at, items')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const byEmail = new Map<string, Customer>();

  for (const order of (data || []) as OrderRow[]) {
    const email = order.customer_email?.trim().toLowerCase();
    if (!email) continue;

    let customer = byEmail.get(email);
    if (!customer) {
      customer = {
        email,
        name: '',
        orders: 0,
        totalSpent: 0,
        lastOrderAt: order.created_at,
        firstOrderAt: order.created_at,
        recentOrders: [],
      };
      byEmail.set(email, customer);
    }

    customer.orders += 1;
    if (order.status !== 'cancelled') customer.totalSpent += order.total || 0;

    // Rows come newest-first, so the first non-empty name we see is the most recent.
    if (!customer.name && order.customer_name?.trim()) customer.name = order.customer_name.trim();
    if (order.created_at > customer.lastOrderAt) customer.lastOrderAt = order.created_at;
    if (order.created_at < customer.firstOrderAt) customer.firstOrderAt = order.created_at;

    if (customer.recentOrders.length < 10) {
      customer.recentOrders.push({
        id: order.id,
        total: order.total || 0,
        status: order.status,
        created_at: order.created_at,
        itemCount: Array.isArray(order.items)
          ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0,
      });
    }
  }

  const customers = Array.from(byEmail.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  const totalCustomers = customers.length;
  const repeatCustomers = customers.filter(c => c.orders >= 2).length;
  const nonCancelledOrders = ((data || []) as OrderRow[]).filter(
    o => o.customer_email?.trim() && o.status !== 'cancelled',
  ).length;
  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = nonCancelledOrders > 0 ? totalSpent / nonCancelledOrders : 0;

  return NextResponse.json({
    customers,
    stats: { totalCustomers, repeatCustomers, avgOrderValue },
  });
}
