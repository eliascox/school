# 07 — API Audit (`apps/api`, NestJS)

| Method | Path | Guard | Roles | Web consumer | Risk |
|---|---|---|---|---|---|
| POST | `/auth/login` | — | — | none | OK (rate-limited ❓) |
| POST | `/auth/register` | — | — | none | **Critical** SEC-001 |
| GET | `/auth/me` | JWT | — | none | OK |
| POST/GET/DELETE | `/academic/classes[/:id]`, `/academic/sections`, `/academic/subjects` | JWT | — | **none** | tenant scoping ❓ |
| POST/GET | `/communication/notices`, `/sms/send`, `/push-notifications/send` | JWT | — | **none** | |
| POST/GET | `/finance/fee-structure`, `/payments/process`, `/report` | JWT | — | **none** | |
| POST/GET | `/hr/staff`, `/hr/payroll/process` | JWT | — | **none** | |
| CRUD | `/tenant[/:id]` | **none** | — | none | **Critical** SEC-002 |
| POST | `/api/v1/schools/register` | — | — | `clientLicenseService.ts:338` | public by design (approval flow) |
| GET | `/api/v1/schools/status/:schoolCode` | — | — | `clientLicenseService.ts:399` | enumeration ❓ |
| GET/POST | `/api/v1/admin/schools[/:id/action]` | JWT+Roles | SUPER_ADMIN | super-admin page ❓ | OK |
| POST | `/api/v1/license/heartbeat` | — | — | `clientLicenseService.ts:485` | signed payload ❓ |
| POST | `/api/v1/updates/check` | — | — | `updateClientService.ts:64` | OK |
| POST | `/api/v1/updates/publish` | **none** | — | `centralAdminService.ts:359` | **Critical** SEC-003 |
| GET | `/api/v1/updates/releases` | — | — | — | OK |
| POST | `/api/v1/sync/push`, `/pull` | **none** | — | `syncQueueService.ts:173,215` | **High** SEC-005 |
| POST/GET | `/api/v1/backups/*` | **none** | — | backupService ❓ | Medium |

## Observations
- School-operation endpoints exist but are **unused** by the web app (it uses localStorage). Do not create a second set of endpoints; extend these if data moves server-side.
- No global `ValidationPipe` found in `main.ts` → DTO class-validator decorators (if any) are not enforced. ❓ verify per DTO.
- Base URL default collision (BUG-009).
- Consumers check before changing any endpoint: only the 7 web call sites listed above + `apps/mobile/services/mobileApiClient.ts` + `apps/desktop/sync-service.js`.
