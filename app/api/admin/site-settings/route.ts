import { NextRequest, NextResponse } from 'next/server';
import { getAdmin, supabaseService } from '../../../../lib/admin-server';
import { logActivity } from '../../../../lib/activity';

export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (admin.role !== 'owner') {
    return NextResponse.json({ error: 'Your admin role cannot change site settings.' }, { status: 403 });
  }

  const { key, value } = await req.json();

  // Whitelist keys so a compromised session can't plant arbitrary settings,
  // and validate per-key shape so bad values can't break the storefront.
  const ALLOWED_KEYS = [
    'about_image_url',
    'new_collection_title',
    'new_collection_product_ids',
    'marquee_text',
    'hero_image_url',
    'low_stock_threshold',
    'tax_rates',
  ];
  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: `Unknown setting: ${key}` }, { status: 400 });
  }
  if (value !== null && typeof value !== 'string') {
    return NextResponse.json({ error: 'Value must be a string or null.' }, { status: 400 });
  }
  if (key === 'low_stock_threshold' && value !== null) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > 1000) {
      return NextResponse.json({ error: 'Threshold must be a whole number between 0 and 1000.' }, { status: 400 });
    }
  }
  if (key === 'tax_rates' && value !== null) {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      for (const rate of Object.values(parsed)) {
        const n = Number(rate);
        if (!Number.isFinite(n) || n < 0 || n > 50) throw new Error();
      }
    } catch {
      return NextResponse.json({ error: 'Tax rates must be a JSON object of percentages between 0 and 50.' }, { status: 400 });
    }
  }
  if (key === 'new_collection_product_ids' && value !== null) {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every(n => Number.isInteger(n))) throw new Error();
    } catch {
      return NextResponse.json({ error: 'Product ids must be a JSON array of integers.' }, { status: 400 });
    }
  }

  const { error } = await supabaseService
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  logActivity({ adminEmail: admin.user.email, action: 'update', entity: 'site-setting', entityId: key });
  return NextResponse.json({ success: true });
}
