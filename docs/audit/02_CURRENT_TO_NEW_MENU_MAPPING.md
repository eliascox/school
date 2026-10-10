# 02 — Current → New Menu Mapping

Source of current menu: `apps/web/src/components/Sidebar.tsx:62-139` (admin) and `:240-370` (teacher).
The sidebar is a **config array**, so restructuring is a navigation-only change. **No existing route needs to change.**

## 1. Current menu (as implemented)

| Group (current) | Item | Route | adminOnly |
|---|---|---|---|
| Academic | Add Student | `/dashboard/admission` | |
| | Student List | `/dashboard/students` | |
| | Student Print | `/dashboard/students?view=print` | |
| | Stipend | `/dashboard/stipend` | |
| | Curriculum | `/dashboard/academic/curriculum` | |
| | Manage Section | `/dashboard/academic` | |
| | Session | `/dashboard/academic/session` | |
| | Classes | `/dashboard/academic/classes` | |
| Promotion | Student Promotion | `/dashboard/academic/promotion` | |
| | Promotion History | `/dashboard/academic/promotion#logs` | |
| Examination | Exam Setup | `/dashboard/exam` | ✔ |
| | Mark Entry | `/dashboard/exam/mark-entry` | |
| | Bulk Entry | `/dashboard/exam/bulk-entry` | ✔ |
| | Admit Card | `/dashboard/exam/admit-card` | ✔ |
| | Marksheet | `/dashboard/academic/marksheet` | ✔ |
| | Online Result | `/result` (public) | |
| | Tabulation | `/dashboard/exam/tabulation` | ✔ |
| | Rank Result | `/dashboard/exam/rank-result` | ✔ |
| Certificates & Documents | ১. প্রশংসাপত্র | `/dashboard/ssc-transcript` | |
| | ২. সনদ ও ডকুমেন্টস | `/dashboard/certificates` | |
| Finance & Accounts | Student Fees · Payroll · Daily Expenses · Cash & Bank · Waivers & Refunds · Financial Reports | `/dashboard/finance?tab=…` | |
| ADMINISTRATION | Daily Attendance | `/dashboard/academic/attendance` | |
| | SMS Broadcast | `/dashboard/sms` | ✔ |
| | Teacher Management | `/dashboard/teacher` | ✔ |
| | General Ledger | `/dashboard/ledger` | ✔ |
| | Notice Board | `/dashboard/notices` | |
| | System Settings | `/dashboard/settings` | ✔ |
| (bottom) | User card + Logout | — | duplicate of Header user menu (marked ✗ in user screenshot) |

Routes with **no menu entry**: `/dashboard/hr` (redirect → teacher), `/dashboard/mobile-app` (redirect → teacher-portal), `/dashboard/teacher-portal` (teacher home), `/admission` (public admission form), `/register-school`, `/super-admin`, `/teacher-login`, `/verify-certificate`.

## 2. Target menu mapping

Status: **EXISTS** = move only · **PARTIAL** = exists but incomplete · **NEW FEATURE REQUIRED** = does not exist (will not be shown in the menu until built — no placeholder pages).

