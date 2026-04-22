# zonite Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-22

## Active Technologies
- TypeScript ^5.7 (root-pinned from Phase 0, strict mode on). Runtime: Node.js 22 LTS (pinned via `.nvmrc`). (003-design-handoff)
- N/A. Phase 1 is frontend-only; no DB migrations, no backend code touched. (003-design-handoff)
- TypeScript ^5.7 (strict, pinned at repo root via `tsconfig.base.json`), Node.js 22 LTS (pinned via `.nvmrc`). (004-backend-foundation)
- PostgreSQL (from Phase 0's `docker-compose.yml`). Drizzle-kit migrations under `apps/backend/src/db/migrations/`; schema under `apps/backend/src/db/schema/`; connection via `pg.Pool` → `drizzle()` with `env.DATABASE_URL`. (004-backend-foundation)

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
- 004-backend-foundation: Added TypeScript ^5.7 (strict, pinned at repo root via `tsconfig.base.json`), Node.js 22 LTS (pinned via `.nvmrc`).
- 003-design-handoff (Phase 1 — Design Handoff Adoption): Adopted the Claude Design handoff bundle verbatim at `docs/design/zonite-game/` (18 files, SHA256 gated by `scripts/verify-handoff.mjs`). Installed `apps/frontend/src/styles/tokens.css` as a verbatim copy of the handoff's `colors_and_type.css` with only the `@import` → self-hosted `@font-face` rewire applied; added `overlays.css` for translucent derivations (so no raw `rgba(...)` leaks outside the token files). Shipped 19 primitives (Shell/TopBar/CornerBlobs/GridBg, PlayerChip/Countdown/icons barrel with brand + Lucide uniformly `Icon*`-prefixed, 11 UI, GridCell) all consuming tokens. Added the dev-only `/_showcase` route (tokens/layout/ui/common/game/animations sections + reduced-motion toggle + axe-core panel) that tree-shakes from the production bundle. Added Tailwind v3 (Preflight disabled, theme wraps tokens via `var(--x)`), a `color-no-hex` stylelint rule, and a custom `no-hex-in-jsx` ESLint rule. Self-hosted Mulish/Inter/Bruno Ace SC `.woff2`. Runtime: Node.js 22 LTS (`.nvmrc`), TypeScript ^5.7 (strict).

- 001-foundation-setup: Added TypeScript ^5.7 (pinned at repo root, inherited by all packages).

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
