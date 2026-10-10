# 13 — Migration Plan (non-destructive)

## Principles
No key/table/column is dropped or renamed. Every migration is additive, idempotent, preceded by an automatic backup export (existing `backupService`), and reversible by restoring that backup.

## M1 — Single canonical origin (fixes BUG-001) — NEEDS CONFIRMATION
1. `server.js`: serve on 3000 only; 3001 responds with a redirect to 3000 **after** a one-time helper page offers to copy data (export from 3001 → import on 3000) so nothing is stranded.
2. Electron: load `http://localhost:<port>` from an embedded server, or keep `file://` and document it as a separate store. Decide with business.
3. Central API → port 4000; set `NEXT_PUBLIC_CENTRAL_API_URL` at build.

## M2 — `sms_schema_version` + in-browser migrations
- `v1 → v2`: hash plaintext passwords lazily (on successful login), keep plaintext fallback read path for one release, then remove plaintext.
- `v2 → v3`: normalise `grade` to canonical keys (`6th`…`10th`) **as an added field** (`gradeKey`), original fields untouched.
- Audit log: cap to last N entries after exporting older entries to a downloadable file.

## M3 — Backend hardening (API, no schema change)
Guards on tenant/updates/backups/register; JWT secret fail-fast. Deploy API before releasing the desktop update that depends on it.

## M4 — Prisma (only when server-side data is approved)
- `@@unique([tenantId, admissionNo])` replacing global unique — via `prisma migrate dev --create-only`, reviewed manually; only if table is empty in production or values already unique per tenant.
- Attendance `@@unique([studentId, date])`.
- **No `migrate reset`, no `db push --accept-data-loss` against production.**

## M5 — Data repair for BUG-005 (religion defaulted to Islam)
Cannot be reliably auto-reversed (original blank vs real Islam is indistinguishable). Offer an admin report "students with religion = Islam set by system" only if an older backup exists to diff against. NEEDS BUSINESS CONFIRMATION.
