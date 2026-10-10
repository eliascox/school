# 08 — UX Audit

## 1. Dashboard widget audit (`/dashboard`, from screenshot + code)
| Widget | Data source | Verdict | Action |
|---|---|---|---|
| Total Students | `students.length` (all classes) | Correct calc; shows 0 due to BUG-001 | Add empty state: "No student records on this device — import or add students" with link; show session |
| Boys / Girls | name-keyword heuristic | **Incorrect** (BUG-004) | Explicit gender + "Unspecified" |
| Muslim / Hindu | non-Hindu = Muslim | **Incorrect** (BUG-005) | Religion breakdown incl. Other/Unspecified (one card + donut instead of 2 cards) |
| Quick Actions Hub (6) | static links | Useful | Permission-filter; keep |
| Live Attendance Analytics | A/B/C only, UTC date | **Incorrect** (BUG-002/003) | Dynamic sections, local date, "x/y classes submitted" |
| Class progression bars | per class | OK | Empty state when attendance not taken |
| Loading / error states | `mounted` flag only | Missing | Skeletons + error boundary (exists: `dashboard/error.tsx`) |

## 2. Navigation
- Two groups named inconsistently: "ADMINISTRATION" contains Attendance, SMS, Teachers, Ledger (not admin features).
- Duplicate entries: "Manage Section" and "Classes"; "Student Print" as a separate menu item.
- Duplicate user card + logout at sidebar bottom (user marked ✗).
- Target structure in 02.

## 3. Consistency
- 60 inline modal implementations, 93 `alert/confirm`, no shared Button/Table/Toast → visual and behavioural drift.
- Mixed language in one screen (e.g. Bangla class labels on English dashboard: "প্রেণিভিত্তিক উপস্থিতির গ্রাফ" while EN selected).
- Headings use emoji in code comments only — fine.

## 4. Responsive (code inspection; device testing pending)
- Layout: sidebar drawer on mobile exists (`isOpen/onClose`), `lg:h-screen` desktop.
- 62 tables vs 76 `overflow-x-auto` → most tables scroll; verify the rest at 320–414 px.
- Electron `minWidth: 1024`.
- Planned breakpoints test: 320/375/390/414/768/1024/1280/1440/1920.

## 5. Recommendations (ordered)
1. Menu restructure (02) + remove sidebar footer duplicate.
2. Dashboard correctness + empty/loading states.
3. Shared `Modal`, `ConfirmDialog`, `Toast`, `DataTable` built from the existing Tailwind styling (no new UI library), adopted incrementally.
4. Route every new string through `languageService.t()`.
