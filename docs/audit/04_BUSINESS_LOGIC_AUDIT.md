# 04 — Business Logic Audit

### LOGIC-001 — Student identity / duplicate detection
- **Module:** Students · **Rule:** A student is unique.
- **Current:** Dedupe key = `grade_section_roll` (`studentService.ts:45-55`). Two different students with same class/section/roll are **merged** (second overwrites first: `:69-77`). Grade normalisation strips non-ASCII, so Bangla grade strings (`৬ষ্ঠ শ্রেণি`) normalise to `''` and fall back to `'8th'`-like defaults.
- **Expected:** Unique by stable ID / admission number; roll uniqueness validated **per session+class+section** with an error, never silent merge.
- **Root cause:** Dedupe used as a storage repair step on every read.
- **Impact:** Silent data loss when rolls collide (e.g. after promotion before re-rolling).
- **Solution:** Validate on create/update; dedupe only by `id`; show conflicts.
- **DB/API/UI impact:** none / none / validation message. · **Tests:** create two students same roll → second rejected with message.

### LOGIC-002 — Gender & religion statistics
- See BUG-004/005. **Expected:** explicit values only, "Unspecified" bucket. **NEEDS BUSINESS CONFIRMATION:** exact religion categories required in government reports.

### LOGIC-003 — Academic session scoping
- **Current:** Sessions stored in `sms_academic_sessions`; students carry `session` (default `'২০২৬'`, Bangla digits, `studentService.ts:212`); promotion default target `'২০২৭'` (`:447`). Dashboard and most lists do **not** filter by active session.
- **Expected:** Active session drives lists, attendance, marks, fees.
- **Impact:** After promotion, history and current year mix; Bangla vs English digit session strings never compare equal.
- **NEEDS BUSINESS CONFIRMATION:** Should previous-session students remain visible by default?

### LOGIC-004 — Promotion overwrites student record in place
- **Current:** `promoteStudents` updates `grade/session` on the same record (`studentService.ts:447-472`).
- **Expected:** Keep per-session enrollment history (previous class, roll, result) so old marksheets/attendance remain resolvable.
- **Impact:** Old-year reports resolve to the new class. · **Solution:** enrollment history array or separate enrollment entity (non-destructive, additive field).

### LOGIC-005 — Attendance date & section coverage
- See BUG-002/003. Also: no lock after submission and no edit audit. **NEEDS BUSINESS CONFIRMATION:** can a teacher edit past days? until when?

### LOGIC-006 — Class/section master data has three writers
- See BUG-008. **Expected:** single source of truth `classSectionService`.

### LOGIC-007 — Exam master data
- **Current:** Unified to `examService` for `/dashboard/exam` and `/result` (done in previous session). Exam titles are free-text; marks keys embed the exam title (`markStorageUtils.ts:352`).
- **Impact:** **Renaming an exam orphans all its marks** (keys use title, not ID).
- **Solution:** Block rename once marks exist, or key marks by exam ID with a title alias table. **NEEDS BUSINESS CONFIRMATION.**

### LOGIC-008 — Authentication rules
- **Current:** Admin = any identifier + admin password; teachers by ID/phone + plaintext password; OTP reset fully client-side (`teacherAuthService.ts:110-170, 228-332`).
- **Expected:** Hashed passwords, server-verified OTP, lockout after N failures, session expiry.

### LOGIC-009 — Finance
- **Current:** 459 KB single page + 129 KB service; payments in `sms_payment_history`. Not fully audited in this pass.
- **To verify next:** duplicate-payment guard (double click), receipt number uniqueness, refund approval role, stipend pre-period dues (previous user requirement), rounding.

### LOGIC-010 — Data integrity scenarios
| Scenario | Current protection | Risk |
|---|---|---|
| Double-click save | Not systematically disabled | duplicate payments/marks rows ❓ |
| Refresh during save | `setItem` is atomic per key; multi-key writes are not | partial state (e.g. payment saved, ledger not) |
| Two tabs concurrently | last-write-wins on whole arrays | lost updates |
| Expired session | no expiry | n/a |
| Back button after logout | session cleared; pages rely on Header redirect | brief content flash |
