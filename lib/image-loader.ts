// Custom next/image loader.
//
// Vercel's image optimizer returned 402 (quota exhausted) in production,
// which made every product photo on the site invisible — the card onError
// handlers hid the broken images, so the shop rendered with no pictures at
// all. The originals on Supabase were fine throughout.
//
// This routes Supabase-hosted images through Supabase's own transformation
// endpoint (/render/image/public/) instead: still resized and compressed per
// device (a test frame dropped 644KB -> 81KB), but consuming zero Vercel
// image quota, so a traffic spike can never blank the catalogue again.
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.includes('/storage/v1/object/public/')) {
    const joined = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    return `${joined}?width=${width}&quality=${quality || 75}`;
  }
  // Local assets (logo, icons) are tiny and served as-is from /public.
  return src;
}
