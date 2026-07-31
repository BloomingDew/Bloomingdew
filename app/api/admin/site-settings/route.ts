import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, supabaseService } from '../../../../lib/admin-server';

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  ];
  if (!ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: `Unknown setting: ${key}` }, { status: 400 });
  }
  if (value !== null && typeof value !== 'string') {
    return NextResponse.json({ error: 'Value must be a string or null.' }, { status: 400 });
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

  return NextResponse.json({ success: true });
}
