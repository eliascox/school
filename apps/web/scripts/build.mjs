import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');

const apiDir = path.join(webRoot, 'src', 'app', 'api');
const parkedApiDir = path.join(webRoot, '.static-export-parked-api');
const nextDir = path.join(webRoot, '.next');

const isServerBuild = Boolean(process.env.VERCEL || process.env.NEXT_SERVER_BUILD === '1');
const STALL_TIMEOUT_MS = Number(process.env.BUILD_STALL_TIMEOUT_MS || 180_000);
const MAX_ATTEMPT_MS = Number(process.env.BUILD_MAX_TIMEOUT_MS || 360_000);
const MAX_ATTEMPTS = 2;

let didParkApiDir = false;
let activeChild = null;

function restoreApiDir() {
  if (didParkApiDir && fs.existsSync(parkedApiDir)) {
    fs.mkdirSync(path.dirname(apiDir), { recursive: true });
    fs.renameSync(parkedApiDir, apiDir);
    didParkApiDir = false;
  }
}

function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Process already exited
    }
  }
}

function clearNextCache(fullClean = false) {
  const targetDir = fullClean ? nextDir : path.join(nextDir, 'types');
  if (fs.existsSync(targetDir)) {
    try {
      fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
    } catch (err) {
      console.warn(`[build.mjs] Warning: could not fully remove ${targetDir}:`, err?.message || err);
    }
  }
}

function runNextBuildAttempt(nextBin, attempt) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    let lastActivityAt = startedAt;
    let timedOutReason = null;

    const child = spawn(process.execPath, [nextBin, 'build'], {
      cwd: webRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });
    activeChild = child;

    const onOutput = (stream) => (chunk) => {
      lastActivityAt = Date.now();
      stream.write(chunk);
    };

    child.stdout?.on('data', onOutput(process.stdout));
    child.stderr?.on('data', onOutput(process.stderr));

    const watchdog = setInterval(() => {
      const now = Date.now();
      const silentMs = now - lastActivityAt;
      const elapsedMs = now - startedAt;

      if (silentMs >= STALL_TIMEOUT_MS) {
        timedOutReason = `no output for ${Math.round(silentMs / 1000)}s`;
      } else if (elapsedMs >= MAX_ATTEMPT_MS) {
        timedOutReason = `exceeded max attempt time (${Math.round(elapsedMs / 1000)}s)`;
      }

      if (timedOutReason) {
        clearInterval(watchdog);
        console.error(
          `\n[build.mjs] Build attempt ${attempt} stalled (${timedOutReason}). Auto-killing hung Next.js process tree...`
        );
        killProcessTree(child.pid);
      }
    }, 5_000);

    child.on('error', (err) => {
      clearInterval(watchdog);
      activeChild = null;
      resolve({ status: 1, error: err, stalled: Boolean(timedOutReason) });
    });

    child.on('close', (code) => {
      clearInterval(watchdog);
      activeChild = null;
      resolve({ status: code ?? 1, error: null, stalled: Boolean(timedOutReason) });
    });
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (activeChild?.pid) {
      killProcessTree(activeChild.pid);
    }
    restoreApiDir();
    process.exit(130);
  });
}

async function main() {
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
    clearNextCache(false);

    const nextBin = require.resolve('next/dist/bin/next');

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await runNextBuildAttempt(nextBin, attempt);

      if (res.stalled && attempt < MAX_ATTEMPTS) {
        console.warn('[build.mjs] Auto-clearing .next cache and retrying a clean production build...\n');
        clearNextCache(true);
        continue;
      }

      if (res.error) {
        console.error(res.error);
        process.exitCode = 1;
      } else {
        process.exitCode = res.status;
      }
      break;
    }
  } finally {
    restoreApiDir();
  }
}

await main();