| Target | Maps from (existing) | Route (unchanged) | Status |
|---|---|---|---|
| **Dashboard** | Dashboard | `/dashboard` | EXISTS |
| People › Students | Student List (+ Student Print as view) | `/dashboard/students` | EXISTS |
| People › Guardians | Father/mother/guardian fields on student record | — | **NEW FEATURE REQUIRED** (data exists, no page) |
| People › Teachers | Teacher Management | `/dashboard/teacher` | EXISTS |
| People › Staff | Teacher page is labelled "শিক্ষক ও স্টাফ"; payroll in Finance | `/dashboard/teacher` | PARTIAL · NEEDS BUSINESS CONFIRMATION |
| Academic › Classes & Sections | Classes **and** Manage Section (duplicate pages, same storage key) | `/dashboard/academic/classes` | EXISTS — merge `/dashboard/academic` after feature diff |
| Academic › Subjects | Curriculum | `/dashboard/academic/curriculum` | EXISTS |
| Academic › Routine | `routineService` used only inside teacher portal | `/dashboard/teacher-portal?tab=routine` | PARTIAL (no admin editor) |
| Academic › Academic Calendar | — | — | **NEW FEATURE REQUIRED** |
| Academic › Academic Session | Session | `/dashboard/academic/session` | EXISTS |
| Admissions › Applications | Public `/admission` form | `/admission` + review in `/dashboard/admission` ❓ | PARTIAL (verify review flow) |
| Admissions › New Admission | Add Student | `/dashboard/admission` | EXISTS |
| Admissions › Enrollment | Admission writes student directly | — | PARTIAL · NEEDS BUSINESS CONFIRMATION |
| Admissions › Student Documents | Only photo upload | — | **NEW FEATURE REQUIRED** |
| Attendance › Daily Attendance | Daily Attendance | `/dashboard/academic/attendance` | EXISTS |
| Attendance › Leave Management | `leaveService` (teacher leave in teacher portal) | `/dashboard/teacher-portal?tab=leaves` | PARTIAL (no student leave, no admin page) |
| Attendance › Attendance Reports | Absentee/report tabs inside attendance page | `/dashboard/academic/attendance` | PARTIAL |
| Examination › Exam Setup | Exam Setup | `/dashboard/exam` | EXISTS |
| Examination › Exam Schedule | Free-text date on exam; Admit Card | `/dashboard/exam/admit-card` | PARTIAL |
| Examination › Marks Entry | Mark Entry + Bulk Entry | `/dashboard/exam/mark-entry`, `/bulk-entry` | EXISTS |
| Examination › Result | Tabulation, Rank Result, Online Result | `/dashboard/exam/tabulation`, `/rank-result`, `/result` | EXISTS |
| Examination › Report Card | Marksheet | `/dashboard/academic/marksheet` | EXISTS |
| Promotion › Promotion Rules | Logic inside promotion page | — | PARTIAL (no configurable rules) |
| Promotion › Class Promotion | Student Promotion (+ History) | `/dashboard/academic/promotion` | EXISTS |
| Promotion › Transfer | TC template in certificates; no student status workflow | `/dashboard/certificates` | PARTIAL |
| Finance › Fee Structure | inside finance page ❓ | `/dashboard/finance?tab=student_fees` | PARTIAL (verify) |
| Finance › Fee Collection | Student Fees | `/dashboard/finance?tab=student_fees` | EXISTS |
| Finance › Due Management | inside Student Fees / Reports | `/dashboard/finance?tab=reports` | PARTIAL |
| Finance › Expenses | Daily Expenses | `/dashboard/finance?tab=expenses` | EXISTS |
| Finance › General Ledger | General Ledger (+ Cash & Bank) | `/dashboard/ledger` | EXISTS |
| Finance › *(extra, keep)* | Payroll, Waivers & Refunds, Financial Reports, Stipend | existing | EXISTS · placement of Stipend NEEDS BUSINESS CONFIRMATION |
| Communication › SMS | SMS Broadcast | `/dashboard/sms` | EXISTS |
| Communication › Notice Board | Notice Board | `/dashboard/notices` | EXISTS |
| Communication › Announcements | Notices | — | PARTIAL · NEEDS BUSINESS CONFIRMATION (difference vs notice?) |
| **Certificates & Documents** | Testimonials + Certificates (keep 2 children as previously requested) | `/dashboard/ssc-transcript`, `/dashboard/certificates` | EXISTS |
| **Reports & Analytics** | Reports scattered across modules | — | **NEW FEATURE REQUIRED** (hub page linking existing reports) |
| Administration › Users | Only admin password + teacher accounts | — | **NEW FEATURE REQUIRED** |
| Administration › Roles & Permissions | Hardcoded `admin`/`teacher` | — | **NEW FEATURE REQUIRED** |
| Administration › School Settings | System Settings | `/dashboard/settings` | EXISTS |
| Administration › Notification Settings | SMS gateway config (in settings/sms) ❓ | — | PARTIAL |
| Administration › Audit Logs | `sms_audit_logs` written, no viewer found | — | PARTIAL |
| **Help & Support** | — | — | **NEW FEATURE REQUIRED** |

## 3. Route compatibility strategy
- **Phase A changes no URLs.** All existing bookmarks keep working.
- `/dashboard/academic` (Manage Section): keep the route. After confirming `ClassesClient` covers every feature in `AcademicClient`, turn it into a redirect to `/dashboard/academic/classes` (same pattern as the existing `/dashboard/hr` redirect).
- `/dashboard/hr`, `/dashboard/mobile-app`: keep the existing redirects.
- Teacher menu (`Sidebar.tsx:240-370`): keep as is; only apply permission filtering.
