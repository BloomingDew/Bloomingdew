import { getAdminUser, supabaseService } from '../../../../../lib/admin-server';
import { NextResponse } from 'next/server';

// CSV export of all orders, newest first. Opens as a download.
export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from('orders')
    .select('id, created_at, customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping_cost, total, status, payment_provider, tracking_number')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = [
    'Order', 'Date', 'Customer', 'Email', 'Phone', 'City', 'Country',
    'Items', 'Subtotal', 'Shipping', 'Total', 'Status', 'Provider', 'Tracking',
  ].join(',');

  const rows = (data || []).map(o => {
    const items = (o.items || [])
      .map((i: { name?: string; size?: string; quantity?: number }) =>
        `${i.name} (${i.size}) x${i.quantity}`)
      .join('; ');
    return [
      o.id.slice(0, 8).toUpperCase(),
      new Date(o.created_at).toISOString().slice(0, 10),
      o.customer_name, o.customer_email, o.customer_phone,
      o.shipping_address?.city, o.shipping_address?.country,
      items, o.subtotal, o.shipping_cost, o.total, o.status,
      o.payment_provider, o.tracking_number,
    ].map(esc).join(',');
  });

  const csv = [header, ...rows].join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bloomingdew-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
