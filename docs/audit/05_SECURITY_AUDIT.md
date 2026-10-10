# 05 — Security Audit

## A. Central API (`apps/api`)

| ID | Severity | Finding | Evidence | Fix |
|---|---|---|---|---|
| SEC-001 | **Critical** | Public `POST /auth/register` creates a **SUPER_ADMIN** + new tenant for anyone | `auth.controller.ts:22`, `auth.service.ts` `register()` → `role: Role.SUPER_ADMIN` | Disable public registration or require SUPER_ADMIN JWT; default role least-privilege |
| SEC-002 | **Critical** | `TenantController` CRUD has **no guard** (list/update/delete tenants) | `tenant/tenant.controller.ts` | `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(SUPER_ADMIN)` |
| SEC-003 | **Critical** | `POST /api/v1/updates/publish` has no guard **and the server auto-signs** the package hash with its Ed25519 private key when no signature is sent | `updates.controller.ts:23`, `updates.service.ts:50-54` | Guard with SUPER_ADMIN; never auto-sign unauthenticated input (supply-chain attack on every desktop client) |
| SEC-004 | High | JWT secret falls back to `'super-secret'` | `auth.module.ts:12`, `jwt.strategy.ts:11` | Fail fast at boot if `JWT_SECRET` missing |
| SEC-005 | High | `sync/push`, `sync/pull` authenticate only by `schoolId`/`schoolCode` in the body (codes are `SCH-` + 6 digits → guessable) → **IDOR** read/write of another school's data | `sync.controller.ts`, `sync.service.ts:27-35` | Require device-bound signed license token; verify fingerprint against `SchoolDevice` |
| SEC-006 | Medium | Backups `register`/`list`/`:id` unauthenticated; fingerprint header optional | `backup.controller.ts` | Same device token as SEC-005 |
| SEC-007 | Medium | `academic`, `finance`, `hr`, `communication` use `AuthGuard('jwt')` but no role guard; tenant scoping in services ❓ | controllers | Add RolesGuard + always filter by `req.user.tenantId` |
| OK | — | Security headers, HSTS, CORS allowlist, rate limiter, bcrypt for API users, Prisma (no `$queryRawUnsafe` found) | `main.ts`, `auth.service.ts` | — |

## B. Web app (`apps/web`) — client-side security model

> Because all logic runs in the browser and data is in `localStorage`, **anything enforced in the frontend can be bypassed by anyone with access to the device** (DevTools). Hiding a menu item is not security.

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| SEC-101 | **Critical** | Authentication is client-only. Setting `localStorage.sms_current_session = '{"role":"admin"}'` grants full admin | `teacherAuthService.ts:44-59` |
| SEC-102 | **Critical** | Passwords stored **plaintext**; defaults `admin123` (admin) and `123456` (teachers) | `teacherAuthService.ts:86-87,125,180,200`; `teacherRBACService.ts:81,136` (comment says "In backend, hash with bcrypt") |
| SEC-103 | High | No route-level authorization; teachers can open admin URLs | `dashboard/layout.tsx` (no guard); see BUG-011 |
| SEC-104 | High | Sessions never expire; no idle timeout | `teacherAuthService.setSession` |
| SEC-105 | High | OTP for teacher password reset generated, stored and verified in the browser | `teacherAuthService.ts:228-332` |
| SEC-106 | Medium | Login page pre-fills default credentials | `login/page.tsx:64-68,90-95` |
| SEC-107 | Medium | Sensitive personal data (student/guardian phone, address, photos) unencrypted in localStorage; readable by any script on the origin | services |
| SEC-108 | Low | `dangerouslySetInnerHTML` in `app/layout.tsx:37,64` — static inline theme/boot script, no user input → acceptable | |
| OK | — | Electron: `contextIsolation: true`, `nodeIntegration: false` | `desktop/main.js:22-23` |
| N/A | — | CSRF (no cookies), SQL injection (no SQL in web) | |
| ❓ | — | XSS via user-entered HTML in notices/certificates templates — not yet verified | `notices/page.tsx`, `certificates/page.tsx` |

## C. Fix priority (non-destructive)
1. SEC-001/002/003/004 — backend guards (small, isolated changes, no data impact).
2. SEC-102 — hash passwords client-side (PBKDF2 via WebCrypto) with **transparent migration on next successful login** (existing users keep working).
3. SEC-103/104/106 — central route guard, session expiry, remove prefill.
4. SEC-005/006 — device-token auth for sync/backup (coordinate with desktop release).
5. Real enforcement requires server-side data (see 01 §5, 13).
