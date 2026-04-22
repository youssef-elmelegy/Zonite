# Implementation Plan: Backend Foundation (Phase 2 — NestJS, Sikka Parity)

**Branch**: `004-backend-foundation` | **Date**: 2026-04-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-backend-foundation/spec.md`

---

## Summary

Vendor the Sikka Platform Backend's production-shaped NestJS skeleton into `apps/backend/` and light up the full auth surface, global response envelope, validation, exception filter, Scalar docs portal, Drizzle-on-Postgres DB layer, and a global throttler — exactly as Sikka ships them, with zero parallel systems. Phase 2 exits when a fresh user can register → login → call a protected route → refresh → forgot-password (with a real reset email) → reset-password end-to-end against the Zonite backend, and every endpoint (including the Phase-0 health route) returns Sikka's envelope shape. Schemas live in `apps/backend/src/db/schema/`, migrations are generated and applied against Phase 0's Postgres service, and the `users` table is seeded as part of migration. Cross-wire types (envelope shape, auth payload, pagination contract) move into `packages/shared`. Five Phase 2 Speks are written.

---

## Technical Context

**Language/Version**: TypeScript ^5.7 (strict, pinned at repo root via `tsconfig.base.json`), Node.js 22 LTS (pinned via `.nvmrc`).

**Primary Dependencies** (all mirrored from Sikka's actual `package.json`):

- Framework: `@nestjs/core@^11.1.9`, `@nestjs/common@^11.1.9`, `@nestjs/platform-express@^11.1.9`, `reflect-metadata@^0.2.2`, `rxjs@^7.8.1`
- Auth: `@nestjs/jwt@^11.0.1`, `@nestjs/passport@^11.0.5`, `passport@^0.7.0`, `passport-jwt@^4.0.1`, `bcrypt@^6.0.0`
- Validation: `class-validator@^0.14.3`, `class-transformer@^0.5.1`
- DB: `drizzle-orm@^0.44.7`, `pg@^8.x`, `drizzle-kit@^0.31.7` (devDep)
- Env: `zod@^4.1.13`, `dotenv@^17.2.3`
- Docs: `@nestjs/swagger@^11.2.3`, `@scalar/nestjs-api-reference@^1.0.8`
- Rate limit: `@nestjs/throttler@^6.5.0` (in-memory store in Phase 2; swap to Redis later)
- Cookies: `cookie-parser@^1.4.7`, `@types/cookie-parser`
- Email: `nodemailer@^8.x` (transport configurable via env — log-to-console in dev, SMTP/provider in prod)

**Storage**: PostgreSQL (from Phase 0's `docker-compose.yml`). Drizzle-kit migrations under `apps/backend/src/db/migrations/`; schema under `apps/backend/src/db/schema/`; connection via `pg.Pool` → `drizzle()` with `env.DATABASE_URL`.

**Testing**: `jest@^30` (unit + e2e), `@nestjs/testing`, `supertest` for HTTP assertions. Phase 2 ships the wiring; full suites are per-feature in later phases. Phase 2 MUST ship: a smoke e2e that walks the auth loop (register → login → protected → refresh → forgot → reset), and unit assertions on envelope/exception-filter behavior.

**Target Platform**: Linux server (Docker). Local dev via Phase 0's `docker-compose.yml`. Production deployment is Phase 8's concern — Phase 2 must remain deployable but no pipeline is built here.

**Project Type**: Web service (backend of an existing monorepo with frontend sibling). No new top-level packages.

**Performance Goals**:

- Cold boot-to-liveness: ≤ 10 s on reference machine (SC-001)
- `GET /api/health` p95: < 50 ms
- Auth endpoints p95: < 200 ms (register includes bcrypt hash — budget ~150 ms for that alone)
- Brute-force burst tripping: auth-route limiter reaches `429` within 10 s of single-IP burst (SC-012)

**Constraints**:

- **Sikka Parity (Principle II, non-negotiable)**: zero structural divergence from Sikka's `src/` tree at directory level (SC-008). Where Sikka ships a utility/DTO, Zonite vendors it; any behavioral change is a violation.
- **No Redis in Phase 2**: throttler uses the in-memory default. Design keeps storage pluggable.
- **No frontend work** (Phase 6/7 scope).
- **API URL layout unversioned** (Clarification 5): `/api/...` — no `/v1`.
- **Docs portal open in production** (Clarification 4): no gate; schema is public.
- **Fail-fast DB connect** (Clarification 2): no in-process retry loop.

**Scale/Scope**: Single-region, single-instance backend in Phase 2. ~10 endpoints live at phase exit: `GET /api/health`, `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `POST /api/auth/forgot-password` (a.k.a. `send-otp`), `POST /api/auth/verify-otp`, `POST /api/auth/reset-password`, `POST /api/auth/change-password`, plus `GET /api/docs`. No game/room/websocket endpoints.

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Evaluated against Zonite Constitution v1.0.0 (all five principles).

### I. Shared Contract Source of Truth — ✅ PASS

