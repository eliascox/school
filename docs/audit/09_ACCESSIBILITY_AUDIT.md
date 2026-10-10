# 09 — Accessibility Audit

| ID | Finding | Evidence | Fix |
|---|---|---|---|
| A11Y-01 | Only **4** `aria-label`s in the whole web app; many icon-only buttons (edit/delete/close X, theme, bell, logout icon) | grep `aria-label` = 4 | Add `aria-label` (translated) to every icon-only button |
| A11Y-02 | Modals: no `role="dialog"`, `aria-modal`, focus trap, Esc-to-close | 60 inline modals | Shared accessible `Modal` |
| A11Y-03 | Many inputs use visual labels without `htmlFor`/`id` association | e.g. `ClassesClient.tsx` modals | Associate labels |
| A11Y-04 | Very small text (`text-[10px]`, `text-[11px]`) and low-contrast greys (`text-slate-400` on white) | dashboard, exam cards | Min 12px for content, contrast ≥ 4.5:1 |
| A11Y-05 | `alert()/confirm()` (93) — OK for screen readers but not translatable/styled | | ConfirmDialog with `role="alertdialog"` |
| A11Y-06 | Language attribute: `<html lang>` should switch `bn`/`en` with languageService ❓ | `app/layout.tsx` | Set `document.documentElement.lang` |
| A11Y-07 | Charts (`components/dashboard/*Chart.tsx`) have no text alternative | | Provide table view (exists as "Detailed Table" toggle) + `aria-describedby` |

Target: WCAG 2.2 AA for core flows (login, dashboard, attendance, mark entry, fee collection).
