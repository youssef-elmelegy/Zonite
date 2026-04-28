# Data Model: Frontend Foundation — Phase 6

_Client-side state entities. No server-side DB changes in this phase._

---

## Entity: AuthState (Zustand — persisted)

**Store key**: `'zonite-auth'` in localStorage  
**Persistence**: Full (all fields survive page refresh)

| Field          | Type                  | Description                                                                        |
| -------------- | --------------------- | ---------------------------------------------------------------------------------- |
| `user`         | `CurrentUser \| null` | Logged-in user: `{ id, email, role }` — from `@zonite/shared`                      |
| `accessToken`  | `string \| null`      | JWT access token; attached to all API requests                                     |
| `refreshToken` | `string \| null`      | JWT refresh token; used by 401-refresh interceptor                                 |
| `onboarded`    | `boolean`             | True once the user has seen onboarding; persists across logouts                    |
| `isHydrated`   | `boolean`             | Set to `true` by `onRehydrateStorage`; guards route decisions until store is ready |

**Actions**:

- `setAuth(tokens: AuthTokens, user: CurrentUser)` — called on login / signup / refresh success
- `clearAuth()` — called on logout or refresh failure; sets user + tokens to null; preserves `onboarded`
- `setOnboarded()` — called when onboarding completes; sets `onboarded = true`

**Invariants**:

- `accessToken` is never written directly from components — only via `setAuth` and the Axios refresh interceptor.
- `onboarded` is never reset to `false` after it becomes `true`.

---

## Entity: RoomStore (Zustand — in-memory only)

| Field             | Type               | Description                                               |
| ----------------- | ------------------ | --------------------------------------------------------- |
| `roomCode`        | `string \| null`   | 6-character room code                                     |
| `gameMode`        | `GameMode \| null` | `SOLO` or `TEAM`; from `@zonite/shared`                   |
| `gridSize`        | `number \| null`   | Square board edge length ∈ [5, 50]                        |
| `durationSeconds` | `number \| null`   | Match duration ∈ [30, 300]                                |
| `maxPlayers`      | `number \| null`   | ∈ [2, 10]                                                 |
| `players`         | `LobbyPlayer[]`    | Current lobby player list; from `@zonite/shared`          |
| `myTeam`          | `TeamColor`        | Local player's team (NONE in solo); from `@zonite/shared` |

**Actions**:

- `setRoom(code, config)` — called after `createRoom` or `join_room` confirmation
- `setPlayers(players)` — called on `room_state` event (full snapshot)
- `addOrUpdatePlayer(p)` — called on `player_joined` event
- `removePlayer(id)` — called on `player_left` event
- `clearRoom()` — called on "Back to Home"

**State transitions**:

```
null ──setRoom──► populated ──clearRoom──► null
populated ──addOrUpdatePlayer──► populated (player count changes)
populated ──removePlayer──► populated
```

---

## Entity: GameStore (Zustand — in-memory only)

| Field              | Type                     | Description                                                                                                  |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `grid`             | `Block[][]`              | 2D array `size × size`; each `Block` has `{ x, y, claimedBy: string \| null, teamColor: TeamColor \| null }` |
| `players`          | `Record<string, Player>` | Active players: `{ id, fullName, teamColor, score, color }` — from `@zonite/shared`                          |
| `status`           | `GameStatus`             | `LOBBY` / `PLAYING` / `FINISHED`                                                                             |
| `remainingSeconds` | `number`                 | Countdown; updated every second via `game_tick`                                                              |
| `size`             | `number`                 | Grid edge length; set on `game_started`                                                                      |

**Actions**:

- `setGameState(s: GameState)` — full replacement on `game_started` or `request_state` response
- `applyBlockClaim(block: Block)` — mutates the single cell at `[block.y][block.x]` and increments the player's `score`
- `tickTimer(remaining: number)` — sets `remainingSeconds`
- `setFinished()` — sets `status = FINISHED`
- `clearGame()` — resets to initial state

**Invariants**:

- `grid` is a 2D array indexed `grid[y][x]` (row-major).
- `applyBlockClaim` is the ONLY place a cell's `claimedBy` is mutated — never from a click handler directly.

---

## Entity: SocketContext (React context — runtime only)

Not stored in Zustand. The `useSocket` hook returns a reference object; consumers get it via a React context provider wrapping authenticated routes.

| Field         | Type                             | Description                               |
| ------------- | -------------------------------- | ----------------------------------------- |
| `socket`      | `Socket \| null`                 | Active socket.io client instance          |
| `isConnected` | `boolean`                        | Whether the socket is currently connected |
| `emit`        | `(event, ...args) => void`       | Type-safe emit                            |
| `on`          | `(event, handler) => () => void` | Subscribe and return unsubscribe function |

---

## Validation rules

| Entity                      | Field      | Rule                                                                        |
| --------------------------- | ---------- | --------------------------------------------------------------------------- |
| `RoomStore.gridSize`        | number     | Client enforces ∈ [5, 50]; slider in CreateRoom prevents out-of-range       |
| `RoomStore.durationSeconds` | number     | Client enforces ∈ [30, 300]; segmented selector shows only valid presets    |
| `RoomStore.maxPlayers`      | number     | Client enforces ∈ [2, 10]                                                   |
| Login form                  | `email`    | Valid email format; shown as field error inline                             |
| Signup form                 | `password` | Minimum 8 chars + strength indicator; `confirmPassword` must match          |
| Join form                   | `roomCode` | Exactly 6 alphanumeric chars (uppercase); validated before `join_room` emit |
| Reset form                  | `otp`      | Exactly 6 digits; OtpField prevents non-numeric input                       |

---

## State transition diagram: Auth lifecycle

```
(no session)
    │
    ├─ first visit ──► Onboarding ──complete──► Login
    └─ returning  ──────────────────────────► Login
                                                │
                                            sign in
                                                │
                                            Home (authenticated)
                                                │
                                     ┌──────────┴──────────┐
                                logout               session continues
                                     │
                              clearAuth()
                                     │
                                   Login
                        (onboarded=true, skips onboarding)
```

## State transition diagram: Game lifecycle

```
room.store: null ──setRoom──► populated ──clearRoom──► null
                                  │
                           socket game_started
                                  │
                          game.store.setGameState
                                  │
                     ┌────────────┴──────────────────┐
              block_claimed                        game_tick
                     │                                │
              applyBlockClaim                    tickTimer
                     │                                │
                   [loop] ◄──────────────────────────┘
                     │
                  game_over
                     │
                setFinished
                     │
              Results displayed
                     │
            ┌────────┴────────┐
        Play Again         Back to Home
            │                  │
          Lobby             clearRoom()
                             clearGame()
```
