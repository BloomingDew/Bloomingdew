import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key, value } = await req.json();

  const { error } = await supabaseService
    .from('site_settings')
    .update({ value })
    .eq('key', key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
