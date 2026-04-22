# Phase 0 Data Model — Foundation & Project Setup

**Feature**: Foundation & Project Setup (Phase 0)
**Date**: 2026-04-17

Phase 0 ships the **container** for Zonite's domain data, not the domain data itself.
No database schemas, no migrations, no persisted records are introduced. This document
therefore defines three categories of "data":

1. **Shared-contract skeletons** — the TypeScript shapes that `packages/shared`
   declares on day one so later phases can fill them without creating duplicates.
2. **Runtime configuration data** — environment variables the backend reads, validated
   at startup by Zod.
3. **Operational entities** — files and workspace units that exist as project
   artifacts (not persisted domain data, but entities the spec references).

No data-layer validation rules apply in Phase 0 (no persistence). State transitions
apply only to the workspace lifecycle, not to game entities — the latter arrive in
Phases 3–4.

---

## 1. Shared-Contract Skeletons (`packages/shared`)

These exports are created in Phase 0 but deliberately **left minimal**. Each later
phase adds fields to its relevant shape via a PR that updates the shared package and
both consumers in one commit (Constitution Principle I). Phase 0's responsibility is
only to ensure each shape has a home and a name.

### 1.1 Enums

| Export       | Kind        | Values                         | Location                        |
| ------------ | ----------- | ------------------------------ | ------------------------------- |
| `GameStatus` | string enum | `LOBBY`, `PLAYING`, `FINISHED` | `src/enums/game-status.enum.ts` |
| `GameMode`   | string enum | `SOLO`, `TEAM`                 | `src/enums/game-mode.enum.ts`   |
| `TeamColor`  | string enum | `RED`, `BLUE`, `NONE`          | `src/enums/team-color.enum.ts`  |

String-valued (not numeric) so they serialize over the wire as human-readable
constants and are greppable in logs.

### 1.2 Event Name Constants

| Export         | Kind                        | Example Members                                                                            | Location                         |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| `GameEvents`   | `const` object (`as const`) | `BLOCK_CLAIMED`, `GAME_STARTED`, `GAME_TICK`, `GAME_OVER`                                  | `src/events/game-events.enum.ts` |
| `RoomEvents`   | `const` object (`as const`) | `PLAYER_JOINED`, `PLAYER_LEFT`, `ROOM_STATE`, `ROOM_UPDATED`                               | `src/events/room-events.enum.ts` |
| `SocketEvents` | exported union type         | `typeof GameEvents[keyof typeof GameEvents] \| typeof RoomEvents[keyof typeof RoomEvents]` | `src/events/index.ts`            |

**Why `const` objects instead of `enum`**: preserves literal string types (`"block_claimed"`)
at call sites, which TypeScript can narrow on; avoids the runtime-object ambiguity of
numeric enums; and matches the "event name constants as an enum (or equivalent
exhaustive constant object)" language in spec FR-006.

Phase 0 ships these with their full name list from PLAN.md Phase 5.3–5.4 so frontend
and backend can refer to them by name before the Phase 5 gateway is implemented:

```ts
// game-events.enum.ts
export const GameEvents = {
  GAME_STARTED: 'game_started',
  BLOCK_CLAIMED: 'block_claimed',
  GAME_TICK: 'game_tick',
  GAME_OVER: 'game_over',
  CLAIM_BLOCK: 'claim_block',
  START_GAME: 'start_game',
  REQUEST_STATE: 'request_state',
  EXCEPTION: 'exception',
} as const;
export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];
```

```ts
// room-events.enum.ts
export const RoomEvents = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  PLAYER_READY: 'player_ready',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  ROOM_STATE: 'room_state',
  ROOM_UPDATED: 'room_updated',
} as const;
export type RoomEventName = (typeof RoomEvents)[keyof typeof RoomEvents];
```

### 1.3 Type Skeletons

Each of the following is **declared** in Phase 0 so later phases cannot introduce a
parallel declaration. The bodies are intentionally minimal — representing only the
fields that are already contractually agreed in PLAN.md — and extended additively in
later phases.

#### `RoomConfig` — `src/types/room-config.type.ts`

```ts
import { GameMode } from '../enums/game-mode.enum';

export interface RoomConfig {
  gameMode: GameMode;
  gridWidth: number; // min 5, max 50, default 20
  gridHeight: number; // min 5, max 50, default 20
  durationSeconds: number; // min 30, max 300, default 60
  maxPlayers: number; // default 10
}
```

Validation rules (from PLAN.md Phase 3.1) are restated as JSDoc on the fields; Phase 3
adds the server-side DTO that enforces them via class-validator.

#### `Player` — `src/types/player.type.ts`

```ts
import { TeamColor } from '../enums/team-color.enum';

export interface Player {
  id: string; // user id (UUID); matches backend primary key format
  displayName: string;
  teamColor: TeamColor; // NONE in solo mode
  score: number;
}
```

