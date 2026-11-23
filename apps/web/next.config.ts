import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const webRoot = path.resolve(process.cwd());
const monorepoCandidate = path.resolve(webRoot, "../..");
// In npm workspaces / Turborepo (including Vercel), `next` is hoisted to the
// monorepo root `node_modules/next`. Setting both `turbopack.root` and
// `outputFileTracingRoot` to that root prevents Next.js 16 Turbopack from
// rejecting hoisted packages as outside the project directory.
const hasMonorepoRoot =
  fs.existsSync(path.join(monorepoCandidate, "package.json")) &&
  fs.existsSync(path.join(monorepoCandidate, "node_modules", "next"));
const workspaceRoot = hasMonorepoRoot ? monorepoCandidate : webRoot;

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // On Vercel, standard Next.js build is used so .next/routes-manifest.json is preserved.
  // In local static server or standalone export mode, output: 'export' is used.
  ...(isVercel ? {} : { output: 'export' }),
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