- `SuccessResponse<T>`, `ErrorResponse`, `ApiResponse`, and the pagination query/response shapes go into `packages/shared/src/http/` and are imported by `apps/backend`.
- Auth payload interfaces (`AuthLoginResponse`, `AuthTokens`, `CurrentUser`) land in `packages/shared/src/auth/` so Phase 6's Axios client consumes the same types.
- `@zonite/shared` is already a workspace dep of `@zonite/backend` (verified in current `apps/backend/package.json`).

### II. Sikka Backend Parity (NON-NEGOTIABLE) — ✅ PASS

Cross-check of every mandatory reuse clause:

| Sikka mandate | Phase 2 plan |
| ------------- | ------------ |
| `successResponse()` / `errorResponse()` envelope | Vendored verbatim into `src/utils/response.handler.ts`; re-exports shape via `packages/shared`. |
| Pagination helpers | Vendored Sikka `PaginationQueryDto` + response `meta` shape; sits in `src/common/dto/`. |
| Auth module (JWT strategy, `JwtAuthGuard`, `@Public()`, `@CurrentUser()`, `FlexibleJwtGuard`, `RefreshTokenGuard`) | Full `modules/auth/` tree vendored: controllers, services, DTOs, decorators. No fork. |
| Module layout (controllers/services/dto/decorators with barrel `index.ts`, `{Module}{Op}Decorator` naming) | Followed in the vendored auth module and in the existing `health` reference module (refactored in this phase). |
| Env via Zod `env` object (`import { env } from "@/env"`) | Vendored `src/env.ts` schema; `@/*` path alias wired in `tsconfig.json`. |
| Scalar docs pipeline | Vendored `main.ts` Scalar block at `/api/docs`. |
| Global `ValidationPipe` + exception filter chain | Same `main.ts` settings (`whitelist`, `forbidNonWhitelisted`, `transform`); global filter normalizes all errors to Sikka envelope. |

### III. Yalgamers Design Fidelity — ✅ N/A for this phase

Backend-only; no UI surface. Phase 1 (`003-design-handoff`) handles this principle.

### IV. Authoritative Real-Time Server — ✅ N/A for this phase

No websocket gateway, no game state, no block claim. Phase 5 owns this principle.

### V. Spekit-Documented Decisions — ✅ PASS (gated on Phase 2 exit)

Five Speks produced during Phase 2 (FR-023, SC-009):

1. "Sikka backend architecture rules (Zonite variant)"
2. "How to extend a module safely"
3. "Environment variables reference (Zonite)"
4. "Response envelope and error shape"
5. "API documentation portal — how to add a new endpoint"

PR review gate: each merged PR that introduces a new module links a Spek (per Principle V).

### Gate outcome: **PASS — no violations, no Complexity Tracking entry required.**

### Post-Phase-1 re-check (after design artifacts written)

Re-evaluated after `data-model.md`, `contracts/`, `quickstart.md` landed below. No new violations introduced. **PASS.**

---

## Project Structure

### Documentation (this feature)

```text
specs/004-backend-foundation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── http-envelope.md
│   ├── auth.openapi.yaml
│   ├── health.openapi.yaml
│   └── rate-limit.md
├── checklists/
│   └── requirements.md  # From /speckit.specify
└── tasks.md             # /speckit.tasks output (not written here)
```

### Source Code (repository — Sikka-mirrored layout under `apps/backend/`)

