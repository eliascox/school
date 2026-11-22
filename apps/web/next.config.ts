import type { NextConfig } from "next";
import path from "node:path";

const webRoot = path.resolve(process.cwd());
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // On Vercel, standard Next.js build is used so .next/routes-manifest.json is preserved.
  // In local static server or standalone export mode, output: 'export' is used.
  ...(isVercel ? {} : { output: 'export' }),
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: webRoot,
  turbopack: {
    root: webRoot,
  },
};

export default nextConfig;
