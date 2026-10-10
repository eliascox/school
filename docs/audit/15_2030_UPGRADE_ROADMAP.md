# 15 — 2030 Upgrade Roadmap (incremental, on the existing codebase)

```mermaid
flowchart LR
  A["Q4-2026: Phase A+B<br/>correctness, menu, API guards"] --> B["Q1-2027: Phase C+D<br/>single origin, hashed auth,<br/>design system, i18n"]
  B --> C["Q2-2027: Phase E<br/>Guardians, Calendar, Users and Roles,<br/>Reports hub, Audit viewer"]
  C --> D["H2-2027: Phase F<br/>local-first + sync to existing<br/>NestJS/Postgres API"]
  D --> E["2028+: Guardian/teacher mobile app<br/>(apps/mobile), online fees,<br/>analytics, AI insights"]
```

| Horizon | Theme | Builds on existing |
|---|---|---|
| Now | Correct numbers, safe menu, closed API holes | dashboard, Sidebar, teacherRBACService, NestJS guards |
| 6 months | One product feel: shared components, full Bangla/English via `languageService` | existing Tailwind styles, TRANSLATIONS dictionary |
| 12 months | Multi-device: sync school data through existing `syncQueueService` ↔ `/api/v1/sync` with per-device auth; server-side RBAC | Prisma models already present |
| 2028+ | Guardian portal & app (Expo stub exists), SMS/online payment integration, early-warning analytics (attendance + results) | `apps/mobile`, `smsService`, resultService |

Non-goals: framework rewrite, database replacement, big-bang migration.
