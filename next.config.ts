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
  },
};

export default nextConfig;
