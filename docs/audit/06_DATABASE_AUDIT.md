# 06 — Database Audit

## 1. Two "databases"
| Store | Scope | Contents |
|---|---|---|
| Browser `localStorage` (per origin) | **All school operations** | see key map below |
| PostgreSQL via Prisma (`apps/api/prisma/schema.prisma`) | Central licensing | `Tenant`, `SchoolLicense`, `SchoolDevice`, `SoftwareRelease`, `CentralAuditLog`, `CentralSyncRecord`, `User`, `StudentProfile`, `TeacherProfile`, `Class`, `Section`, `Subject`, `Attendance`, … |
| Electron sqlite `apps/desktop/offline_sync.db` | Sync queue | sync records |

## 2. localStorage key map (primary)
| Key | Owner | Shape |
|---|---|---|
| `sms_students` | studentService | `Student[]` |
| `sms_uploaded_students` | import buffer → merged & removed on read | `Student[]` |
| `sms_student_photos` | studentService | `{ [id]: base64 }` |
| `sms_demo_cleared` | studentService | `'true'` |
| `sms_attendance_{date}_{grade}-{section}` | attendance page | `{id, status}[]` |
| `sms_marks_{exam}_{grade}_{section}[_{group}]_{subject}` | mark entry | rows / map |
| `sms_exam_setup` | examService | `ExamItem[]` |
| `sms_academic_classes` | **AcademicClient, ClassesClient, classSectionService** | `ClassItem[]` |
| `sms_academic_sessions` | session page | sessions |
| `sms_current_session` | teacherAuthService | auth session |
| `sms_admin_password` | teacherAuthService | plaintext |
| `sms_payment_history`, `sms_student_fee_ledgers`, `sms_fee_invoices`, `sms_expense_records`, `sms_payroll_records`, `sms_waivers`, `sms_refunds`, `sms_vouchers_ledger`, `school_ledger_records` | finance / ledger | arrays/maps |
| `sms_audit_logs` | auditTrailService | unbounded array |
| `sms_marksheet_border_png`, settings logo | settings | base64 |

## 3. Integrity findings
| Finding | Impact |
|---|---|
| No schema/versioning on localStorage data | Format drift across modules (grade `6th` vs `৬ষ্ঠ শ্রেণি` vs `Class 6`; session `২০২৬` vs `2026`) handled by fuzzy `includes()` matching everywhere |
| No referential integrity (marks/attendance keyed by strings, not IDs) | renaming exam/section orphans data (LOGIC-007) |
| Whole-array rewrites | cross-tab lost updates |
| ~5 MB quota, base64 images, unbounded audit log | eventual write failures (BUG-010) |
| Prisma `StudentProfile.admissionNo @unique` globally (not per tenant) | two schools cannot reuse admission numbers — fix with `@@unique([tenantId, admissionNo])` when/if used |
| Prisma `Attendance` uniqueness per student/day ❓ (model at schema.prisma:229, no `@@unique` found) | duplicates possible once used |

## 4. Rules for any change
- No key is renamed or deleted. New fields are additive and optional.
- Any data repair (e.g. BUG-005 religion) runs only after a backup export and explicit confirmation.
- Introduce `sms_schema_version` + idempotent in-browser migrations (see 13).
