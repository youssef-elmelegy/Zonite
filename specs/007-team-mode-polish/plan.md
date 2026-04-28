# Implementation Plan: Team Mode, Polish & Game Wrap-Up (Phase 8)

**Branch**: `007-team-mode-polish` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-team-mode-polish/spec.md`

---

## Summary

Phase 8 completes the Zonite game loop: team-based play (Red vs Blue), live host-editable room config, a 15-second graceful disconnect/reconnect window, and the "Play Again" reset flow. The core game engine and result calculation are already ~85% complete from Phases 4–6; this phase closes the remaining gaps, connects the dots, and stabilizes the full sequential game loop end-to-end.

---

## Technical Context

**Language/Version**: TypeScript ^5.7 strict (Node 22 LTS, pinned via `.nvmrc`)
**Primary Dependencies**: NestJS 11 (backend), Vite + React 18 (frontend), Socket.io, Drizzle ORM, Zustand, `packages/shared` (shared contract)
**Storage**: PostgreSQL (existing schema — no new tables for Phase 8); in-memory `Map<roomId, GameState>` for live sessions
**Testing**: Jest + NestJS Testing (backend), Vite (frontend); smoke tests with two concurrent browser tabs
**Target Platform**: Linux server (backend), modern browser (frontend)
**Project Type**: Web application — real-time multiplayer game
**Performance Goals**: Block-claim broadcast latency < 200 ms under normal conditions; grace-period timer accuracy ±1 s
**Constraints**: No new DB tables; no new backend libraries; no breaking changes to existing socket event names
**Scale/Scope**: Up to 10 players per room; expected concurrent rooms < 100 in Phase 8 (dev/staging environment)

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                              | Status  | Notes                                                                                                                                                                  |
| -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Shared Contract**                 | ✅ PASS | Two new events (`RESET_GAME`, `UPDATE_ROOM`) added to `packages/shared` enums before any app-side code. No string literals at call sites.                              |
| **II. Sikka Backend Parity**           | ✅ PASS | New gateway handlers follow existing Sikka module structure. `RoomsService.resetToLobby()` returns `successResponse()`. No parallel auth or pagination system added.   |
| **III. Yalgamers Design Fidelity**     | ✅ PASS | Team colors use `--team-red*` and `--team-blue*` tokens. No new hex values. "Play Again" and reconnect overlay use existing `Button` and `Modal` primitives.           |
| **IV. Authoritative Real-Time Server** | ✅ PASS | Grace period, team assignment, and reset all execute on server; client only receives state via socket broadcast. `request_state` resync path is the reconnect channel. |
| **V. Spekit-Documented Decisions**     | ✅ PASS | Phase 8 Spek deliverables listed at the end of this plan (Team Mode, Disconnect Grace, Reset Flow, Final Architecture Overview).                                       |

No complexity violations detected.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-team-mode-polish/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (in-memory shapes, no new DB tables)
├── quickstart.md        ← Phase 1 output (smoke-test guide)
├── contracts/
│   ├── socket-events.md ← New/modified socket events
│   └── http-api.md      ← Modified HTTP endpoints
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code — files touched by Phase 8

```text
packages/shared/src/
├── auth/                        (no changes)
├── types/
│   └── results.type.ts          ← Add `isDraw?: boolean` to Results
└── index.ts                     ← Re-export new types
    events/
    └── game-events.ts           ← Add GameEvents.RESET_GAME
    events/
    └── room-events.ts           ← Add RoomEvents.UPDATE_ROOM

apps/backend/src/modules/
├── gateway/
│   └── game.gateway.ts          ← Grace period timers, team pre-assign, update_room, reset_game handlers
├── game/
│   └── services/
│       ├── game-state.service.ts ← No changes needed (already has updateSocketId, getState, removeGame)
│       └── results.service.ts   ← Add tie/draw logic for equal team scores
└── rooms/
    └── services/
        └── rooms.service.ts     ← Add resetToLobby(code, hostUserId)

apps/frontend/src/
├── pages/
│   ├── Lobby.tsx                ← Team badges, host inline config edit, room_updated listener
│   └── Results.tsx              ← Play Again emits reset_game; listen for room_state to navigate
├── hooks/
│   └── useGameState.ts          ← Add reset_game/room_state handler for Play Again; reconnect overlay state
└── store/
    └── room.store.ts            ← Populate myTeam from GAME_STARTED event
```

**Structure Decision**: Monorepo with three packages — `packages/shared`, `apps/backend`, `apps/frontend`. Phase 8 follows Option 2 (Web application) with frontend + backend separated exactly as established in Phases 4–6. No new packages or apps are introduced.

---

## Complexity Tracking

No constitution violations found. No complexity justifications needed.
