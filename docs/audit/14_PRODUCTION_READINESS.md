# 14 — Production Readiness & Implementation Plan

## Verdict: **Not production-ready for multi-user use.** Usable as a single-PC offline tool with known statistical errors.

| Area | Status | Blockers |
|---|---|---|
| Data durability | 🔴 | per-origin silos (BUG-001), quota (BUG-010) |
| Data correctness | 🟠 | gender/religion/attendance stats (BUG-002..006) |
| Security (central API) | 🔴 | SEC-001/002/003 |
| Security (client) | 🔴 | plaintext passwords, client-only auth (SEC-101/102) |
| Authorization | 🟠 | no route guard (BUG-011) |
| UX consistency | 🟠 | menu, modals, alerts |
| i18n | 🟠 | dictionary unused |
| Tests | 🔴 | none in web |
| Build | 🟢 | `tsc` and `next build` pass (39 routes) |

## Phased plan (each phase = separate approval)

**Phase A — Safe fixes inside the web app (no URL, key or data-shape changes)**
1. Sidebar restructured to target tree using existing routes; NEW features not shown; sidebar footer user card removed (Header keeps user/logout).
2. Central route guard in `dashboard/layout.tsx` using permission keys inside `teacherRBACService`.
3. Dashboard: explicit gender + Unspecified; religion buckets; dynamic sections; local-date helper; consistent totals; empty/loading states.
4. `studentService.getAllStudents()` read-only (no default religion, no write on read).
5. Remove credential prefill on login.
6. Add Vitest + regression tests for the above.

**Phase B — Central API hardening** (SEC-001..006). Small, isolated.

**Phase C — Origin consolidation + password hashing migration** (M1, M2) — needs confirmation on Electron.

**Phase D — Design system & i18n**: shared Modal/ConfirmDialog/Toast/DataTable; migrate strings to `languageService.t()` page by page; responsive & a11y pass.

**Phase E — New features (only after confirmation)**: Guardians view, Academic Calendar, Users & Roles, Reports hub, Audit log viewer, Help page, Student documents.

**Phase F — Architecture decision** (01 §5): local-first + sync vs server-first.

## NEEDS BUSINESS CONFIRMATION (blocking list)
1. Deployment model: single PC vs multi-device (01 §5).
2. Canonical URL/port; Electron storage origin.
3. Religion categories & gender "Unspecified" display.
4. Whether exam rename should be blocked once marks exist.
5. Staff vs Teacher entity; Announcements vs Notices; Stipend placement.
6. Mobile: keep logout in drawer after removing sidebar footer?
7. New roles (Head Teacher, Accountant).
