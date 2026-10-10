# 12 — Test Plan

## Current state
- Web: **no automated tests**. API: Nest default spec stubs only. Desktop: script tests (`test-*.js`).
- Every change so far verified by `tsc --noEmit` + `next build` + HTTP 200 checks only.

## Proposed (minimal, no framework replacement)
- Add **Vitest** (+ `jsdom`) to `apps/web` for service/unit tests — services are pure TS over `localStorage`, easy to test.
- Add **Playwright** for 6 smoke flows at desktop 1280 and mobile 375.

## Regression suite (mapped to bugs)
| Test | Covers |
|---|---|
| studentService: read does not mutate storage; religion not defaulted | BUG-005/007 |
| studentService: duplicate roll in same session/class/section rejected | LOGIC-001 |
| dashboard stats: gender explicit/unspecified; religion buckets; totals consistent | BUG-004/005/006 |
| dashboard attendance includes dynamically created section "D" | BUG-002 |
| `localDateKey()` at 2026-10-04T01:00+06:00 = `2026-10-04` | BUG-003 |
| route guard: teacher → `/dashboard/settings` redirected | BUG-011 |
| sidebar renders only permitted items per role; all hrefs resolve to built routes | menu restructure |
| auth: legacy plaintext password logs in once then is stored hashed | SEC-102 migration |
| API e2e: `/tenant`, `/updates/publish`, `/auth/register` return 401 without token | SEC-001..003 |

## Smoke flows (Playwright)
Login (admin, teacher) · add student · take attendance · enter marks · view `/result` · collect fee. Each at 375 px and 1280 px; screenshot diff on dashboard.

## Responsive matrix
320, 375, 390, 414, 768, 1024, 1280, 1440, 1920 — sidebar, tables, forms, modals, charts.
