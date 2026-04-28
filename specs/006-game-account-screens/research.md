# Research: Game Screens & Account Screens — Phase 7

_Generated during `/speckit.plan` Phase 0_

---

## R-001 — Auth service: nonce-based refresh token pattern

**Decision**: Implement auth using `users.refreshTokenNonce` (UUID) instead of a full session table.

**Rationale**: The `users` schema already has `refreshTokenNonce TEXT` and `resetOtpHash / otpExpiresAt` columns. Spinning up a full `auth_sessions` table (Sikka pattern) would require a new migration and is overkill for Phase 7. The nonce pattern enforces single-device invalidation: the refresh JWT payload carries a `nonce` field; the guard fetches the user row and checks `decoded.nonce === user.refreshTokenNonce`. On each refresh, a new UUID nonce is generated and the column is updated (rotation). On logout, the column is set to null.

**Token generation**:

- Access token: `jwtService.sign({ sub: userId, email, role }, { secret: ACCESS_SECRET, expiresIn: ACCESS_EXPIRES })`
- Refresh token: `jwtService.sign({ sub: userId, nonce }, { secret: REFRESH_SECRET, expiresIn: REFRESH_EXPIRES })`

**Alternatives considered**:

- Full `auth_sessions` table (Sikka pattern): correct but heavyweight for Phase 7; can be upgraded later.
- Stateless refresh (no nonce): doesn't support logout invalidation; rejected.

---

## R-002 — OTP delivery: dev console logging

**Decision**: `POST /api/auth/forgot-password` generates a 6-digit OTP, hashes it (SHA-256), stores the hash + 10-minute expiry in `users.resetOtpHash` and `users.otpExpiresAt`, then **logs the OTP to the console** in development. In production, it calls a `nodemailer` transport configured via env (`SMTP_*` vars). The endpoint returns `{ message: "OTP sent to <email>" }` in all environments.

**Rationale**: `nodemailer` is already installed. A `DEV_MAIL_LOG=true` env flag routes mail to console output only (no external SMTP required), making local development self-contained. The test flow is: call forgot-password, copy OTP from terminal log, paste into the Reset Password form.

**OTP format**: 6-digit numeric string (e.g., `"042371"`). `crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')`. Stored as SHA-256 hex hash.

**Alternatives considered**:

- Ethereal.email (nodemailer test transport): requires internet; adds complexity for local dev.
- Return OTP in response body in dev: exposes credential in network traffic; rejected even for dev.

---

## R-003 — fullName and XP: extend `users` table

**Decision**: Add two columns to the `users` table via a new Drizzle migration:

- `fullName TEXT NOT NULL DEFAULT ''` — set on registration; derived from the `username` field in the register DTO.
- `xp INTEGER NOT NULL DEFAULT 0` — incremented by `ProfileService.recordMatchResults()` at game end.

**Rationale**: `fullName` is referenced in `CurrentUser` (from `@zonite/shared`) and in the gateway's `LobbyPlayer.fullName`. It must be stored in the users row so any module can read it without a join. XP accumulates over time and must be persisted to the DB.

**Shared type update**: `CurrentUser` (in `packages/shared/src/auth/user.ts`) needs `fullName: string` added so all JWT payloads and socket guards carry it without a DB lookup.

**Alternatives considered**:

- Separate `user_profiles` table: cleaner but adds a join everywhere; unnecessary for Phase 7.
- Derive fullName from email prefix at runtime: loses user-chosen names; rejected.

---

## R-004 — match_player_records table: persist game results at game end

**Decision**: Create a new `match_player_records` Drizzle table. `GameGateway.onGameOver` calls `ProfileService.recordMatchResults(results, playerIds)` which bulk-inserts one row per player and updates `users.xp`.

**Schema**:

```
match_player_records(
  id              UUID PK DEFAULT gen_random_uuid()
  userId          UUID FK → users.id (ON DELETE CASCADE)
  roomId          UUID FK → rooms.id (ON DELETE SET NULL)
  gameMode        TEXT ('SOLO' | 'TEAM')
  gridSize        INTEGER
  won             BOOLEAN
  blocksClaimed   INTEGER
  xpEarned        INTEGER
  playedAt        TIMESTAMP WITH TIME ZONE DEFAULT now()
)
Indexes: idx on (userId, playedAt DESC)
```

**XP formula**: `10 * blocksClaimed + (won ? 50 : 0)`. Simple for Phase 7.

**Winner determination**:

- Solo: the player with `rank === 1` in `Results.playerRankings` wins.
- Team: players whose `teamColor` matches the winning team win.

**Alternatives considered**:

- Persist in a separate `MatchModule`: adds module overhead; `ProfileService` (owned by the new `ProfileModule`) is the natural owner.
- Compute stats from game state at query time without a history table: no historical record; rejected.

---

## R-005 — Profile stats: computed at query time from match_player_records

**Decision**: `ProfileService.getProfile()` runs three DB aggregates on `match_player_records` to build the stats object:

- `matches`: `COUNT(*)`
- `wins`: `COUNT(*) FILTER (WHERE won = true)`
- `blocksClaimed`: `SUM(blocks_claimed)`
- `currentStreak`: ordered subquery counting consecutive wins from most recent match.

