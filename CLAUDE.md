# zonite Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-25

## Active Technologies

- TypeScript ^5.7 (root-pinned from Phase 0, strict mode on). Runtime: Node.js 22 LTS (pinned via `.nvmrc`). (003-design-handoff)
- N/A. Phase 1 is frontend-only; no DB migrations, no backend code touched. (003-design-handoff)
- TypeScript ^5.7 (strict, pinned at repo root via `tsconfig.base.json`), Node.js 22 LTS (pinned via `.nvmrc`). (004-backend-foundation)
- PostgreSQL (from Phase 0's `docker-compose.yml`). Drizzle-kit migrations under `apps/backend/src/db/migrations/`; schema under `apps/backend/src/db/schema/`; connection via `pg.Pool` → `drizzle()` with `env.DATABASE_URL`. (004-backend-foundation)
- TypeScript ^5.7 (strict), Node.js 22 LTS (004-backend-foundation)
- Browser `localStorage` via `zustand/middleware/persist` (auth store only) (004-backend-foundation)
- PostgreSQL. Drizzle migrations under `apps/backend/src/db/migrations/`. Two new migrations: (004-backend-foundation)
- TypeScript ^5.7 strict (Node 22 LTS, pinned via `.nvmrc`) + NestJS 11 (backend), Vite + React 18 (frontend), Socket.io, Drizzle ORM, Zustand, `packages/shared` (shared contract) (004-backend-foundation)
- PostgreSQL (existing schema — no new tables for Phase 8); in-memory `Map<roomId, GameState>` for live sessions (004-backend-foundation)

- TypeScript ^5.7 (pinned at repo root, inherited by all packages). (001-foundation-setup)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript ^5.7 (pinned at repo root, inherited by all packages).: Follow standard conventions

## Recent Changes

- 004-backend-foundation: Added TypeScript ^5.7 strict (Node 22 LTS, pinned via `.nvmrc`) + NestJS 11 (backend), Vite + React 18 (frontend), Socket.io, Drizzle ORM, Zustand, `packages/shared` (shared contract)
- 004-backend-foundation: Added TypeScript ^5.7 (strict), Node.js 22 LTS
- 004-backend-foundation: Added TypeScript ^5.7 (strict), Node.js 22 LTS

<!-- MANUAL ADDITIONS START -->

## Zonite project — essentials

Real-time block-claiming multiplayer game. TypeScript monorepo (pnpm workspaces):

- `apps/backend/` — NestJS 11, extends [Sikka Platform Backend](/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend) patterns (response envelope, pagination, auth, env).
- `apps/frontend/` — Vite + React 18, styled from [Yalgamer frontend](/media/jo/store/youssef/projects/yal-gaming/yalgamer-e-sport-frontend/) design tokens.
- `packages/shared/` — cross-wire types, enums, socket event names. **Single source of truth**.

Runtime pinned: Node 22 LTS (`.nvmrc`), TypeScript ^5.7 (root).

## Authoritative documents

- [.specify/memory/constitution.md](.specify/memory/constitution.md) — project ruleset (v1.0.0). Five principles: Shared Contract, Sikka Parity, Yalgamers Fidelity, Authoritative Real-Time Server, Spekit Docs.
- [PLAN.md](PLAN.md) — phased roadmap (Phases 0–8).
- `specs/001-foundation-setup/` — Phase 0 spec + plan + research + data model + contracts + quickstart.

## Hard rules (from the constitution)

- Every cross-wire type/event name → `packages/shared` (Principle I). No duplicates in apps.
- Backend MUST use Sikka's `successResponse()` / `errorResponse()` envelope, Sikka pagination, Sikka auth, Sikka env — no parallel systems (Principle II).
- Frontend styling via Yalgamers tokens only — no hard-coded hex/fonts outside the token file (Principle III).
- In-memory game state on server is authoritative; client is a view; every socket handler is JWT-guarded (Principle IV).
- Every architectural decision → a Spek in the "Zonite Dev Hub" Topic (Principle V).

## Commands (root)

- `pnpm install` — install all workspace deps
- `pnpm dev` — `docker compose up --build` (backend + frontend + postgres)
- `pnpm type-check` — `tsc --noEmit` across all three packages (≤60 s target)
- `pnpm lint` — ESLint on the whole workspace
- `pnpm format` — Prettier

## Phase 0 scope boundaries (so you don't over-build)

**Out of scope**: auth, tests, Tailwind/design tokens, Drizzle schemas, socket gateway, game logic. These land in Phases 1–8.

**In scope**: monorepo scaffold, Docker Compose, `packages/shared` skeletons, `GET /api/health` with Sikka envelope, husky pre-commit, minimal CI (install/lint/type-check).

<!-- MANUAL ADDITIONS END -->
