# Phase 0 Research — Foundation & Project Setup

**Feature**: Foundation & Project Setup (Phase 0)
**Date**: 2026-04-17
**Status**: All unknowns resolved; plan may advance to Phase 1 (Design & Contracts).

This document records the design decisions that back the Implementation Plan. The
spec's five Clarifications already locked in package manager, CI scope, health
endpoint, test-tooling scope, and Node/TypeScript versions. The items below resolve
the remaining design unknowns — all of them about **how** to satisfy the spec given
those commitments.

---

## 1. Shared package consumption: TypeScript project references vs path aliases

**Decision**: Use **TypeScript path aliases** (`@zonite/shared/*` → `packages/shared/src/*`)
configured once in `tsconfig.base.json`, extended by each workspace package. Do NOT
use TypeScript project references (`composite: true` + `references: []`) in Phase 0.

**Rationale**:

- Paths keep the consumer experience identical to Sikka's `@/*` alias — contributors
  already know the pattern.
- `tsc --noEmit` with paths is enough for the monorepo-wide type-check required by
  FR-017 and measured by SC-004 (≤60 s).
- Project references add build-ordering machinery (`tsc --build`) that Phase 0 does
  not need and Vite + NestJS loaders do not use natively.
- If Phase 6's frontend build or Phase 2's NestJS SWC build later benefit from
  incremental composite builds, the migration is additive (add `composite: true` and
  `references`) — no structural change.

**Alternatives considered**:

- _Project references from day one_: gives incremental TS builds but doubles config
  surface area and requires `tsc -b` discipline in CI. Rejected as premature.
- _Publishing the shared package to a private registry_: defeats the monorepo
  motivation and adds a release step. Rejected.
- _`workspace:_`with a compiled`dist/`\*: forces a build step before typecheck.
  Rejected as slower local dev loop.

---

## 2. Monorepo entry in `packages/shared/package.json`

**Decision**: Consumers import from source. `packages/shared/package.json` declares
`"main": "./src/index.ts"`, `"types": "./src/index.ts"`, and `"exports": { ".": {
"types": "./src/index.ts", "default": "./src/index.ts" } }`. No build step. Vite and
NestJS's `ts-node`/SWC loader both resolve TypeScript directly thanks to the
`@zonite/shared/*` path alias.

**Rationale**:

- Matches Constitution Principle I's "consumed directly from the workspace" mandate
  (spec FR-003).
- Zero-build shared package = zero lag between "edit a shared type" and "backend
  re-typechecks."
- Vite handles `.ts` imports from workspace dependencies when the path alias points
  into them (verified pattern).

**Alternatives considered**:

- _Build `packages/shared` to `dist/` before use_: adds a pnpm hook + watch process.
  Rejected — unnecessary in Phase 0 and contradicts the "normal install resolves it"
  test in spec User Story 2.
- _Separate `types` field pointing at `.d.ts`_: only useful when shipping compiled
  JS; not applicable here.

---

## 3. NestJS hot reload inside Docker

**Decision**: `apps/backend` runs in a Docker container via a dev-target `Dockerfile`
that: installs pnpm, mounts the repo as a bind mount, and runs `pnpm --filter
@zonite/backend start:dev` which invokes `nest start --watch`. Polling is enabled
(`CHOKIDAR_USEPOLLING=true`) only when the container filesystem indicates a bind-mount
from host (Linux bind mounts sometimes need it).

**Rationale**:

- Matches Sikka's `start:dev` script exactly, so contributors switching between repos
  have identical muscle memory.
- `nest start --watch` rebuilds only changed TS files — plenty fast for Phase 0.
- Polling is opt-in; on systems where inotify works (native Linux, recent Docker
  Desktop on macOS) it stays off, keeping CPU idle.

**Alternatives considered**:

- _Run backend on host, only DB in Docker_: simpler I/O but breaks the "one command"
  bring-up test and means contributors must install Node + pnpm before they can boot
  anything. Rejected — `.nvmrc` already tells them the Node version, but the container
  removes even that friction.
- _SWC-based watch mode_: marginally faster but diverges from Sikka. Revisit in
  Phase 2 if build time becomes a complaint.

---

## 4. Vite dev server inside Docker

**Decision**: `apps/frontend` runs `vite dev --host 0.0.0.0 --port 5173` inside a
dev-target Docker container. `vite.config.ts` sets `server.host: true` and
`server.hmr.clientPort: 5173` to make HMR work through the Docker port mapping.

**Rationale**:

- Default Vite binds to `127.0.0.1`, which is unreachable from outside the container.
  `--host 0.0.0.0` is the standard fix.
