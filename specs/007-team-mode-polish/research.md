# Research: Team Mode, Polish & Game Wrap-Up — Phase 8

_Generated during `/speckit.plan` Phase 0_

---

## R-001 — Grace period disconnect: where to track timers

**Decision**: Track the 15-second reconnect grace timers in `GameGateway` via a `Map<string, NodeJS.Timeout>` keyed by `userId` (not by `socketId`, since the old socketId is gone on disconnect).

**Rationale**: The gateway already holds per-socket context in `socketIndex` and per-room lobby state in `lobby`. Adding a parallel `disconnectTimers: Map<userId, NodeJS.Timeout>` in the same class keeps all lifecycle state co-located and avoids injecting gateway-specific concerns into `GameStateService`. On disconnect the gateway:

1. Looks up the `SocketContext` from `socketIndex`.
2. If a game is `PLAYING` for that room, schedules a 15-second `setTimeout`.
3. The timeout callback removes the player from the in-memory game state and broadcasts `player_left`.
   On reconnect (`handleJoinRoom` with game in PLAYING status), the gateway clears the pending timer via `clearTimeout` before restoring the socketId.

**Timer cleanup rule**: Timers for rooms that reach `FINISHED` status (via `onGameOver`) are always cleared even if they have not expired, because the grace period is moot once results are emitted.

**Alternatives considered**:

- Store timers in `GameStateService`: blurs the boundary between pure game logic and I/O side effects; rejected.
- Use a global `setTimeout` keyed by socketId: the socketId changes on reconnect so it can't be used as a stable key; rejected.

---

## R-002 — Team pre-assignment in lobby: when and how

**Decision**: Assign `RED` / `BLUE` team color at `handleJoinRoom` time (not at game start) for rooms in TEAM mode. The `InternalLobbyPlayer.teamColor` field already exists in the gateway. The assignment rule is: count current RED and BLUE players; assign the color of the smaller group; on tie, alternate (RED first).

**Rationale**: The spec requires team badges to be visible in the lobby to all participants. The game start handler already reads `lobbyPlayer.teamColor` to build `InternalPlayer.teamColor` — so pre-assigning in the lobby means the start handler becomes a passthrough (no change needed). The `ROOM_STATE` snapshot already includes `players[].teamColor` so all connected clients see the correct team without a separate event.

**Balance rule**: A player who joins when team sizes are equal is assigned RED (first); the next is BLUE; and so on. The update to `lobbyPlayers` triggers a fresh `PLAYER_JOINED` broadcast that includes the assigned `teamColor`.

**Edge case — mode switch by host in lobby**: If the host changes mode from TEAM to SOLO (via `update_room`) all players' `teamColor` is reset to `TeamColor.NONE` in the lobby map, and a fresh `ROOM_STATE` is broadcast.

**Alternatives considered**:

- Player self-selects team: adds UI complexity and balance-enforcement edge cases; deferred to a post-Phase-8 enhancement.
- Assign only at game start: breaks the spec requirement for lobby-visible team badges; rejected.

---

## R-003 — Room config update from lobby: socket handler vs REST

**Decision**: Implement a new `update_room` socket event handled in `GameGateway`. The handler validates host ownership, calls the existing `RoomsService.update()` method, updates all lobby players' `teamColor` if mode changes (see R-002), then broadcasts `RoomEvents.ROOM_UPDATED` with the new `RoomConfig` payload to everyone in the socket room.

**Rationale**: Injecting `GameGateway` into `RoomsService` would create a circular dependency (`RoomsService` → `GameGateway` → `RoomsService`). Using `EventEmitter2` (NestJS event bus) avoids the circle but adds an extra abstraction layer for a single use case. The cleanest path is to own config updates entirely in the gateway so the socket broadcast is a direct call. The REST `PATCH /rooms/:code` endpoint remains unchanged for non-lobby use cases (it already rejects changes when `status !== LOBBY`).

**Alternatives considered**:

- NestJS `EventEmitter2` in `RoomsService` → gateway listener: correct pattern but adds EventEmitter dependency for one event; over-engineered; rejected.
- Emit from `RoomsController` by injecting `GameGateway` into the controller: viable, but the controller would need access to the lobby map to update team colors; rejected in favor of the gateway owning this.

---

## R-004 — Play Again / reset flow

**Decision**: The host emits `reset_game` (new `GameEvents.RESET_GAME` event) from the Results screen. The gateway handler:

1. Validates the caller is the room host.
2. Calls `RoomsService.resetToLobby(roomCode)` — sets `status = LOBBY`, clears `startedAt` / `endedAt`.
3. Calls `GameStateService.removeGame(roomId)` if the game still exists in memory.
4. Re-populates the lobby map from currently-connected sockets: each client that is still in the socket room `roomCode` is added back as a non-ready lobby player (ready state is reset).
5. Broadcasts `RoomEvents.ROOM_STATE` with the fresh lobby snapshot.

**Frontend flow**: On receiving `ROOM_STATE` after a `RESET_GAME` emission, `useGameState` clears the game store and the router navigates from `/results` back to `/lobby/:code`.

**Alternatives considered**:

- New REST `POST /rooms/:code/reset` endpoint: adds an extra round-trip before the socket broadcast; clients would need to poll or listen for a follow-up socket event anyway; rejected.
- Destroy and re-create the room (new code): breaks the "same room code" requirement from the spec; rejected.

---

## R-005 — Equal-score tie in TEAM mode

**Decision**: When `RED.score === BLUE.score` at game end, `ResultsService.calculate()` returns `teamRankings` with both teams listed (rank 1 for both) and sets `isDraw: true` on the `Results` object. The `Results` type in `packages/shared` gains an optional `isDraw?: boolean` field.

**Frontend behaviour**: The Results page checks `results.isDraw`. If true, the winner banner reads "IT'S A DRAW" with the `--grad-fire` background (not team-colored) and both team scores are shown side by side.

**Alternatives considered**:

- Tiebreaker by time-of-last-claim: adds clock tracking per claim; disproportionate complexity for an edge case; rejected.
- Return `null` team winner and let frontend decide: pushes logic to client in violation of Principle IV (authoritative server); rejected.

---

## R-006 — `myTeam` store population

**Decision**: When `GAME_STARTED` fires, `useGameState` reads `state.players[currentUserId].teamColor` and stores it in `room.store.myTeam`. This allows any component to know the current user's team color without traversing the full player map.

**Rationale**: `room.store.myTeam` already exists as a `TeamColor` field but is always `TeamColor.NONE` because no code writes it. The game store `players` map contains the data; it's just a matter of wiring the one-time read at game start.

---

## R-007 — Reconnect UI overlay

**Decision**: `useSocket` exposes an `isConnected: boolean` state. When `isConnected` becomes `false` during a game (route is `/game/:code`), the Game page renders a full-screen overlay with "Reconnecting…" text using the existing `Modal` primitive. The overlay dismisses when `isConnected` returns to `true`. Socket.io's built-in reconnection handles the actual transport; the overlay is purely presentational.

**Reconnect and resync**: On reconnect, `useSocket`'s `connect` event listener emits `REQUEST_STATE` with the current room code. `handleRequestState` on the server sends `GAME_STARTED` with the full current state. `useGameState` handles `GAME_STARTED` both at initial load and on resync (it's idempotent — it overwrites the store).

**Alternatives considered**:

- Custom reconnect logic with exponential backoff: Socket.io already handles this; duplicating it would conflict; rejected.
- Toast notification instead of overlay: a toast is dismissible; during reconnection the game is frozen and a blocking overlay is the correct signal; rejected.
