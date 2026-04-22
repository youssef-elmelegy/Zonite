# Implementation Plan: Foundation & Project Setup (Phase 0)

**Branch**: `001-foundation-setup` | **Date**: 2026-04-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-foundation-setup/spec.md`

## Summary

Stand up a pnpm monorepo with three workspace packages (`apps/backend`, `apps/frontend`,
`packages/shared`), a Docker Compose local-dev stack (PostgreSQL + backend hot-reload +
Vite frontend), a shared TypeScript contract package containing all cross-wire types and
socket event names, and a minimal CI pipeline enforcing install + lint + type-check on
every PR. The backend exposes a single `GET /api/health` endpoint wrapped in the Sikka
base success-response envelope, so the health probe also validates the `/api` prefix
and the mandatory response wrapper. Node 22 LTS and TypeScript ^5.7 are pinned at the
repo root. No test tooling, no auth, no game logic — only the container later phases
fill.

## Technical Context

**Language/Version**: TypeScript ^5.7 (pinned at repo root, inherited by all packages).
Runtime: Node.js 22 LTS (pinned via `.nvmrc` + root `engines.node`).

**Primary Dependencies**:

- Root: `pnpm@9.x` workspaces, `typescript@~5.7`, `eslint@^9`, `prettier@^3`,
  `husky@^9`, `lint-staged@^15`.
- `apps/backend`: `@nestjs/core@^11`, `@nestjs/common@^11`, `@nestjs/platform-express@^11`
  (matches Sikka). A placeholder `AppModule` with a single `HealthModule` exposing
  `GET /api/health` returning the Sikka success envelope. No DB client, no auth in
  Phase 0 beyond a Zod-validated `env.ts` stub.
- `apps/frontend`: `vite@^5`, `react@^18`, `react-dom@^18`. No routing, no state
  libraries, no Tailwind yet — those land in Phase 6 / Phase 1. A single placeholder
  route rendering "Zonite — Phase 0 OK".
- `packages/shared`: zero runtime deps; pure TypeScript exports.

**Storage**: PostgreSQL 16 as a Docker Compose service reachable from the backend.
Phase 0 does not run migrations, define schemas, or read/write data — it only verifies
that the container is up and the backend can open a TCP connection on bring-up.

**Testing**: Out of scope for Phase 0 per Clarification #4. No Jest, Vitest, or
Supertest dependencies installed. First test arrives with the phase that needs it.

**Target Platform**: Linux + macOS developer laptops for local dev (Docker Desktop,
OrbStack, or native Docker). Windows contributors are expected to use WSL2. Production
deployment target is not decided in Phase 0.

**Project Type**: Web application — TypeScript monorepo with a NestJS backend, a Vite
React frontend, and a shared contract package, per the Constitution's Technology &
Architectural Constraints section.

**Performance Goals**:

- Cold-clone → healthy local stack in ≤10 minutes on a machine that already meets
  prerequisites (spec SC-001).
- Monorepo-wide type-check completes in ≤60 seconds locally on a typical laptop
  (spec SC-004).

**Constraints**:

- No Redis, no message broker, no service beyond PostgreSQL + backend + frontend in
  the local-dev stack (spec FR-012; Constitution).
- The Sikka base success-response envelope is the only allowed HTTP response shape
  (Constitution Principle II) — exercised by `GET /api/health` from day one.
- Every cross-wire type and event name MUST live in `packages/shared` (Constitution
  Principle I) — enforced by review and by the fact that the backend/frontend have no
  local duplicates.
- `.env.example` copied to `.env` without edits MUST be sufficient to boot the stack
  (spec FR-014), so no external credentials sit in the default path.

**Scale/Scope**:

- 3 workspace packages, 1 `pnpm-lock.yaml`, 1 `docker-compose.yml`, 1 README,
  1 `.env.example`, 1 CI workflow, 4 seed Speks.
- Approximate surface area: <30 source files total at Phase 0 completion, the bulk
  of them configuration.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Evaluated against [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
v1.0.0.

### Principle I — Shared Contract Source of Truth

- **Compliant.** `packages/shared` is introduced in this phase as the ONLY place
  cross-wire types, enums, and event-name constants live. Spec FR-005..FR-008 enforce
  this; backend and frontend import via `workspace:*`. Phase 0 itself does not add any
  cross-wire payloads yet — the package is set up with skeleton modules (`room-config`,
  `game-state`, `player`, `block`, `team`, enums, `events`) so later phases only add
  fields, never create new duplicates.

### Principle II — Sikka Backend Parity (NON-NEGOTIABLE)

- **Compliant.** The backend in Phase 0 mirrors the Sikka module structure (a
  `HealthModule` under `src/modules/health/` with `controllers/`, `services/`, `dto/`,
  `decorators/`). `GET /api/health` returns via `successResponse(...)` ported from
  Sikka's `src/utils/response.handler.ts`. The global `/api` prefix, `ValidationPipe`
  configuration, and exception filter wiring are copied from Sikka's `main.ts`
  bootstrap. Env access goes through a Zod-validated `env.ts` module from day one (even
  though Phase 0 reads only `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`).
- **Deferred (documented)**: auth module, pagination helpers, Drizzle schemas, Scalar
  docs registration beyond a stub. These land in Phases 2–3 per the Constitution's own
  phasing. A Spek "Sikka backend architecture rules" is seeded in Phase 0 so Phase 2
  has the reference material it needs.

### Principle III — Yalgamers Design Fidelity

- **Compliant (Phase 0 scope).** The frontend app is scaffolded but ships a placeholder
  page, not game UI. No ad-hoc colors are committed. Token extraction is Phase 1 work;
  Phase 0 deliberately installs **zero** styling libraries (no Tailwind, no
  `tailwind-merge`) to avoid committing token shapes before they are extracted from
  Yalgamer. The placeholder page uses the app background via a single inline style — a
  temporary exemption documented in a "Phase 0 exemptions" Spek and removed in Phase 1.

### Principle IV — Authoritative Real-Time Server

- **Not exercised (out of scope).** Phase 0 ships no socket gateway, no game state, and
  no real-time endpoints. The guardrails land in Phases 4–5. Phase 0 does not open this
  surface, so it cannot violate the principle.

### Principle V — Spekit-Documented Decisions

- **Compliant.** Phase 0 creates the "Zonite Dev Hub" Topic and seeds 4 Speks (repo
  structure, local dev, env variables, shared package contract). The README links the
  Topic. Spec FR-019..FR-022 make this a hard gate for Phase 0 completion. An
  additional Spek "Phase 0 exemptions" records the two temporary deviations (no
  Tailwind yet, no tests yet) so Phase 1 and later phases know what to close.

### Technology & Architectural Constraints

- **Compliant.** Monorepo: pnpm workspaces ✓. Three workspace packages ✓. Root ESLint +
  Prettier + Husky + lint-staged ✓. Docker Compose with PostgreSQL + backend + frontend
  and nothing else ✓. Path aliases `@/*` → `src/*` in each app's `tsconfig.json` ✓.
  Naming conventions (kebab-case files, UPPER_SNAKE_CASE constants, `/api/<kebab>`
  routes) locked in by ESLint config ✓.

### Gate result

**PASS (pre-design)** — no violations requiring Complexity Tracking entries.

### Post-design re-check (after Phase 1 artifacts)

Re-evaluated after generating `research.md`, `data-model.md`, `contracts/health.http.md`,
`contracts/shared-package.md`, and `quickstart.md`:

- Principle I: **still compliant.** The `@zonite/shared` export surface contract
  explicitly forbids deep imports and duplicate declarations; `pnpm type-check`
  surfaces any cross-wire duplication.
- Principle II: **still compliant.** The `GET /api/health` contract pins the Sikka
  envelope byte-for-byte (fields, order, types); Research §7 mandates porting
  `response.handler.ts` verbatim.
- Principle III: **unchanged** — exempt via Spek until Phase 1.
- Principle IV: **still not exercised** — no gateway artifacts produced.
- Principle V: **still compliant** — four seed Speks plus the "Phase 0 exemptions"
  Spek are planned deliverables of this phase.

**Still PASS.** No new Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-setup/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── health.http.md      # GET /api/health contract
│   └── shared-package.md   # Shared-package export surface contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (repository root)

```text
zonite/
├── .github/
│   └── workflows/
│       └── ci.yml                         # install → lint → type-check on PR
├── .husky/
│   └── pre-commit                         # runs lint-staged
├── .specify/                              # (already present; governance tooling)
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts                    # bootstrap, /api prefix, CORS, ValidationPipe
│   │   │   ├── app.module.ts              # imports HealthModule + ConfigModule(env)
│   │   │   ├── env.ts                     # Zod-validated env (Sikka pattern)
│   │   │   ├── common/
│   │   │   │   ├── dto/
│   │   │   │   │   └── responses.dto.ts   # SuccessResponseDto<T>, ErrorResponseDto
│   │   │   │   └── utils/
│   │   │   │       └── response.handler.ts # successResponse / errorResponse
│   │   │   └── modules/
│   │   │       └── health/
│   │   │           ├── health.module.ts
│   │   │           ├── controllers/
│   │   │           │   └── health.controller.ts
│   │   │           ├── services/
│   │   │           │   └── health.service.ts
│   │   │           ├── dto/
│   │   │           │   ├── health-response.dto.ts
│   │   │           │   └── index.ts
│   │   │           └── decorators/
│   │   │               └── health-check-endpoint.decorator.ts
│   │   ├── Dockerfile                     # dev target (pnpm + nest start --watch)
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json                  # extends tsconfig.base.json
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx
│       │   └── App.tsx                    # placeholder "Zonite — Phase 0 OK"
│       ├── index.html
│       ├── vite.config.ts
│       ├── Dockerfile                     # dev target (pnpm + vite dev)
│       ├── tsconfig.json                  # extends tsconfig.base.json
│       └── package.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts                   # single barrel
│       │   ├── enums/
│       │   │   ├── game-status.enum.ts
│       │   │   ├── game-mode.enum.ts
│       │   │   └── team-color.enum.ts
│       │   ├── events/
│       │   │   ├── game-events.enum.ts
│       │   │   ├── room-events.enum.ts
│       │   │   └── index.ts
│       │   └── types/
│       │       ├── room-config.type.ts
│       │       ├── game-state.type.ts
│       │       ├── player.type.ts
│       │       ├── block.type.ts
│       │       └── team.type.ts
│       ├── tsconfig.json
│       └── package.json                   # "main" + "types" point into src via TS paths
├── .editorconfig
├── .env.example
├── .gitignore
├── .lintstagedrc.js
├── .nvmrc                                 # 22
├── .prettierrc
├── docker-compose.yml
├── eslint.config.mjs                      # flat config, shared
├── package.json                           # root; scripts: dev, type-check, lint, format
├── pnpm-lock.yaml
├── pnpm-workspace.yaml                    # apps/*, packages/*
├── README.md
└── tsconfig.base.json                     # strict, ES2022, paths: @shared/* → packages/shared/src/*
```

**Structure Decision**: Web-application layout (Option 2 in the template), concretely
realized as a pnpm monorepo with one backend app, one frontend app, and one shared
contract package. The backend module structure (`modules/<feature>/{controllers,
services,dto,decorators}`) is copied verbatim from Sikka to satisfy Constitution
Principle II — the single feature module present in Phase 0 (`health`) is a reference
implementation for every future module.

## Complexity Tracking

> No Constitution Check violations requiring justification. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
