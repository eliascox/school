# 01 — Existing Architecture (Discovery Report)

> Audit date: 2026-10-03 · Method: read-only inspection, no code modified.
> Status legend: ✅ verified in code · ⚠️ partially verified · ❓ not verified

## 1. Monorepo layout

| Path | Tech | Role | Used in production flow? |
|---|---|---|---|
| `apps/web` | Next.js **16.2.12** (App Router, Turbopack), React 19.2, Tailwind v4, TypeScript | The school ERP UI **and** all school business logic | ✅ Primary |
| `apps/web/server.js` | Node `http` static server | Serves `apps/web/out` on **ports 3000 and 3001** | ✅ |
| `apps/desktop` | Electron (`contextIsolation: true`, `nodeIntegration: false`) | Loads `file://…/web/out/index.html`, backup, clock watchdog, sqlite sync db | ✅ |
| `apps/api` | NestJS + Prisma (PostgreSQL) | Central licensing / school registration / updates / sync / backups | ⚠️ only licensing-related endpoints are called by web |
| `apps/mobile` | Expo (stub: `App.tsx` 455 B) | Not functional | ❌ |
| `packages/shared-types`, `packages/crypto-utils` | TS libs | License, sync, signature types/helpers | ✅ |

`next.config.ts` → `output: 'export'`, `trailingSlash: true`. **There is no Next.js server, no API routes, no middleware.**

## 2. Where school data actually lives

**All school operational data (students, attendance, marks, exams, classes, fees, ledger, certificates, notices, teachers, passwords, sessions) is stored in the browser's `localStorage`**, accessed through ~25 singleton services in `apps/web/src/services/*` (pub/sub + `window` `storage` events).

| Concern | Implementation | Evidence |
|---|---|---|
| Students | `localStorage['sms_students']` (+ `sms_uploaded_students` import buffer, `sms_student_photos` base64) | `services/studentService.ts:87-114` |
| Attendance | `sms_attendance_{YYYY-MM-DD}_{grade}-{section}` | `dashboard/academic/attendance/page.tsx:125,169` |
| Marks | `sms_marks_{exam}_{grade}_{section}_{group}_{subject}` | `lib/markStorageUtils.ts:352` |
| Exams | `sms_exam_setup` | `services/examService.ts:10` |
| Classes/sections | `sms_academic_classes` (**3 writers**) | `AcademicClient.tsx`, `ClassesClient.tsx`, `services/classSectionService.ts` |
| Sessions | `sms_academic_sessions` | `dashboard/academic/session/page.tsx` |
| Finance | `sms_payment_history`, `sms_student_fee_ledgers`, `sms_fee_invoices`, `sms_expense_records`, `sms_payroll_records`, `sms_waivers`, `sms_refunds`, `sms_vouchers_ledger`, `school_ledger_records` | `studentService.ts:412-420`, `financeService.ts` |
| Auth session | `sms_current_session` (`{role, teacherId?, teacherName?}`) | `teacherAuthService.ts:44-59` |
| Admin password | `sms_admin_password` (plaintext, default `admin123`) | `teacherAuthService.ts:125,180` |
| Audit log | `sms_audit_logs` (append-only, unbounded) | `auditTrailService.ts` |

The Prisma schema (`apps/api/prisma/schema.prisma`) contains `User`, `StudentProfile`, `TeacherProfile`, `Class`, `Section`, `Subject`, `Attendance` models and `services/dbSchema.sql` exists, **but the web app never reads or writes them.** The web calls the API only for: `/api/v1/schools/register`, `/api/v1/schools/status/:code`, `/api/v1/license/heartbeat`, `/api/v1/updates/check|publish`, `/api/v1/sync/push|pull` (`clientLicenseService.ts`, `updateClientService.ts`, `syncQueueService.ts`, `centralAdminService.ts`).

### Consequence (most important architectural fact)
`localStorage` is scoped **per origin**. `http://localhost:3000`, `http://localhost:3001`, `http://127.0.0.1:3000`, `http://<LAN-IP>:3000` and Electron's `file://` are **five separate, isolated databases**. Data entered in one is invisible in the others. This is the leading root-cause candidate for the "0 students" dashboard (see BUG-001).

## 3. Layer map

| Layer | Finding |
|---|---|
| Frontend framework | Next.js 16 App Router, all pages `'use client'` |
| Backend for school ops | **None** (browser only) |
| Central backend | NestJS 10-style modules, Prisma, JWT (passport-jwt), bcrypt, security headers, CORS allowlist, custom rate limiter |
| Database | Browser localStorage (school ops); PostgreSQL (central licensing) |
| Authentication | Client-side only, `teacherAuthService.unifiedLogin` compares plaintext strings |
| Authorization / RBAC | `teacherRBACService.can*()` helpers + Sidebar `adminOnly` flag. Roles: `admin`, `teacher` (+ class-teacher assignment). No route-level guard. |
| Routing | File-system routes under `src/app`; query-string tabs (`/dashboard/finance?tab=…`) |
| State management | React `useState` + service singletons + `storage` events. No global store. |
| Forms / validation | Inline per page; no schema validation library |
| UI components | No shared primitives. 60 inline modals (`fixed inset-0`), 62 `<table>`s, 93 `alert()/confirm()` calls |
| i18n | `languageService` has a `TRANSLATIONS` dictionary and `t()`; **0 call sites**; 208 inline `currentLang === 'en' ? … : …` ternaries |
| File storage | Base64 strings in localStorage (photos, logo, marksheet border) |
| Notifications / SMS | `smsService.ts` (HTTP gateway via proxy), `noticeService.ts` |
| Reporting | Embedded in pages (finance `reports` tab, tabulation, rank result, attendance absentee list) |
| Backup | `backupService.ts` + Electron `backup-manager.js` + `DisasterRecoveryPanel.tsx` |
| Tests | Web: none. API: default Nest spec stubs. Desktop: `test-*.js` scripts. |

## 4. Page inventory (by size — indicates refactor risk)

| Route | File size | Note |
|---|---|---|
| `/dashboard/finance` | **459 KB** | single file, 6 tabs |
| `/dashboard/students` | 189 KB | |
| `/dashboard/settings` | 177 KB | |
| `/dashboard/ssc-transcript` | 151 KB | Testimonials |
| `/dashboard/notices` | 144 KB | |
| `/dashboard/teacher` | 116 KB | |
| `/dashboard/teacher-portal` | 102 KB | teacher home |
| `/dashboard/certificates` | 90 KB | |
| `/dashboard/academic/curriculum` | 76 KB | |
| `/dashboard` | 75 KB | dashboard |
| others | 20–70 KB | |

Only 3 `next/dynamic` imports in the whole app → large first-load bundles on heavy pages.

## 5. NEEDS BUSINESS CONFIRMATION — target data architecture
- **What is unclear:** Is this product meant to be (a) a single-PC offline desktop app (Electron, localStorage/sqlite is acceptable), or (b) a multi-user web ERP where several staff use different devices on the same data?
- **Why it matters:** In (b) the current design cannot work — every device/browser/port has its own isolated data, and security is unenforceable on the client.
- **Possible behaviours:** (1) Keep local-first; pin to a single origin; harden. (2) Hybrid: local-first + mandatory sync to the existing NestJS/Postgres API. (3) Server-first: move school data to the API (largest change).
