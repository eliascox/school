# 11 — RBAC Permission Matrix

## 1. Current system (extend, do not replace)
- Roles in session: `admin`, `teacher` (`teacherAuthService` `UserSession.role`). Class-teacher and subject-teacher are **assignments** (`teacherRBACService` `SubjectAssignment`, `ClassTeacherAssignment`).
- Checks: `teacherRBACService.canTakeClassAttendance`, `canTakePeriodAttendance`, `canEditMarks`, `canViewFeeInfo`, `canEditStudentBasicProfile`, `canViewNotices`, `canCreateNotice`, `canViewRoutine`, `canSubmitLeave`, `canApproveLeave`, `canConsolidateResults` (`teacherRBACService.ts:509-571`), and Sidebar `adminOnly`.
- Central API: `Role` enum in Prisma incl. `SUPER_ADMIN` (+ RolesGuard).

## 2. Proposed permission keys (implemented as a map inside the existing `teacherRBACService`, not a second system)

| Permission | Admin | Head Teacher* | Class Teacher | Subject Teacher | Accountant* |
|---|---|---|---|---|---|
| dashboard.view | ✔ | ✔ | own portal | own portal | ✔ (finance widgets) |
| student.view | ✔ | ✔ | own class | own subjects' classes | ✔ |
| student.create / student.delete | ✔ | ✔ | — | — | — |
| student.update | ✔ | ✔ | basic profile (existing rule) | — | — |
| attendance.view | ✔ | ✔ | own class | own periods | — |
| attendance.mark | ✔ | ✔ | own class | own periods | — |
| attendance.edit (past) | ✔ | ✔ | NEEDS BUSINESS CONFIRMATION | — | — |
| exam.setup | ✔ | ✔ | — | — | — |
| exam.marks.enter | ✔ | ✔ | — | assigned subject | — |
| exam.marks.edit (after lock) | ✔ | ✔ | — | — | — |
| exam.result.publish | ✔ | ✔ | — | — | — |
| promotion.execute | ✔ | ✔ | — | — | — |
| certificate.issue | ✔ | ✔ | — | — | — |
| finance.payment.collect | ✔ | — | NEEDS CONFIRMATION | — | ✔ |
| finance.refund.approve | ✔ | — | — | — | — |
| finance.ledger.view | ✔ | ✔ | — | — | ✔ |
| communication.sms.send | ✔ | ✔ | — | — | — |
| notice.create | ✔ | ✔ | (existing `canCreateNotice`) | — | — |
| leave.approve | ✔ | ✔ | — | — | — |
| settings.manage / users.manage / roles.manage / audit.view | ✔ | — | — | — | — |

\* Head Teacher and Accountant roles do **not exist today** → NEW FEATURE REQUIRED; NEEDS BUSINESS CONFIRMATION.

## 3. Enforcement points
1. Sidebar items carry a `permission` key (replaces boolean `adminOnly`, same behaviour for existing roles).
2. `dashboard/layout.tsx` route guard maps route → permission; unauthorised → teacher portal / 403 view.
3. Service-level checks inside write functions (defence in depth on the client).
4. **Real security only when enforced by the API** (see 05, 13).
