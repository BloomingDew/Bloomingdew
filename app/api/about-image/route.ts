import { NextResponse } from 'next/server';
import { supabaseService } from '../../../lib/admin-server';

// site_settings is locked down by RLS, so the consumer About page reads
// the image through this route (service role) rather than the anon client.
export async function GET() {
  const { data } = await supabaseService
    .from('site_settings')
    .select('value')
    .eq('key', 'about_image_url')
    .single();

  return NextResponse.json({ url: data?.value ?? null });
}
