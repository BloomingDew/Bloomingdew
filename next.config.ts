import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // All resizing happens in lib/image-loader.ts via Supabase's transformer.
    // Vercel's own optimizer is bypassed entirely: its quota ran out in
    // production (402) and blanked every product photo on the site.
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',

    // Cap the widths the browser is ever allowed to request. Next's defaults
    // reach 2048 and 3840px — a ~1MB transform nothing on this site displays
    // (the widest render is the ~1200px hero). Every fetch above 1920 was pure
    // egress waste, which is what pushed Supabase's cached-egress quota to
    // 254%. Largest fetch is now 1920px (~250KB webp) instead of 3840 (~1MB).
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
