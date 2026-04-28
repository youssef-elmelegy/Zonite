# Socket Event Contracts — Phase 8 (New & Modified)

**Feature**: 007-team-mode-polish
**Date**: 2026-04-25
**Namespace**: `/game`

All event names are enum constants from `packages/shared`. String literals at call sites are forbidden (Constitution Principle I).

---

## New Client → Server Events

### `update_room` (`RoomEvents.UPDATE_ROOM`)

**Who can emit**: Host only (validated server-side; non-host receives `exception` event)
**When**: Host changes room config from Lobby screen before game starts
**Guard**: `WsJwtGuard` (JWT required)

**Payload** (`UpdateRoomPayload` from `packages/shared`):

```ts
{
  roomCode:         string        // required
  gridSize?:        number        // 5–50
  durationSeconds?: number        // 30–300
  maxPlayers?:      number        // 2–10
  gameMode?:        GameMode      // 'SOLO' | 'TEAM'
}
```

**Server actions**:

1. Validate host ownership.
2. Validate `status === LOBBY`.
3. Reject if `maxPlayers < current occupancy`.
4. If `gameMode` changes TEAM → SOLO: reset all lobby players' `teamColor` to `TeamColor.NONE`.
5. If `gameMode` changes SOLO → TEAM: re-assign RED/BLUE to lobby players (balance rule from R-002).
6. Call `RoomsService.update()` to persist changes.
7. Broadcast `ROOM_UPDATED` to all in the socket room.

**Server emits in response**: `ROOM_UPDATED` (see below)

---

### `reset_game` (`GameEvents.RESET_GAME`)

**Who can emit**: Host only (validated server-side)
**When**: Host clicks "Play Again" on Results screen
**Guard**: `WsJwtGuard`

**Payload**:

```ts
{
  roomCode: string;
}
```

**Server actions**:

1. Validate caller is host.
2. Call `RoomsService.resetToLobby(roomCode)` — sets `status = LOBBY`, clears `startedAt`/`endedAt`.
3. Call `GameStateService.removeGame(roomId)` if game exists.
4. Re-populate lobby map from connected sockets: each client in socket room `roomCode` is added as a non-ready player (`isReady = false`, `teamColor` re-assigned if TEAM mode).
5. Broadcast `ROOM_STATE` to all in the room.
6. All connected clients navigate from `/results` to `/lobby/:code` on receiving `ROOM_STATE`.

**Server emits in response**: `ROOM_STATE`

---

## Modified Server → Client Events

### `PLAYER_JOINED` (`RoomEvents.PLAYER_JOINED`) — Modified

**Change**: Now includes `teamColor` (`TeamColor.RED | TeamColor.BLUE | TeamColor.NONE`) populated at join time for TEAM mode rooms (previously always `TeamColor.NONE`).

**Payload** (`LobbyPlayer` from `packages/shared`):

```ts
{
  id: string;
  fullName: string;
  teamColor: TeamColor; // ← now meaningful in TEAM mode lobby
  color: string;
  isReady: boolean;
  isHost: boolean;
}
```

---

### `ROOM_STATE` (`RoomEvents.ROOM_STATE`) — Modified

**Change**: `players[].teamColor` is now populated at lobby join time for TEAM mode. Previously `teamColor` was always `NONE` until game start.

**Payload** (`RoomState` from `packages/shared`):

```ts
{
  roomCode:        string
  status:          GameStatus
  gameMode:        GameMode
  gridSize:        number
  durationSeconds: number
  maxPlayers:      number
  players:         LobbyPlayer[]   // teamColor now set in TEAM mode
}
```

---

### `GAME_OVER` (`GameEvents.GAME_OVER`) — Modified

**Change**: `Results.isDraw?: boolean` added. Set to `true` only when `gameMode === TEAM` and both team scores are equal.

**Payload** (`Results` from `packages/shared`):

```ts
{
  roomId:          string
  gameMode:        GameMode
  playerRankings:  PlayerRanking[]
  teamRankings:    TeamRanking[] | null
  isDraw?:         boolean           // ← new (true on equal team scores in TEAM mode)
}
```

---

## New Server → Client Events

### `ROOM_UPDATED` (`RoomEvents.ROOM_UPDATED`) — New use of existing event

`RoomEvents.ROOM_UPDATED` already exists in `packages/shared` but was not emitted by any server handler. Phase 8 wires it up.

**When emitted**: After `update_room` is processed by the gateway.
**Target**: All clients in the socket room (`this.server.to(roomCode).emit(...)`).

**Payload** (`RoomConfig` from `packages/shared`):

```ts
{
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  gameMode: GameMode;
}
```

---

## Unchanged Events (reference)

| Event           | Direction | Notes                                                                          |
| --------------- | --------- | ------------------------------------------------------------------------------ |
| `join_room`     | C→S       | No change; team assignment now happens inside this handler for TEAM mode       |
| `leave_room`    | C→S       | No change                                                                      |
| `player_ready`  | C→S       | No change                                                                      |
| `start_game`    | C→S       | No change; reads pre-assigned `teamColor` from lobby map                       |
| `claim_block`   | C→S       | No change                                                                      |
| `request_state` | C→S       | No change; used for reconnect resync                                           |
| `PLAYER_LEFT`   | S→C       | No change in shape; now also emitted by the grace-period timer expiry callback |
| `GAME_STARTED`  | S→C       | No change; `players[].teamColor` already populated correctly from lobby        |
| `GAME_TICK`     | S→C       | No change                                                                      |
| `exception`     | S→C       | No change                                                                      |