- `server.hmr.clientPort` lets the browser know which port to use for the WS upgrade
  when the host-mapped port differs from the container port (here they match, but the
  setting documents the expected invariant).

**Alternatives considered**:

- _Use host networking (`network_mode: host`)_: works on Linux but not macOS. Rejected
  — portability over convenience.
- _Run Vite on host, backend in Docker_: same portability argument as #3. Rejected
  for consistency.

---

## 5. Docker Compose service topology

**Decision**: `docker-compose.yml` defines three services — `postgres` (image
`postgres:16-alpine`), `backend` (build `./apps/backend` dev target), `frontend`
(build `./apps/frontend` dev target). `backend` depends on `postgres` with a
healthcheck; `frontend` does not depend on `backend` (so frontend devs who don't touch
the API can boot only what they need). All services share a single user-defined bridge
network `zonite-net`, so the backend can reach Postgres at `postgres:5432` and the
frontend can proxy `/api` to `backend:3000`.

**Rationale**:

- Keeps the spec's "no Redis, no broker" promise (FR-012).
- PostgreSQL 16 matches the Drizzle ORM version the Sikka reference project uses
  (`drizzle-orm ^0.44`, `pg ^8.16`), reducing Phase 2 friction.
- Healthcheck on Postgres (`pg_isready`) + `depends_on.condition: service_healthy`
  ensures the backend waits for DB readiness, satisfying the "backend can open a TCP
  connection" bring-up expectation without racing.
- Alpine images keep the cold-pull fast on a contributor's first boot (helps SC-001).

**Alternatives considered**:

- _Host Postgres (`brew install postgresql`, `apt install postgresql`)_: breaks the
  one-command bring-up. Rejected.
- _Dev Container (`.devcontainer/`) instead of Docker Compose_: VS Code-specific; the
  Constitution does not assume a particular editor. Rejected.
- _Mount Postgres data to a named volume_: **Accepted**; included in the compose file
  so dev data persists across `docker compose down`. A `make reset` equivalent
  (`pnpm db:reset`) will drop and recreate the volume when needed, but that script
  lands in Phase 3 with the first real schema.

---

## 6. Environment variables + Zod validation

**Decision**: Port the Sikka pattern — an `apps/backend/src/env.ts` module defines a
Zod schema and exports a frozen `env` object. `main.ts` imports it first, so any
invalid env crashes the bootstrap with a readable error. Phase 0 reads only:

| Var                 | Purpose                                 | Default in `.env.example`                         |
| ------------------- | --------------------------------------- | ------------------------------------------------- |
| `NODE_ENV`          | `development` \| `production` \| `test` | `development`                                     |
| `PORT`              | backend listen port                     | `3000`                                            |
| `DATABASE_URL`      | Postgres connection string              | `postgresql://zonite:zonite@postgres:5432/zonite` |
| `CORS_ORIGINS`      | comma-separated origins for CORS        | `http://localhost:5173`                           |
| `VITE_API_BASE_URL` | frontend API target (read by Vite)      | `http://localhost:3000/api`                       |

Frontend env is read through Vite's `import.meta.env.VITE_*` convention and is **not**
validated by Zod in Phase 0 — only the backend boot path is.

**Rationale**:

- Matches Sikka's `import { env } from "@/env"` contract (Constitution Principle II).
- The variables in the table are the minimum set that makes the spec's acceptance
  scenarios testable — each one is actually read by the code that ships in Phase 0.
- Safe defaults everywhere: copying `.env.example` → `.env` boots a working stack
  (spec FR-014).

**Alternatives considered**:

- _`@nestjs/config` with `validationSchema` (class-validator)_: idiomatic NestJS but
  Sikka uses Zod. Matching Sikka wins. (Constitution Principle II.)
- _Validate frontend env in Phase 0_: adds a dev dependency (`zod`) to the frontend
  for one variable. Deferred until Phase 6 adds multiple vars.

---

## 7. Shared response envelope + utilities

**Decision**: Port `src/utils/response.handler.ts` and `src/common/dto/responses.dto.ts`
from Sikka **byte-for-byte** into `apps/backend/src/common/`. Do not rename, do not
"improve." The `HealthController` uses these utilities immediately, and every future
Zonite module MUST do the same (enforced by review per Constitution Principle II).

**Rationale**:

- Exact parity with Sikka means a contributor reading Sikka's `CLAUDE.md` can drop
  into Zonite with zero retraining.
- `GET /api/health` as the first consumer proves the pipeline is wired correctly
  before any domain logic is written.

**Alternatives considered**:

- _Redesign the envelope for Zonite_: violates Principle II. Rejected.
- _Put the utilities in `packages/shared`_: tempting for cross-app reuse, but the
  envelope is server-specific (it includes exception class names in the error case
  that the frontend should not import). Belongs in the backend `common/` folder.