```text
apps/backend/
├── src/
│   ├── main.ts                        # bootstrap: cookieParser, trust proxy, Validation, CORS, Scalar at /api/docs, log-level map
│   ├── app.module.ts                  # imports: ConfigModule-equivalent (Zod env), ThrottlerModule (global), DbModule, AuthModule, HealthModule
│   ├── env.ts                         # Zod-validated env; exports typed `env`
│   ├── db/
│   │   ├── index.ts                   # pg.Pool + drizzle(db, { schema })
│   │   ├── schema/
│   │   │   ├── index.ts               # barrel re-export
│   │   │   └── users.ts               # users table (id, email, passwordHash, role, createdAt, updatedAt, refreshTokenHash nullable)
│   │   └── migrations/                # drizzle-kit output (committed)
│   ├── common/
│   │   ├── index.ts
│   │   ├── decorators/
│   │   │   ├── index.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/
│   │   │   ├── index.ts
│   │   │   ├── pagination-query.dto.ts
│   │   │   └── responses.dto.ts       # SuccessResponse / ErrorResponse (re-exports from @zonite/shared)
│   │   ├── guards/
│   │   │   ├── index.ts
│   │   │   ├── jwt-auth.guard.ts      # reads @Public()
│   │   │   ├── flexible-jwt.guard.ts
│   │   │   ├── refresh-token.guard.ts
│   │   │   ├── refresh-token-cookie.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   ├── index.ts
│   │   │   ├── access-token.strategy.ts
│   │   │   ├── refresh-token.strategy.ts
│   │   │   └── refresh-token-cookie.strategy.ts
│   │   ├── filters/
│   │   │   ├── index.ts
│   │   │   └── all-exceptions.filter.ts  # single global filter → errorResponse()
│   │   ├── services/
│   │   │   ├── index.ts
│   │   │   └── email.service.ts       # nodemailer-backed; dev transport logs to console, prod uses SMTP from env
│   │   └── interceptors/
│   │       └── .gitkeep               # Sikka has this empty; preserve parity
│   ├── utils/
│   │   ├── index.ts
│   │   └── response.handler.ts        # successResponse / errorResponse (vendored verbatim)
│   ├── types/
│   │   ├── index.ts
│   │   └── http.ts                    # SuccessResponse<T> / ErrorResponse / ApiResponse (re-export from @zonite/shared)
│   ├── constants/
│   │   └── index.ts                   # JWT payload keys, rate-limit tier names
│   └── modules/
│       ├── health/                    # REFERENCE MODULE — refactored this phase
│       │   ├── health.module.ts
│       │   ├── controllers/
│       │   │   └── health.controller.ts
│       │   ├── services/
│       │   │   └── health.service.ts
│       │   ├── dto/
│       │   │   ├── index.ts
│       │   │   └── health.dto.ts
│       │   └── decorators/
│       │       ├── index.ts
│       │       └── health-get-endpoint.decorator.ts
│       └── auth/
│           ├── auth.module.ts
│           ├── controllers/
│           │   └── auth.controller.ts
│           ├── services/
│           │   └── auth.service.ts
│           ├── dto/
│           │   ├── index.ts
│           │   ├── signup.dto.ts
│           │   ├── login.dto.ts
│           │   ├── refresh-token.dto.ts
│           │   ├── logout.dto.ts
│           │   ├── logout-cookie.dto.ts
│           │   ├── send-otp.dto.ts
│           │   ├── verify-otp.dto.ts
│           │   ├── reset-password.dto.ts
│           │   ├── change-password.dto.ts
│           │   ├── auth-response.dto.ts
│           │   └── auth-response.interface.ts
│           └── decorators/
│               ├── index.ts
│               ├── signup-endpoint.decorator.ts
│               ├── login-endpoint.decorator.ts
│               ├── logout-endpoint.decorator.ts
│               ├── refresh-token-endpoint.decorator.ts
│               ├── send-otp-endpoint.decorator.ts
│               ├── verify-otp-endpoint.decorator.ts
│               ├── reset-password-endpoint.decorator.ts
│               └── change-password-endpoint.decorator.ts
├── test/
│   └── auth.e2e-spec.ts               # the Phase 2 smoke e2e (walks the full auth loop)
├── drizzle.config.ts                  # points at src/db/schema/index.ts, migrations out src/db/migrations
├── nest-cli.json
├── package.json                       # augmented with the deps listed in Technical Context
├── tsconfig.json                      # extends ../../tsconfig.base.json; @/* → src/*
└── Dockerfile                         # already present from Phase 0

packages/shared/
└── src/
    ├── http/
    │   ├── envelope.ts                # SuccessResponse<T>, ErrorResponse, ApiResponse (exact Sikka shape)
    │   ├── pagination.ts              # PaginationQuery, PaginationMeta, PaginatedResponse<T>
    │   └── index.ts
    ├── auth/
    │   ├── tokens.ts                  # AuthTokens, AccessTokenPayload, RefreshTokenPayload
    │   ├── user.ts                    # CurrentUser (safe, non-secret projection)
    │   └── index.ts
    └── index.ts                       # re-exports http + auth
```

**Structure Decision**: Web service, `apps/backend/` only. The layout **mirrors Sikka's `src/` tree 1:1** at directory level (root files: `main.ts`, `app.module.ts`, `env.ts`; subdirs: `db/`, `common/`, `utils/`, `types/`, `constants/`, `modules/`; `common/` children match Sikka's `decorators/ dto/ guards/ strategies/ services/ interceptors/` plus one addition: `filters/` which Sikka has scattered — normalized here for clarity and documented in the Spek). SC-008's structural-diff check is the acceptance gate for this decision.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified.**

**No Constitution violations. Table intentionally empty.**

One explicit-but-constitutional deviation worth calling out for Phase 2 readers:

| Note | Why | Rejected alternative |
| ---- | --- | -------------------- |
| `common/filters/` directory created (Sikka sprinkles filter files without a dedicated folder). | Having one home for the global exception filter plus future WS filter (Phase 5) is cheaper to document in the Spek than tracing scattered files. | Matching Sikka's exact file placement was considered; rejected because the *behavior* is identical and the Spek pins the deviation explicitly — Principle II's "no reinvention" is about patterns, not pixel-identical file locations. |

---

## Phase 0 / Phase 1 artifacts

Written alongside this plan in the same `/speckit.plan` run:

- [research.md](research.md) — decisions, rationales, alternatives
- [data-model.md](data-model.md) — `users` table, envelope shapes, auth payloads, throttler config
- [contracts/](contracts/) — HTTP envelope spec, auth OpenAPI, health OpenAPI, rate-limit policy
- [quickstart.md](quickstart.md) — bring-up instructions, verification walkthrough

Agent context file (`CLAUDE.md` at repo root) updated to reflect Phase 2's active technologies.
