import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

// Stock-change history. ?productId=42 filters to one product.
export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const productId = req.nextUrl.searchParams.get('productId');
  let query = supabaseService
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (productId) query = query.eq('product_id', Number(productId));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movements: data ?? [] });
}