**Streak computation**:

```sql
SELECT won FROM match_player_records
WHERE user_id = $1
ORDER BY played_at DESC
LIMIT 100
```

In service: iterate the rows; count consecutive `won = true` from the start; stop at the first loss.

**Rationale**: No separate stats table means a single source of truth. For Phase 7's usage patterns (Profile page load), the aggregate query is fast enough. A stats table can be added in Phase 8 if needed.

**Alternatives considered**:

- Materialized stats columns on `users`: cache staleness issues; rejected.
- Redis counter cache: no Redis in the stack (constitution constraint); rejected.

---

## R-006 — AuthLayout: two-column glass-card shell for auth screens

**Decision**: Extract a reusable `AuthLayout` component at `apps/frontend/src/components/layout/AuthLayout.tsx`. All 5 auth screens (Onboarding, Login, Signup, ForgotPassword, ResetPassword) use it as their root container.

**Layout spec** (from design handoff):

- Left column (hidden on mobile < 768px): fire-gradient hero area with `CornerBlobs`, game tagline, and animated `MiniGridArt`.
- Right column: vertically centred glass card (`bg-elevated`, `border-subtle` border, `radius-xl`, 400px max-width, padding sp-8).
- Full-height (`min-h-screen`), dark canvas background.

**MiniGridArt component**: A purely decorative `4×4` animated grid at `apps/frontend/src/components/common/MiniGridArt.tsx`. Cells pulse with random-delay `claimPulse` animations in brand colors. Uses the `gridDrift` keyframe from `animations.css`. Displayed only on the hero column.

**Alternatives considered**:

- Inline layout per screen: was the Phase 6 approach; violates the design handoff's requirement for visual consistency across auth screens.
- Single full-width layout: loses the hero illustration column; doesn't match the handoff.

---

## R-007 — Host ready-state: implicit ready on join

**Decision**: In `GameGateway.handleJoinRoom`, when the joining player is the room host (`room.hostUserId === user.id`), their `InternalLobbyPlayer.isReady` is set to `true` automatically. Non-host players must explicitly toggle ready. The "Start Game" button is enabled when `readyCount >= 2` (host counts). The host does NOT see a separate "Ready" toggle button.

**Rationale**: This matches the design handoff's Lobby prototype behavior (host's CTA is "Start Game", not "Ready"). It also matches the spec assumption: "joining the lobby implicitly marks the host as ready". The existing `Lobby.tsx` frontend logic already hides the Ready toggle for hosts and shows Start Game only for hosts — this is the correct wiring.

**Alternatives considered**:

- Host must explicitly ready up: contradicts design handoff; adds friction for the host path.

---

## R-008 — `QueryClientProvider` already wrapping App

**Decision**: `App.tsx` already wraps the app in `QueryClientProvider`. No change needed to enable TanStack Query in `Profile.tsx`. Only the backend profile endpoints need to be implemented for the queries to succeed.

---

## R-009 — Design fidelity gaps identified (frontend)

The following screens need specific design work to match the handoff. All changes are confined to the existing page files — no new pages required.

| Screen           | Gap                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| All auth screens | Replace current single-column layout with `AuthLayout` two-column glass-card                               |
| Onboarding       | Add `MiniGridArt` to the hero column                                                                       |
| Home             | Replace `—` stat placeholders with real values from `GET /api/profile`                                     |
| Lobby            | Add config summary row (mode · grid · duration · max players) + team badges in TEAM mode                   |
| Game             | Team mode: own blocks render with `opacity: 0.8` tint on top of team color for "lighter shade" distinction |
| Results          | Below podium top-3, add ranked list for remaining players (solo mode)                                      |

**Design system assets available** (from Phase 1 `tokens.css` + Phase 6 `animations.css`):

- `claimPulse`, `cellPulse`, `timerPulse`, `gridDrift`, `fadeUp` keyframes
- `--team-red`, `--team-blue`, `--team-red-soft`, `--team-blue-soft` CSS variables
- `--cell-empty`, `--cell-empty-border` variables

---

## R-010 — Dependency: bcrypt types

**Decision**: Backend already has `bcrypt` in dependencies. The `@types/bcrypt` dev dep is needed for TypeScript; verify it's in `devDependencies`. If missing, add `@types/bcrypt` in the Phase 7 implementation task.

---

## R-011 — Results route: use roomCode from state, not URL param

**Decision**: The results route is `/results` (no param). `GameGateway.onGameOver` pushes `game_over` with a `Results` payload; `useGameState` navigates to `/results`. The Results page reads `roomCode` from `room.store.roomCode` (already done in the existing `Results.tsx`). `useGameStore.grid` + `useGameStore.players` are already populated from the last `game_started` / `block_claimed` events and are not cleared until `clearGame()` is called.

**Fix needed**: `useGameState.ts` currently navigates to `/results` but doesn't store the full `Results` payload anywhere (only `game.store.setFinished()` is called). The game screen needs access to the final player rankings for the Results page. **Solution**: persist `Results` to a `resultsRef` in `useGameState` and either pass it via React context or use `game.store` which already has `players` + `grid`. Since `game.store.players` already has `score`, the Results page can re-compute rankings client-side from the store — no need to store the full server `Results` payload.
