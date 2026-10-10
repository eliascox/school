# 10 — Performance Audit

| ID | Finding | Evidence | Recommended action (only where evidence shows a problem) |
|---|---|---|---|
| PERF-01 | Giant single-file client pages: finance 459 KB, students 189 KB, settings 177 KB, ssc-transcript 151 KB, notices 144 KB | file sizes | Split tabs into `next/dynamic` chunks (finance first) — measure first-load JS before/after |
| PERF-02 | Only 3 `next/dynamic` usages | grep | Lazy-load charts, PDF (`pdfjs-dist`), `xlsx`, QR libs |
| PERF-03 | `getAllStudents()` parses + re-serialises + **writes** the full list on every call; called from many renders | `studentService.ts:87-114` | Read-only path + in-memory cache invalidated by `storage` event |
| PERF-04 | Dashboard recomputes demographics/attendance on every render and does ~25 `localStorage.getItem` + `JSON.parse` per render | `dashboard/page.tsx:163-350` | `useMemo` keyed on students/date |
| PERF-05 | Base64 images in localStorage (sync, blocks main thread, quota) | photos/logo/border | IndexedDB for blobs |
| PERF-06 | Fuzzy `includes()` grade matching inside loops over all students for each class | dashboard, studentService | Normalise grade once at write time |
| N/A | No backend queries for school data → N+1/DB pagination not applicable today | | Re-audit if data moves server-side |

Measurement plan: Lighthouse (desktop/mobile) on `/dashboard`, `/dashboard/finance`, `/dashboard/students`; React Profiler on dashboard with 1,000 synthetic students **in a test profile only** (never seed production).
