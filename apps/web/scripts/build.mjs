import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const apiDir = path.join(webRoot, 'src', 'app', 'api');
const parkedApiDir = path.join(webRoot, '.static-export-parked-api');

const isServerBuild = Boolean(process.env.VERCEL || process.env.NEXT_SERVER_BUILD === '1');
let didParkApiDir = false;

try {
  // Next.js "output: export" forbids dynamic App Router API routes at build time.
  // For static export builds (Firebase Hosting / Electron / server.js out/),
  // park src/app/api temporarily and restore it immediately after build.
  // server.js provides matching local endpoints for static/LAN deployments.
  if (!isServerBuild && fs.existsSync(apiDir)) {
    if (fs.existsSync(parkedApiDir)) {
      fs.rmSync(parkedApiDir, { recursive: true, force: true });
    }
    fs.renameSync(apiDir, parkedApiDir);
    didParkApiDir = true;
  }

  // Ensure stale .next/types from server vs static mode don't cross-contaminate
  const nextTypesDir = path.join(webRoot, '.next', 'types');
  if (fs.existsSync(nextTypesDir)) {
    fs.rmSync(nextTypesDir, { recursive: true, force: true });
  }

  const nextBin = require.resolve('next/dist/bin/next');
  const res = spawnSync(process.execPath, [nextBin, 'build'], {
    cwd: webRoot,
    stdio: 'inherit',
    env: process.env
  });

  if (res.error) {
    console.error(res.error);
    process.exitCode = 1;
  } else {
    process.exitCode = res.status ?? 1;
  }
} finally {
  if (didParkApiDir && fs.existsSync(parkedApiDir)) {
    fs.mkdirSync(path.dirname(apiDir), { recursive: true });
    fs.renameSync(parkedApiDir, apiDir);
  }
}
