import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // On Vercel, standard Next.js build is used so .next/routes-manifest.json is preserved.
  // In local static server or standalone export mode, output: 'export' is used.
  ...(isVercel ? {} : { output: 'export' }),
  trailingSlash: true,
  images: { unoptimized: true }
};

export default nextConfig;
