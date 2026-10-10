# 03 — Bug Register

All entries are backed by a file:line reference. Status for all: **Open**.

---
### BUG-001 — Dashboard shows 0 students / data "disappears"
- **Module:** Core data layer · **Page:** `/dashboard` (and every page)
- **Severity:** Critical · **Priority:** P0
- **Steps:** Add students at `http://localhost:3000`. Open `http://localhost:3001` (or the Electron app, or the LAN IP).
- **Expected:** Same students everywhere. · **Actual:** 0 students, 0 boys, 0 girls, 0% attendance.
- **Root cause:** Data is stored only in `localStorage`, which is per origin. `apps/web/server.js:6` serves the same app on **both 3000 and 3001**; Electron loads `file://` (`apps/desktop/main.js:33`). Each origin is a separate empty database. `studentService.getAllStudents()` (`studentService.ts:87-114`) returns `[]` when `sms_students` is absent on that origin.
- **Other possible causes ruled in/out:** The query/filter is not the cause (the dashboard counts `students.length` directly, `dashboard/page.tsx:201`). Real zero records is possible if *Clear All Data* was used (`studentService.clearAllDemoData`, sets `sms_demo_cleared`).
- **How to confirm on the affected PC:** DevTools → Application → Local Storage → check whether `sms_students` exists **for the exact origin in the address bar**.
- **Affected users:** All · **Business impact:** Staff believe data is lost; double data entry. · **Data impact:** Divergent copies of data.
- **Recommended fix:** Serve on one canonical origin (single port, redirect 3001→3000); same origin for Electron (load `http://localhost:3000` or migrate storage); long-term see 01 §5.
- **Regression test:** Add student on canonical origin → reload → visit alternate URL → redirected and student visible.

### BUG-002 — Dashboard attendance ignores sections other than A/B/C
- **Module:** Dashboard / Attendance · **Severity:** High · **Priority:** P1
- **Root cause:** `dashboard/page.tsx:295` hardcodes `const branches = ['A','B','C','all']`. Sections created in Classes & Sections (e.g. "D", "বিজ্ঞান") are never read.
- **Expected:** Sections come from `classSectionService.getSectionsForGrade()`.
- **Regression test:** Create section D, take attendance for D → dashboard present/absent includes D.

### BUG-003 — Dates computed in UTC, wrong day between 00:00–05:59 Bangladesh time
- **Module:** Attendance, Dashboard, Finance, others (36 occurrences of `toISOString().split('T')[0]`)
- **Severity:** High · **Priority:** P1
- **Evidence:** `attendance/page.tsx:51`, `dashboard/page.tsx:277`.
- **Actual:** At 01:00 on 4 Oct (UTC+6) the app uses 3 Oct → attendance saved/read under the previous day; "today" widgets show yesterday.
- **Fix:** Shared `localDateKey()` helper (`YYYY-MM-DD` in local time). Same key format, so existing records stay compatible.
- **Test:** Mock clock to 2026-10-04T01:00+06:00 → key `2026-10-04`.

### BUG-004 — Gender guessed from student name; unknown counted as boy
- **Module:** Dashboard · **Severity:** High · **Priority:** P1
- **Evidence:** `dashboard/page.tsx:140-148` (name keywords such as "আক্তার", "জাহান"), `:177-181` (else → male).
- **Impact:** Wrong boy/girl statistics (used in govt. reports / stipend). Male names containing "জাহান" are counted as girls.
- **Fix:** Count only explicit `gender`; add an "Unspecified" bucket; prompt data completion. Remove name heuristics.

### BUG-005 — Religion silently defaulted to Islam and written back; non-Hindu counted as Muslim
- **Module:** Student data / Dashboard · **Severity:** High · **Priority:** P1
- **Evidence:** `studentService.ts:66,74` sets `religion: … || 'ইসলাম'` inside dedupe, then `:108` **persists** it on every read. `dashboard/page.tsx:183-187` counts everything not Hindu as Muslim.
- **Data impact:** Real data is mutated on read (Buddhist/Christian/blank students become Islam permanently).
- **Fix:** Never default on read; buckets Islam/Hindu/Buddhist/Christian/Other/Unspecified. NEEDS BUSINESS CONFIRMATION before any repair of already-mutated records.

