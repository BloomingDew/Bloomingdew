/**
 * Converts a Supabase Storage public URL to a transformed/resized URL.
 * Falls back to the original URL if it's not a Supabase storage URL.
 *
 * Usage:
 *   imgUrl(url, { width: 400, quality: 75 })   // shop grid
 *   imgUrl(url, { width: 900, quality: 80 })   // product detail
 *   imgUrl(url, { width: 150, quality: 70 })   // thumbnails
 */
export function imgUrl(
  url: string | null | undefined,
  opts: { width: number; quality?: number },
): string {
  if (!url) return '';
  const marker = '/storage/v1/object/public/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url; // not a Supabase storage URL — return as-is
  const path = url.slice(idx + marker.length);
  const base = url.slice(0, idx);
  const q = opts.quality ?? 80;
  return `${base}/storage/v1/render/image/public/${path}?width=${opts.width}&quality=${q}&resize=contain`;
}
