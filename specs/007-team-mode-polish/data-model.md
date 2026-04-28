# Phase 1 Data Model — Team Mode, Polish & Wrap-Up (Phase 8)

**Feature**: 007-team-mode-polish
**Date**: 2026-04-25

Phase 8 introduces **no new database tables**. All persistent state is already captured in the existing `rooms` and `match_player_records` tables. This document covers:

- The new **in-memory shapes** added to the gateway.
- The **modified shared types** in `packages/shared`.
- The **updated entity relationships** for completeness.

---

## 1. In-Memory: Disconnect Grace Timers

**Location**: `apps/backend/src/modules/gateway/game.gateway.ts`

A new private field in `GameGateway`:

```text
disconnectTimers: Map<userId: string, NodeJS.Timeout>
```

Lifecycle:

- **Created** when a socket disconnects and the game is `PLAYING`: `setTimeout(callback, 15_000)`.
- **Cleared** on one of:
  - Player reconnects within grace window (`handleJoinRoom` with game PLAYING).
  - Game transitions to `FINISHED` (in `onGameOver` callback — clears all timers for the room).
  - Player never reconnects and timer fires (callback runs, removes player, broadcasts `player_left`).

No persistence. Timer state is lost if the backend process restarts.

---

## 2. Shared Type: `Results` (modified)

**Location**: `packages/shared/src/types/results.type.ts`

Add an optional field:

```text
Results {
  roomId:          string
  gameMode:        GameMode
  playerRankings:  PlayerRanking[]
  teamRankings:    TeamRanking[] | null    (null in SOLO mode)
  isDraw?:         boolean                 ← NEW (true only in TEAM mode when RED.score === BLUE.score)
}
```

**State transitions**:

- `isDraw` is set by `ResultsService.calculate()` when `teamRankings` is non-null and both teams share rank 1.
- `isDraw: true` triggers a "IT'S A DRAW" banner in the Results screen (fire gradient, not team-colored).

---

## 3. Shared Enum: `GameEvents` (modified)

**Location**: `packages/shared/src/` (events enum file)

```text
GameEvents {
  ...existing events...
  RESET_GAME = "reset_game"   ← NEW (client → server; host only)
}
```

---

## 4. Shared Enum: `RoomEvents` (modified)

**Location**: `packages/shared/src/` (events enum file)

```text
RoomEvents {
  ...existing events...
  UPDATE_ROOM = "update_room"   ← NEW (client → server; host only)
}
```

---

## 5. Shared Type: `UpdateRoomPayload` (new)

**Location**: `packages/shared/src/types/room-config.type.ts` (or new file)

```text
UpdateRoomPayload {
  roomCode:        string
  gridSize?:       number     (5–50)
  durationSeconds?: number    (30–300)
  maxPlayers?:     number     (2–10)
  gameMode?:       GameMode   ('SOLO' | 'TEAM')
}
```

Used as the payload for the `UPDATE_ROOM` socket event. At least one optional field must be present (validated server-side).

---

## 6. Backend: `RoomsService.resetToLobby()` (new method)

Not a new DB entity — a new service method that updates the `rooms` row:

```text
rooms update when resetToLobby():
  status     ← 'LOBBY'
  startedAt  ← null
  endedAt    ← null
```

Validation: caller must be `hostUserId`; method throws `ForbiddenException` otherwise.

---

## 7. Existing Entities (reference, no changes)

### `rooms` table

```text
rooms
├── id               UUID PK
├── code             TEXT UNIQUE (6-char uppercase)
├── status           TEXT ('LOBBY' | 'PLAYING' | 'FINISHED')
├── hostUserId       UUID FK → users.id
├── gameMode         TEXT ('SOLO' | 'TEAM')
├── gridSize         INTEGER (5–50)
├── durationSeconds  INTEGER (30–300)
├── maxPlayers       INTEGER (2–10)
├── createdAt        TIMESTAMPTZ
├── startedAt        TIMESTAMPTZ NULL
└── endedAt          TIMESTAMPTZ NULL
```

Phase 8 note: `resetToLobby()` sets `status = LOBBY`, `startedAt = null`, `endedAt = null` — same columns, no schema change.

### `match_player_records` table

```text
match_player_records
├── id             UUID PK
├── userId         UUID FK → users.id
├── roomId         UUID FK → rooms.id
├── gameMode       TEXT
├── gridSize       INTEGER
├── won            BOOLEAN
├── blocksClaimed  INTEGER
├── xpEarned       INTEGER
└── playedAt       TIMESTAMPTZ
```

No changes. Phase 8 games generate rows via the existing `ProfileService.recordMatchResults()` path.

---

## 8. Validation Rules (new/changed)

| Rule                                       | Location                          | Detail                                                                                  |
| ------------------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------- |
| `UPDATE_ROOM` payload must have ≥1 field   | `UpdateRoomDto` (class-validator) | At least one of `gridSize`, `durationSeconds`, `maxPlayers`, `gameMode` must be present |
| `maxPlayers` ≥ current occupancy on update | `GameGateway.handleUpdateRoom()`  | Count `lobby.get(roomCode).size`; reject if `dto.maxPlayers < occupancy`                |
| `RESET_GAME` caller must be host           | `GameGateway.handleResetGame()`   | Look up `room.hostUserId === user.id`                                                   |
| `isDraw` only set when TEAM mode           | `ResultsService.calculate()`      | Guard: `gameMode === GameMode.TEAM && RED.score === BLUE.score`                         |