### BUG-006 — Total vs class breakdown mismatch
- **Severity:** Medium · **Evidence:** `dashboard/page.tsx:201` total = all students; boys/girls/muslim sums only classes 6–10 (`:202-204`).
- **Fix:** Use the same filtered set for all cards, or show "Other classes" row.

### BUG-007 — `getAllStudents()` writes to storage on every read
- **Severity:** Medium · **Evidence:** `studentService.ts:108`.
- **Impact:** Every render/read rewrites the full student list (perf, cross-tab write races, the mutation in BUG-005).
- **Fix:** Persist only when the import buffer was merged or dedupe changed something.

### BUG-008 — Three writers for `sms_academic_classes`; duplicate pages
- **Severity:** Medium · **Evidence:** `AcademicClient.tsx` (`/dashboard/academic`), `ClassesClient.tsx` (`/dashboard/academic/classes`), `classSectionService.ts`.
- **Impact:** Last write wins; different normalisation; two menu items ("Manage Section", "Classes") do the same job.
- **Fix:** Route both pages through `classSectionService`; merge pages (see 02 §3).

### BUG-009 — Central API base URL collides with the web server port
- **Severity:** Medium · **Evidence:** default `http://localhost:3000` in `clientLicenseService.ts:41`, `syncQueueService.ts:24`, `updateClientService.ts:17`, `centralAdminService.ts:358`; web static server also on 3000 (`server.js:6`); API default `PORT ?? 3000` (`api/src/main.ts:74`).
- **Impact:** License heartbeat / sync / update calls hit the static file server in local setups and fail.
- **Fix:** API on its own port (e.g. 4000) and `NEXT_PUBLIC_CENTRAL_API_URL` set at build.

### BUG-010 — Audit log grows without limit in localStorage
- **Severity:** Medium · **Evidence:** `auditTrailService.ts` appends forever; base64 photos/logo also in localStorage.
- **Impact:** At ~5 MB quota every `setItem` throws → saves fail silently in pages that catch errors (data loss).
- **Fix:** Ring buffer (e.g. last 5,000 entries) + export; storage usage meter; move images to IndexedDB.

### BUG-011 — Teachers can open admin pages by URL
- **Severity:** High · **Evidence:** `Sidebar.tsx` `adminOnly` hides links only; `dashboard/layout.tsx` has no guard; pages such as `settings`, `sms`, `ledger`, `exam/tabulation`, `stipend`, `students` contain 0 role checks.
- **Fix:** Route-permission map enforced in `dashboard/layout.tsx` (client) + server enforcement when data moves server-side.

### BUG-012 — Duplicate user card + logout in sidebar footer
- **Severity:** Low (UX) · **Evidence:** `Sidebar.tsx:475-500`; Header already shows user + logout. Marked ✗ in the user's screenshot.
- **Fix:** Remove sidebar footer block on desktop; keep logout reachable on mobile drawer if Header menu is hidden. NEEDS BUSINESS CONFIRMATION (mobile).

### BUG-013 — Login page pre-fills default credentials
- **Severity:** Medium · **Evidence:** `login/page.tsx:64-68, 90-95` (`admin123`, `123456`).
- **Fix:** Remove prefill; show "change default password" warning instead.

### BUG-014 — 93 blocking `alert()` / `confirm()` dialogs
- **Severity:** Low · **Impact:** Inconsistent UX, blocks UI thread, not translatable consistently. **Fix:** Shared Toast + ConfirmDialog.

## Items requiring verification (not yet classified as bugs)
- Whether mark-entry / bulk-entry / tabulation read the exam list from `examService` (unified recently) or have their own lists.
- Whether `/dashboard/admission` reviews applications submitted from public `/admission`.
- Fee structure location inside the 459 KB finance page.
