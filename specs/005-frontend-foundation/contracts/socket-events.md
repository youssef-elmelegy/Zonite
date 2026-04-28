# WebSocket Event Contracts — Frontend Consumption (Phase 6)

Namespace: `/game`  
Auth: `socket.handshake.auth.token = accessToken` (set at connection time)  
All event names imported from `GameEvents` and `RoomEvents` in `@zonite/shared`.

---

## Client → Server (emit)

| Event constant             | String value      | Payload type               | Description                           |
| -------------------------- | ----------------- | -------------------------- | ------------------------------------- |
| `RoomEvents.JOIN_ROOM`     | `'join_room'`     | `{ roomCode: string }`     | Join lobby / reconnect to active game |
| `RoomEvents.LEAVE_ROOM`    | `'leave_room'`    | `{ roomCode: string }`     | Explicitly leave the room             |
| `RoomEvents.PLAYER_READY`  | `'player_ready'`  | `{}` (no payload)          | Toggle ready state                    |
| `GameEvents.START_GAME`    | `'start_game'`    | `{ roomCode: string }`     | Host starts the game                  |
| `GameEvents.CLAIM_BLOCK`   | `'claim_block'`   | `{ x: number; y: number }` | Claim a cell at column x, row y       |
| `GameEvents.REQUEST_STATE` | `'request_state'` | `{ roomCode: string }`     | Request full state resync (reconnect) |

---

## Server → Client (on)

| Event constant             | String value      | Payload type            | Action in client                                                  |
| -------------------------- | ----------------- | ----------------------- | ----------------------------------------------------------------- |
| `RoomEvents.ROOM_STATE`    | `'room_state'`    | `RoomState`             | `room.store.setPlayers()` + update config                         |
| `RoomEvents.PLAYER_JOINED` | `'player_joined'` | `LobbyPlayer`           | `room.store.addOrUpdatePlayer()`                                  |
| `RoomEvents.PLAYER_LEFT`   | `'player_left'`   | `string` (playerId)     | `room.store.removePlayer()`                                       |
| `GameEvents.GAME_STARTED`  | `'game_started'`  | `GameState`             | `game.store.setGameState()`, navigate to `/game/:code`            |
| `GameEvents.BLOCK_CLAIMED` | `'block_claimed'` | `Block`                 | `game.store.applyBlockClaim()`                                    |
| `GameEvents.GAME_TICK`     | `'game_tick'`     | `{ remaining: number }` | `game.store.tickTimer()`                                          |
| `GameEvents.GAME_OVER`     | `'game_over'`     | `Results`               | `game.store.setFinished()`, store results, navigate to `/results` |
| `GameEvents.EXCEPTION`     | `'exception'`     | `{ message: string }`   | Surface as toast/alert; log to console                            |

---

## Shared types (from `@zonite/shared`)

```typescript
// Block
interface Block {
  x: number;
  y: number;
  claimedBy: string | null; // userId
  teamColor: TeamColor | null;
}

// GameState
interface GameState {
  roomId: string;
  size: number;
  status: GameStatus;
  grid: Block[][];
  players: Record<string, Player>;
  remainingSeconds: number;
  startedAt: string | null;
}

// RoomState
interface RoomState {
  roomCode: string;
  status: GameStatus;
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  players: LobbyPlayer[];
}

// LobbyPlayer
interface LobbyPlayer {
  id: string;
  fullName: string;
  teamColor: TeamColor;
  color: string;
  isReady: boolean;
  isHost: boolean;
}

// Player (in-game)
interface Player {
  id: string;
  fullName: string;
  teamColor: TeamColor;
  score: number;
  color: string; // hex from 10-entry solo palette; '' in team mode
}

// Results
interface Results {
  roomId: string;
  gameMode: GameMode;
  size: number;
  grid: Block[][];
  playerRankings: PlayerResult[];
  teamRankings: TeamResult[] | null;
}
```

---

## Connection lifecycle

```
1. User navigates to /lobby/:code or /game/:code
2. useSocket(roomCode) initializes Socket({ auth: { token: accessToken }, namespace: '/game' })
3. socket.on('connect') → emit(join_room, { roomCode })
4. Server responds with room_state (lobby) or game_started (reconnect to active game)
5. During game: handle block_claimed, game_tick, game_over
6. On disconnect: socket.io auto-reconnects up to 5 times
7. On reconnect: emit(request_state, { roomCode }) → setGameState with full snapshot
8. On route leave: emit(leave_room, { roomCode }), socket.disconnect()
```

---

## Error handling

`GameEvents.EXCEPTION` (`'exception'`): server sends `{ message: string }` for all WS errors (validation failures, auth failure, claim rejection). The client surfaces these as a transient toast notification (not a page redirect). Stack traces are never sent by the server.
