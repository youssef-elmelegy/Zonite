# Research: Frontend Foundation — Phase 6

_Generated during `/speckit.plan` Phase 0_

---

## R-001 — React Router v6: Protected Route pattern

**Decision**: Wrap protected pages in a `<ProtectedRoute>` component that reads `auth.store` synchronously and renders `<Outlet />` on success, or `<Navigate>` on failure. Use a `<RouterProvider>` with a single `createBrowserRouter` call at the root.

**Rationale**: RR v6 loaders execute before render and introduce fetch waterfalls for auth-check; a component-level guard reads the already-hydrated Zustand store synchronously with zero waterfall.

**Alternatives considered**:

- `loader`-based redirect: requires the loader to re-read localStorage or call an API; adds a round-trip.
- Route groups with nested layouts: correct but overkill for a 12-page app.

**Implementation detail**:

```text
/ (AuthLayout)
├── /onboarding       ← no guard
├── /login            ← no guard
├── /signup           ← no guard
├── /forgot           ← no guard
├── /reset            ← no guard
└── / (ProtectedRoute → AppLayout)
    ├── /home
    ├── /create
    ├── /lobby/:code
    ├── /game/:code
    ├── /results
    └── /profile
```

`ProtectedRoute` logic:

1. Read `auth.store.isHydrated` — if false, render a full-screen spinner (prevents flash).
2. If hydrated and no `accessToken` → `<Navigate to={onboarded ? '/login' : '/onboarding'} replace />`.
3. If authenticated → `<Outlet />`.

---

## R-002 — Zustand store design

**Decision**: Three stores with clear ownership. `auth.store` uses `zustand/middleware/persist` (key: `'zonite-auth'`). `room.store` and `game.store` are plain Zustand — no persistence.

**Rationale**: Auth tokens and the `onboarded` flag must survive page refresh. Room and game state should reset on reload (server is authoritative; full resync on reconnect restores game state).

**Store shapes**:

```typescript
// auth.store.ts
interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  onboarded: boolean;
  isHydrated: boolean;   // set true by onRehydrateStorage
  setAuth(tokens: AuthTokens, user: CurrentUser): void;
  clearAuth(): void;
  setOnboarded(): void;
}

// room.store.ts
interface RoomStore {
  roomCode: string | null;
  roomConfig: Pick<RoomConfig, 'gridSize' | 'durationSeconds' | 'maxPlayers' | 'gameMode'> | null;
  players: LobbyPlayer[];
  myTeam: TeamColor;
  setRoom(code: string, config: ...): void;
  setPlayers(players: LobbyPlayer[]): void;
  addOrUpdatePlayer(p: LobbyPlayer): void;
  removePlayer(id: string): void;
  clearRoom(): void;
}

// game.store.ts
interface GameStore {
  grid: Block[][];        // size × size 2D array (mirrors GameState.grid)
  players: Record<string, Player>;
  status: GameStatus;
  remainingSeconds: number;
  setGameState(s: GameState): void;
  applyBlockClaim(block: Block): void;
  tickTimer(remaining: number): void;
  clearGame(): void;
}
```

**Alternatives considered**:

- Redux Toolkit: too much boilerplate for 3 stores.
- Jotai: atoms are fine but Zustand's `persist` middleware is already in spec.
- Persisting game.store: rejected — server resync is the source of truth; persisted stale grids would mislead.

---

## R-003 — Axios: JWT attach + 401 refresh with request queue

**Decision**: Single Axios instance (`api.ts`) with two interceptors:

1. **Request interceptor**: reads `auth.store.accessToken` and sets `Authorization: Bearer <token>`.
2. **Response interceptor**: on 401, enqueues the failed request, calls `POST /api/auth/refresh` once (with the stored `refreshToken`), updates the store, drains the queue retrying each request with the new token. If refresh also 401s → `auth.store.clearAuth()` and redirect to `/login`.