#### `Block` — `src/types/block.type.ts`

```ts
import { TeamColor } from '../enums/team-color.enum';

export interface Block {
  x: number;
  y: number;
  claimedBy: string | null; // player id or null
  teamColor: TeamColor | null; // null when unclaimed
}
```

#### `Team` — `src/types/team.type.ts`

```ts
import { TeamColor } from '../enums/team-color.enum';

export interface Team {
  color: TeamColor; // RED or BLUE (NONE is sentinel, not used as a team)
  score: number;
  playerIds: string[];
}
```

#### `GameState` — `src/types/game-state.type.ts`

```ts
import { GameStatus } from '../enums/game-status.enum';
import { Block } from './block.type';
import { Player } from './player.type';

export interface GameState {
  roomId: string;
  status: GameStatus;
  grid: Block[][]; // [y][x]
  players: Record<string, Player>; // keyed by player id
  remainingSeconds: number;
  startedAt: string | null; // ISO-8601, null until PLAYING
}
```

### 1.4 Barrel (`src/index.ts`)

A single barrel re-exports every symbol so consumers import from `@zonite/shared`
only, never from deeper paths:

```ts
export * from './enums/game-status.enum';
export * from './enums/game-mode.enum';
export * from './enums/team-color.enum';
export * from './events';
export * from './types/room-config.type';
export * from './types/player.type';
export * from './types/block.type';
export * from './types/team.type';
export * from './types/game-state.type';
```

**Relationships**:

- `Block` and `Player` both reference `TeamColor`.
- `GameState` aggregates `Block` and `Player`.
- `Team` exists as a view over `Player[]` for use in Phase 8's team-mode results; the
  authoritative player set still lives on `GameState.players`.

---

## 2. Runtime Configuration Data (`apps/backend/src/env.ts`)

Zod schema validated once at bootstrap; crashes the process on invalid input.

| Variable       | Type                                      | Default (local)                                   | Constraint                     | Read by                                               |
| -------------- | ----------------------------------------- | ------------------------------------------------- | ------------------------------ | ----------------------------------------------------- |
| `NODE_ENV`     | `'development' \| 'production' \| 'test'` | `development`                                     | enum                           | `main.ts`, logger                                     |
| `PORT`         | `number` (coerced from string)            | `3000`                                            | 1–65535                        | `main.ts`                                             |
| `DATABASE_URL` | `string`                                  | `postgresql://zonite:zonite@postgres:5432/zonite` | valid URL, scheme `postgresql` | Phase 2+ DB module (unread in Phase 0, but validated) |
| `CORS_ORIGINS` | `string[]` (from comma-separated)         | `http://localhost:5173`                           | each entry a valid origin      | `main.ts` CORS config                                 |

**Identity & uniqueness**: the schema itself is the authoritative identity — there is
no second env parser. **Lifecycle**: validated at process start; any failure exits
with code 1 and a readable error before NestJS boots.

---

## 3. Operational Entities

These are spec-level "entities" that surface as files/workspaces, not persisted data.
They exist so the acceptance scenarios have concrete objects to test against.

### 3.1 Workspace Package

| Attribute    | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| `name`       | `@zonite/backend`, `@zonite/frontend`, `@zonite/shared`            |
| `version`    | `0.0.0` (private; no publish)                                      |
| `private`    | `true`                                                             |
| `dependsOn`  | backend, frontend → shared (via `workspace:*`); shared → (nothing) |
| `resolvedBy` | root `pnpm install` (one lockfile)                                 |

### 3.2 Environment Variable Manifest

Source of truth: `.env.example` at repo root. Invariant (spec SC-006): every variable
the schema in §2 reads appears in `.env.example` with an inline comment explaining
what it controls; no variable listed in `.env.example` is unused.

### 3.3 Local Dev Stack

Three services in `docker-compose.yml`:

| Service    | Image / Build                        | Depends on                   | Healthcheck                                    |
| ---------- | ------------------------------------ | ---------------------------- | ---------------------------------------------- |
| `postgres` | `postgres:16-alpine`                 | —                            | `pg_isready -U zonite`                         |
| `backend`  | build `./apps/backend` (dev target)  | `postgres` (service_healthy) | `curl -f http://localhost:3000/api/health`     |
| `frontend` | build `./apps/frontend` (dev target) | —                            | `wget -qO- http://localhost:5173/` returns 200 |

State transitions: `docker compose up` → all services `starting` → `healthy` within
acceptance window. `docker compose down` → all stopped; data persists in the
`postgres-data` named volume.

### 3.4 Spekit Topic ("Zonite Dev Hub")

External; not a file in the repo. Tracked by its URL, stored in the README. The four
Phase 0 Speks are listed in spec FR-020 and their presence is validated by spec
SC-005. Phase 0 treats the Topic as a write-target, not a read-target, from the
repository's perspective.
