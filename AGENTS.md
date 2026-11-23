# Project Build & Reliability Rules

## Next.js Build Hang / Stall Auto-Recovery
- On Windows, Next.js Turbopack (`next build`) can occasionally hang with zero log output during `Creating an optimized production build ...` when switching between server (`VERCEL=1`) and static export builds due to a locked or stale `.next` cache.
- Always run production builds through `node scripts/build.mjs` inside `apps/web`. It includes an automatic stall watchdog (`180s` no-output timeout / `360s` max attempt timeout) that automatically kills the hung process tree, clears `apps/web/.next`, and retries once cleanly.
- If any background build task (`node scripts/build.mjs`, `next build`, or `npm run build`) ever stays silent with no new log output for more than **3 minutes**:
  1. Immediately kill the stalled build task / process tree (never kill `server.js` or unrelated daemons).
  2. Verify `apps/web/.static-export-parked-api` is restored back to `apps/web/src/app/api` if it was left parked.
  3. Clear `apps/web/.next` completely (`Remove-Item -Recurse -Force apps/web/.next`).
  4. Re-run the clean build automatically without waiting indefinitely.
