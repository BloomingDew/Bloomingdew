// Client-side image compression for admin uploads. Phone photos are often
// 4000px+ and 3-12 MB; nothing on the site renders wider than ~1600px, so
// resize + re-encode before uploading to keep Storage (and every later page
// load) fast. Falls back to the original file if decoding fails (e.g. HEIC
// in a browser that can't read it).
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));

    // Already small and not worth re-encoding.
    if (scale === 1 && file.size < 500 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    if (!blob) return file;

    // Only use the compressed version if it's actually smaller.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