**Rationale**: A naive retry without a queue causes multiple simultaneous 401s to each fire a refresh, producing race conditions. A queue pattern (isRefreshing flag + array of pending resolvers) collapses all concurrent 401s into one refresh call.

**Sikka envelope**: All successful responses are unwrapped via the interceptor — the Axios promise resolves with `SuccessResponse<T>.data` so service methods return typed `T` directly.

**Token source**: The response `POST /api/auth/login` and `POST /api/auth/refresh` both return `SuccessResponse<{ tokens: AuthTokens; user: CurrentUser }>`. Shape matches the `AuthTokens` type in `@zonite/shared`.

---

## R-004 — socket.io-client: JWT auth, reconnection, typed events

**Decision**: Initialize a single Socket instance per connection attempt via `useSocket`. Pass the JWT as `handshake.auth.token` (matches `WsJwtGuard` on the backend). Use socket.io's built-in reconnection (`reconnection: true`, `reconnectionAttempts: 5`). Expose `isConnected` boolean state.

**Rationale**: `handshake.auth` is the correct channel — query params leak tokens into server logs; cookies don't work across origins; headers are not supported on socket.io handshakes.

**useSocket contract**:

```typescript
function useSocket(roomCode: string): {
  isConnected: boolean;
  emit<E extends SocketEventName>(event: E, ...args: any[]): void;
  on<E extends SocketEventName>(event: E, handler: (...args: any[]) => void): () => void;
};
```

On mount: connect `/game`, join room (`join_room`). On unmount: `leave_room`, disconnect. On reconnect: `request_state` with roomCode — `useGameState` handles the response.

**`useGameState` hook**: subscribes to `game_started`, `block_claimed`, `game_tick`, `game_over` and applies each payload to `game.store` via the appropriate action. Registered inside `Game.tsx` and `Lobby.tsx`.

---

## R-005 — OTP input: 6-box auto-advancing field

**Decision**: Re-use the existing `OtpField` component already shipped in `components/ui/OtpField.tsx` (Phase 1). It implements 6 controlled inputs with `onKeyDown` auto-advance, paste handling, and backward delete. No new library needed.

**Rationale**: The component already exists and matches the design handoff. Building from scratch or adding a third-party lib would violate the "no speculative components" rule.

---

## R-006 — Game grid rendering strategy

**Decision**: Render the game grid as a CSS grid container (`display: grid; grid-template-columns: repeat(size, 1fr)`). Each cell is a `<GridCell>` component (already implemented in Phase 1). The grid is stored in `game.store` as a 2D array `Block[][]`. On `block_claimed`, only the affected cell's `claimedBy` and `teamColor` fields update — React reconciler diffs only that cell.

**Rationale**: A flat grid array avoids nested loops on every render. CSS grid auto-sizes cells to fill the container. `GridCell` is already implemented with `claimPulse` animation on newly-claimed state transitions.

**Viewport overflow**: Grid is wrapped in a `overflow: auto` container so large boards (up to 50×50) scroll. The HUD bar uses `position: sticky` so it stays visible regardless of scroll.

---

## R-007 — Dependency additions required

The following packages are NOT yet in `apps/frontend/package.json` and must be added:

| Package                 | Version | Purpose                                         |
| ----------------------- | ------- | ----------------------------------------------- |
| `react-router-dom`      | ^6.26   | Client-side routing                             |
| `zustand`               | ^4.5    | Client state management                         |
| `socket.io-client`      | ^4.7    | WebSocket client                                |
| `axios`                 | ^1.7    | HTTP client with interceptors                   |
| `@tanstack/react-query` | ^5.56   | Server state (profile/match history pagination) |

Installation: `pnpm --filter @zonite/frontend add react-router-dom zustand socket.io-client axios @tanstack/react-query`

**`@tanstack/react-query` usage**: Only for `GET /api/profile` and paginated `GET /api/rooms` on the Profile and Home screens. All game-loop data flows through Zustand + socket events.