---

## 8. ESLint v9 flat config, shared across workspace

**Decision**: Single `eslint.config.mjs` at the repo root, using ESLint v9 flat
config. It defines three layered rule sets: (1) base rules for all TypeScript files,
(2) `apps/backend/**` overlay with NestJS-friendly rules (copied from Sikka's
`eslint.config.mjs`), (3) `apps/frontend/**` overlay with React-friendly rules
(copied from Yalgamer's frontend). Prettier is integrated via `eslint-plugin-prettier`

- `eslint-config-prettier`, again matching Sikka.

**Rationale**:

- Single source of truth for formatting/lint rules (spec FR-015).
- Layered overrides let backend and frontend have framework-specific rules without
  duplicating the base config.
- Staying on the exact plugin versions Sikka uses (`eslint@^9.18`,
  `eslint-plugin-prettier@^5.2`) prevents "Sikka rule X fails in Zonite" headaches
  when Phase 2 ports backend code.

**Alternatives considered**:

- _Per-package ESLint configs_: encourages drift. Rejected.
- _Biome instead of ESLint + Prettier_: faster, but Sikka and Yalgamer both use
  ESLint/Prettier. Constitutional alignment beats raw speed here.

---

## 9. Pre-commit hook mechanism

**Decision**: Husky v9 (matches Sikka's `husky@^9.1.7`) + lint-staged v15. The hook
runs `pnpm lint-staged`, which applies ESLint `--fix` + Prettier to staged
`*.{ts,tsx,js,jsx,md,json,yml}` files. Configuration lives in `.lintstagedrc.js` at
root.

**Rationale**:

- Spec FR-016 demands per-file, pre-commit enforcement. Husky + lint-staged is the
  ecosystem-standard answer and the one Sikka already uses.
- Keeping the hook minimal (format + lint only) keeps commits fast; type-check stays
  in CI and the developer's manual loop.

**Alternatives considered**:

- _Run full type-check in pre-commit_: slows commits unacceptably on a large diff.
  Rejected.
- _lefthook or pre-commit (Python)_: different dependency surface; no win over Husky.
  Rejected.

---

## 10. CI runner choice

**Decision**: **GitHub Actions**. A single workflow file
`.github/workflows/ci.yml` triggered on `pull_request` and `push` to the default
branch. Steps: checkout → setup Node 22 (via `actions/setup-node@v4` reading
`.nvmrc`) → enable pnpm via `pnpm/action-setup@v4` → `pnpm install --frozen-lockfile`
→ `pnpm lint` → `pnpm type-check`.

**Rationale**:

- GitHub is already the team's code host; adding another CI vendor is unnecessary.
- `--frozen-lockfile` catches dependency drift between `package.json` and
  `pnpm-lock.yaml`, surfacing it in PR review (a common source of broken main).
- No test stage, no matrix — matches the "kept simple" qualifier on the minimal-CI
  clarification.

**Alternatives considered**:

- _GitLab CI_: Yalgamer has a `.gitlab-ci.yml` but Sikka does not use GitLab. The
  codebase lives on GitHub per the existing workflow. Rejected.
- _Per-package workflows_: adds noise without isolating failures better than job
  steps do. Rejected.

---

## 11. Zonite scope vs Constitution roadmap — what Phase 0 exempts

**Decision**: Phase 0 ships with two documented exemptions from the full Constitution
surface, both recorded in a "Phase 0 exemptions" Spek:

1. **Styling (Principle III)**: no Tailwind, no `design-tokens.ts`, no
   `components/ui/`. The frontend renders a placeholder page with a single inline
   style. Phase 1 removes the exemption by extracting Yalgamer tokens.
2. **Tests**: no test frameworks installed (per spec Clarification #4). First test
   phase re-enables the toolchain.

**Rationale**:

- Explicitly naming exemptions avoids the "it's not done but no one said so" failure
  mode. Spekit is already the system of record (Principle V), so one more Spek
  costs nothing and gives reviewers a closeable checklist.
- Principles I, II (to the extent it applies in Phase 0), IV (not yet exercised),
  and V are fully in force.

**Alternatives considered**:

- _Silent deviation_: violates Principle V's review obligation. Rejected.
- _Do everything in Phase 0_: contradicts PLAN.md's phasing and turns Phase 0 into
  months. Rejected.

---

## Open Questions

None. Every NEEDS CLARIFICATION from the Technical Context has been resolved above or
was explicitly deferred to a later phase by the Constitution's own phasing (Phases 1–8).

## Ready for Phase 1

Yes. Proceed to generate `data-model.md`, `contracts/`, and `quickstart.md`.
