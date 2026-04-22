<!--
Sync Impact Report
==================
Version change: 0.0.0 (template placeholders) → 1.0.0 (initial ratification)
Bump rationale: First concrete adoption of the Zonite constitution. All placeholder
tokens replaced with project-specific, declarative, testable principles.

Modified principles:
  - [PRINCIPLE_1_NAME] → I. Shared Contract Source of Truth
  - [PRINCIPLE_2_NAME] → II. Sikka Backend Parity (NON-NEGOTIABLE)
  - [PRINCIPLE_3_NAME] → III. Yalgamers Design Fidelity
  - [PRINCIPLE_4_NAME] → IV. Authoritative Real-Time Server
  - [PRINCIPLE_5_NAME] → V. Spekit-Documented Decisions

Added sections:
  - Technology & Architectural Constraints (replaces [SECTION_2_*])
  - Development Workflow & Quality Gates (replaces [SECTION_3_*])
  - Governance (populated)

Removed sections:
  - None (all template slots filled)

Templates & docs requiring updates:
  - ✅ .specify/templates/plan-template.md — "Constitution Check" gate now maps to
    the five principles below (no file edit needed; gate is evaluated at /speckit.plan
    time against this document).
  - ✅ .specify/templates/spec-template.md — no mandatory sections added/removed;
    existing scope/requirements structure remains compatible.
  - ✅ .specify/templates/tasks-template.md — task categorization already supports
    principle-driven buckets (setup, foundational, per-story, polish); no edit needed.
  - ✅ .github/prompts/*.prompt.md and .github/agents/*.agent.md — no agent-specific
    names baked into guidance; remain generic.
  - ⚠ PLAN.md — source input document; leave as-is. This constitution is the
    authoritative distilled ruleset; PLAN.md is the phased implementation roadmap.
  - ⚠ README.md — does not yet link the constitution or Spekit workspace. Add a
    "Project Governance" section linking to .specify/memory/constitution.md and the
    Spekit Topic when the workspace URL is known.

Follow-up TODOs:
  - TODO(SPEKIT_TOPIC_URL): Capture the Spekit "Zonite Dev Hub" Topic URL and link
    from README once the workspace is provisioned (Phase 0.4).
  - TODO(SIKKA_REPO_PIN): Pin the exact Sikka Platform Backend commit SHA that
    Zonite's backend structure is derived from once Phase 2.1 begins.
-->

# Zonite Constitution

Zonite is a real-time block-claiming multiplayer game built as a TypeScript monorepo
(React + Vite frontend, NestJS + Socket.io backend, a shared contract package). This
constitution is the non-negotiable ruleset that governs how Zonite is built. It takes
precedence over ad-hoc preferences, stylistic debates, and "just this once" shortcuts.

## Core Principles

### I. Shared Contract Source of Truth

The `packages/shared` workspace is the single source of truth for every type, enum,
and event name that crosses the network boundary between frontend and backend.

Rules:

- Every socket event name MUST be defined as an enum constant in `packages/shared`
  (e.g., `GameEvents.BLOCK_CLAIMED`). String literals at call sites are forbidden.
- Every payload that travels over HTTP or WebSocket MUST have its shape defined as a
  TypeScript interface in `packages/shared`; both sides import the same type.
- Game domain enums (`GameStatus`, `GameMode`, `TeamColor`) MUST live in the shared
  package. Duplicating or redeclaring them in `apps/backend` or `apps/frontend` is a
  blocking review finding.
- Backward-incompatible changes to shared types require a MINOR version bump of the
  package and an explicit Spek noting the migration.

Rationale: Drift between frontend and backend contracts is the single most common
cause of real-time game bugs. A single shared package makes the contract typed,
greppable, and refactor-safe.

### II. Sikka Backend Parity (NON-NEGOTIABLE)

The Zonite backend MUST extend, not reinvent, the patterns established in the Sikka
Platform Backend (`/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend`).

Mandatory reuse (no deviation, no local reimplementation):

- **Response envelope**: Every HTTP response MUST flow through `successResponse()` /
  `errorResponse()` from Sikka's `src/utils/response.handler.ts`, producing the
  `SuccessResponse<T>` / `ErrorResponse` shapes. Custom response formats are banned.
- **Pagination**: Room listings, match history, and leaderboards MUST use Sikka's
  pagination helpers. Hand-rolled `limit`/`offset` logic in controllers is banned.
- **Auth**: The Sikka auth module (JWT strategy, `JwtAuthGuard`, `@Public()`,
  `@CurrentUser()`, `FlexibleJwtGuard`, `RefreshTokenGuard`) MUST be reused as-is.
  Zonite MAY add game-specific role checks on top; it MUST NOT fork or replace auth.
- **Module layout**: Every feature module MUST follow the Sikka structure —
  `controllers/`, `services/`, `dto/` (with barrel `index.ts`), `decorators/` (one
  file per endpoint following `{Module}{Operation}Decorator` naming).
- **Env**: All environment access MUST go through Sikka's Zod-validated `env` object
  (`import { env } from "@/env"`). `process.env.*` at call sites is forbidden.
- **API docs**: Zonite registers new modules under the existing Scaler docs pipeline.
  A parallel Swagger bootstrap is forbidden.
- **Validation & errors**: Global `ValidationPipe` settings and the exception filter
  chain inherited from Sikka are used as-is.

Rationale: Zonite ships faster, is maintained alongside Sikka, and benefits from
hardened patterns only if it does not fragment the backend ecosystem. Parallel
systems are debt the platform cannot afford.

### III. Yalgamers Design Fidelity

The Zonite frontend MUST look and feel like a Yalgamers product from the first
commit. The reference implementation is `yalgamer-e-sport-frontend/`.

Rules:

- Design tokens (colors, typography, spacing, radii, shadows, breakpoints) MUST be
  sourced from Yalgamers and translated into a single `design-tokens.ts` (or
  equivalent `tailwind.config.ts` extension / `tokens.css`) consumed by the frontend.
  Hard-coded hex values, font stacks, or arbitrary spacing in components are banned
  outside the token file.
- Reusable UI primitives (buttons, modals, badges, inputs, loading states, timers,
  avatars) live in `apps/frontend/src/components/ui/` and are adapted from Yalgamers
  equivalents. Only the primitives the game screens actually use are ported — no
  speculative copying.
- When a screen needs a component that does not yet exist in `components/ui/`, the
  reviewer MUST confirm whether a Yalgamers analogue exists before a bespoke one is
  written.

Rationale: A consistent brand surface is a product requirement, not a polish pass.
Tokens enforce it mechanically so visual drift is caught at review, not post-launch.

### IV. Authoritative Real-Time Server

The backend is the single authoritative source of game state during a session. The
client is a render-and-emit view.

Rules:

- In-session game state (grid, scores, timer, player set) lives in the backend's
  in-memory `GameStateService` (`Map<roomId, GameState>`). Persistence to the database
  happens only at lifecycle boundaries (game end, room close), never per-tick.
- Every client → server socket event MUST pass through a guarded handler
  (`@UseGuards(WsJwtGuard)` or equivalent) and validate: authenticated user,
  membership in the target room, and current game status. Unvalidated handlers are
  a blocking review finding.
- Block-claim authorization is server-side only: the client MUST NOT assume a claim
  succeeded until the backend broadcasts `block_claimed`. Optimistic UI updates MUST
  reconcile on server echo and roll back on rejection.
- The gateway MUST use a `WsExceptionFilter` that formats all errors as
  `{ event: 'exception', data: { message } }`. Raw stack traces reaching the client
  are a security defect.
- Reconnect is supported via a `request_state` event that returns a full snapshot;
  there MUST be no code path that requires a client to retain state across
  disconnect in order to stay correct.

Rationale: Trusting the client in a competitive real-time game is how cheating and
desync bugs are born. Server authority plus explicit resync is the only defensible
shape.

### V. Spekit-Documented Decisions

Every architectural decision, contract, and lifecycle rule lands in the Spekit "Zonite
Dev Hub" Topic alongside the code that implements it.

Rules:

- A feature PR that introduces a new module, socket event, game mode, or cross-cutting
  rule MUST link the Spek that documents it (or create one). PRs without the link
  MUST NOT be merged.
- At minimum, the Spek set enumerated in PLAN.md Appendix D MUST exist before Phase 8
  is considered complete.
- When a rule in this constitution is amended, the corresponding Spek MUST be updated
  in the same PR.

Rationale: Tribal knowledge does not survive the team doubling. Speks bind the "why"
to the code so future contributors do not have to reverse-engineer decisions.

## Technology & Architectural Constraints

These constraints are fixed for the lifetime of the project unless amended via the
Governance process below.

- **Monorepo**: pnpm workspaces; three packages — `apps/backend`, `apps/frontend`,
  `packages/shared`. Root-level ESLint + Prettier with shared config. Husky +
  lint-staged run on every commit.
- **Backend stack**: NestJS 11, TypeScript (strict), Drizzle ORM on PostgreSQL, JWT
  auth (Sikka), Socket.io via `@nestjs/platform-socket.io`, Zod-validated env. No
  Redis, no external message broker. Global `/api` prefix. Scaler docs at `/api/docs`.
- **Frontend stack**: Vite + React + TypeScript (strict), `react-router-dom` v6,
  Zustand for client state, TanStack Query v5 for server state, Axios for REST,
  `socket.io-client` for real-time, Tailwind (aligned to Yalgamers tokens).
- **Game store rule**: `game.store.ts` is populated **only** from socket events.
  REST calls during active gameplay are forbidden.
- **Grid config limits**: width/height ∈ [5, 50]; duration ∈ [30s, 300s]; defaults
  20×20 / 60s. These bounds are enforced on both client (UX) and server (DTO).
- **Local dev**: a single `docker-compose.yml` brings up PostgreSQL + backend (hot
  reload) + frontend (Vite dev). No other services.
- **Path aliases**: `@/*` → `src/*` in each app's `tsconfig.json`, matching Sikka.
- **Naming**: kebab-case files, camelCase DB columns, lowercase-plural tables,
  UPPER_SNAKE_CASE constants, `/api/<kebab>` routes, `{Module}{Op}Decorator` for
  endpoint decorators (inherited from Sikka).

## Development Workflow & Quality Gates

Every change moves through these gates; skipping one is a blocking review finding.

- **Pre-commit**: lint-staged runs ESLint + Prettier on staged files. Commits that
  bypass hooks with `--no-verify` are rejected at review.
- **Type safety**: `npm run type-check` (or the monorepo equivalent) MUST pass with
  zero errors before a PR is marked ready. `any` at a socket event boundary is a
  blocking finding; narrow the shared type instead.
- **Constitution Check (at `/speckit.plan` time)**: the plan author MUST explicitly
  verify each of the five Core Principles against the proposed design. Any
  deviation MUST be recorded in the plan's Complexity Tracking table with the
  simpler alternative that was rejected and why.
- **Contract-first for cross-wire changes**: a PR that changes a socket event or
  REST payload MUST first update `packages/shared`; the backend and frontend diffs
  in the same PR MUST compile against the new shared types.
- **Gameplay verification**: PRs touching the game engine, gateway, or game screen
  MUST be smoke-tested locally with two concurrent clients before review is
  requested. The reviewer MAY require a short screen recording.
- **Docs sync**: per Principle V, any new or changed rule updates its Spek in the
  same PR.

## Governance

- **Authority**: This constitution supersedes informal conventions, chat decisions,
  and individual preferences. Where it conflicts with PLAN.md (the phased roadmap),
  this constitution wins; PLAN.md is updated to match.
- **Amendment procedure**: Propose the amendment as a PR that edits this file and
  the affected Speks/templates in the same commit. Amendments require review by at
  least one other maintainer and a clear rationale in the PR description.
- **Versioning policy**: Semantic versioning applied to this document.
  - **MAJOR**: A principle is removed or its meaning materially reversed.
  - **MINOR**: A new principle or mandatory section is added, or existing guidance
    is expanded in a way that introduces new obligations.
  - **PATCH**: Clarifications, typo fixes, wording tightening with no new obligation.
- **Compliance review**: Reviewers MUST cite the specific principle(s) a PR
  potentially violates and link to this file. "Feels off" is not a review comment;
  "violates Principle II — reimplements pagination" is.
- **Runtime guidance**: For day-to-day agent guidance, see `PLAN.md` (phased roadmap),
  the Sikka Platform Backend `CLAUDE.md` (backend conventions Zonite inherits), and
  the Spekit "Zonite Dev Hub" Topic (decisions and contracts). This constitution is
  the ruleset; those are the instructions.

**Version**: 1.0.0 | **Ratified**: 2026-04-17 | **Last Amended**: 2026-04-17
