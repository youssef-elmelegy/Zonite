# Zonite

Real-time block-claiming multiplayer game.

- React + NestJS + Socket.io, TypeScript end-to-end.
- Built on [Yalgamers](../yalgamer-e-sport-frontend/) design tokens.
- Backend extends the [Sikka Platform Backend](/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend) patterns.

## Prerequisites

- **Node.js 22 LTS** (see `.nvmrc`)
- **pnpm 9.x** (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Docker + Docker Compose v2** (Docker Desktop, OrbStack, or native Docker)

Windows contributors: use WSL2.

## Quickstart

```bash
git clone <repo-url> zonite
cd zonite
cp .env.example .env
pnpm install
docker compose up --build
```

Then:

- Backend: `curl http://localhost:3000/api/health`
- Frontend: open <http://localhost:5173/>

Full acceptance script: [`specs/001-foundation-setup/quickstart.md`](./specs/001-foundation-setup/quickstart.md).

## Design system

The visual design for Zonite ships as a Claude Design handoff bundle at
[docs/design/zonite-game/](./docs/design/zonite-game/). Start there before
touching any frontend UI code:

- [Handoff README](./docs/design/zonite-game/README.md) — how to read the bundle.
- [Token source of truth](./apps/frontend/src/styles/tokens.css) — the only
  place color, font, spacing, radius, shadow, and breakpoint values live.
- [Override policy](./docs/design/OVERRIDE_POLICY.md) — when to add tokens vs.
  when a local exception is allowed.
- [Handoff version manifest](./docs/design/HANDOFF_VERSION.md) — what version
  of the bundle this repo has adopted.

## Project Governance

- **Ruleset (constitution)**: [`.specify/memory/constitution.md`](./.specify/memory/constitution.md)
- **Phased roadmap**: [`PLAN.md`](./PLAN.md)
- **Phase 0 spec + plan + tasks**: [`specs/001-foundation-setup/`](./specs/001-foundation-setup/)
- **Spekit Dev Hub** (decision log): `<SPEKIT_TOPIC_URL>` _(Phase 0.4 — pending)_

## Monorepo layout

- `apps/backend/` — NestJS 11 backend (Sikka-style modules)
- `apps/frontend/` — Vite + React 18 frontend
- `packages/shared/` — cross-wire types, enums, socket event names (single source of truth)

## Core commands

| Command           | What it does                                                |
| ----------------- | ----------------------------------------------------------- |
| `pnpm install`    | Install all workspace deps                                  |
| `pnpm dev`        | `docker compose up --build` (backend + frontend + postgres) |
| `pnpm type-check` | `tsc --noEmit` across all three packages                    |
| `pnpm lint`       | ESLint on the whole workspace                               |
| `pnpm format`     | Prettier                                                    |
