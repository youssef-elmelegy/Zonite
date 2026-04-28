# Data Model: Game Screens & Account Screens — Phase 7

_Phase 1 design output. New DB entities only — frontend state entities are unchanged from Phase 6 (see `specs/005-frontend-foundation/data-model.md`)._

---

## DB Migration 1 — Extend `users` table

**File**: `apps/backend/src/db/migrations/0002_add_display_name_xp.sql`

| Column added | Type      | Constraint | Default |
| ------------ | --------- | ---------- | ------- |
| `fullName`   | `TEXT`    | NOT NULL   | `''`    |
| `xp`         | `INTEGER` | NOT NULL   | `0`     |

**Drizzle schema change** (`apps/backend/src/db/schema/users.ts`):

```typescript
fullName: text("display_name").notNull().default(''),
xp: integer("xp").notNull().default(0),
```

**Shared type update** (`packages/shared/src/auth/user.ts`):

```typescript
export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  fullName: string; // ← added
}
```

This field must be included in both the access token JWT payload and every `CurrentUser` response body so the gateway and frontend never need a DB lookup for display names.

---

## DB Migration 2 — `match_player_records` table

**File**: `apps/backend/src/db/migrations/0003_match_player_records.sql`

| Column          | Type                        | Constraint                                    |
| --------------- | --------------------------- | --------------------------------------------- |
| `id`            | `UUID`                      | PK, `gen_random_uuid()`                       |
| `userId`        | `UUID`                      | NOT NULL, FK → `users.id` ON DELETE CASCADE   |
| `roomId`        | `UUID`                      | FK → `rooms.id` ON DELETE SET NULL (nullable) |
| `gameMode`      | `TEXT` (`'SOLO' \| 'TEAM'`) | NOT NULL                                      |
| `gridSize`      | `INTEGER`                   | NOT NULL                                      |
| `won`           | `BOOLEAN`                   | NOT NULL                                      |
| `blocksClaimed` | `INTEGER`                   | NOT NULL, default `0`                         |
| `xpEarned`      | `INTEGER`                   | NOT NULL, default `0`                         |
| `playedAt`      | `TIMESTAMP WITH TIME ZONE`  | NOT NULL, default `now()`                     |

**Indexes**:

- `(userId, playedAt DESC)` — for paginated match history and streak computation
- `(roomId)` — for potential room-level stats in Phase 8

**Drizzle schema** (`apps/backend/src/db/schema/match-history.ts`):

```typescript
export const matchPlayerRecords = pgTable(
  'match_player_records',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    gameMode: text('game_mode').$type<'SOLO' | 'TEAM'>().notNull(),
    gridSize: integer('grid_size').notNull(),
    won: boolean('won').notNull(),
    blocksClaimed: integer('blocks_claimed').notNull().default(0),
    xpEarned: integer('xp_earned').notNull().default(0),
    playedAt: timestamp('played_at', { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    userPlayedAtIdx: index('match_player_records_user_played_at_idx').on(t.userId, t.playedAt),
    roomIdx: index('match_player_records_room_id_idx').on(t.roomId),
  }),
);
```

---

## Backend module: `AuthModule` (completion)

The existing `AuthModule` has only `JwtModule` and `AccessTokenStrategy`. Phase 7 adds:

### `AuthController` (`modules/auth/controllers/auth.controller.ts`)

| Method | Path                    | Guard               | Description                  |
| ------ | ----------------------- | ------------------- | ---------------------------- |
| `POST` | `/auth/register`        | `@Public()`         | Create account               |
| `POST` | `/auth/login`           | `@Public()`         | Authenticate                 |
| `POST` | `/auth/refresh`         | `RefreshTokenGuard` | Rotate tokens                |
| `POST` | `/auth/logout`          | `JwtAuthGuard`      | Invalidate nonce             |
| `POST` | `/auth/forgot-password` | `@Public()`         | Generate OTP                 |
| `POST` | `/auth/reset-password`  | `@Public()`         | Verify OTP + update password |

### `AuthService` (`modules/auth/services/auth.service.ts`)

| Method                         | Key behaviour                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `register(dto)`                | Hash password with bcrypt, insert user with fullName, generate tokens + nonce    |
| `login(dto)`                   | Verify email+password, generate tokens + nonce, return tokens + CurrentUser      |
| `refreshTokens(userId, nonce)` | Called by RefreshTokenGuard — verify nonce matches DB, rotate, return new tokens |
| `logout(userId)`               | Set `refreshTokenNonce = null`                                                   |
| `forgotPassword(email)`        | Generate 6-digit OTP, SHA-256 hash it, store hash + 10min expiry in user row     |
| `resetPassword(dto)`           | Verify OTP hash + expiry, hash new password, clear OTP fields                    |

### Auth DTOs (`modules/auth/dto/`)

| DTO                 | Fields                                                  |
| ------------------- | ------------------------------------------------------- |
| `RegisterDto`       | `email: string`, `password: string`, `fullName: string` |
| `LoginDto`          | `email: string`, `password: string`                     |
| `ForgotPasswordDto` | `email: string`                                         |
| `ResetPasswordDto`  | `email: string`, `otp: string`, `newPassword: string`   |

### `RefreshTokenStrategy` (`common/strategies/refresh-token.strategy.ts`)

Passport strategy that verifies the refresh JWT using `REFRESH_SECRET`, fetches the user, and checks `user.refreshTokenNonce === payload.nonce`.

---

## Backend module: `ProfileModule` (new)

**Path**: `apps/backend/src/modules/profile/`

### `ProfileController`

| Method | Path               | Guard          | Description                    |
| ------ | ------------------ | -------------- | ------------------------------ |
| `GET`  | `/profile`         | `JwtAuthGuard` | Current user's profile + stats |
| `GET`  | `/profile/matches` | `JwtAuthGuard` | Paginated match history        |

### `ProfileService`

| Method                                 | Description                                                                   |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `getProfile(userId)`                   | Fetches user row + computes stats aggregates from `match_player_records`      |
| `getmatchPlayerRecords(userId, query)` | Paginated query on `match_player_records` ordered by `playedAt DESC`          |
| `recordMatchResults(results, roomId)`  | Called from `GameGateway.onGameOver` — bulk inserts rows, updates XP on users |

### Profile response shape

```typescript
// GET /api/profile response data
{
  id: string;
  fullName: string;
  email: string;
  xp: number;
  joinedAt: string; // ISO string
  stats: {
    matches: number;
    wins: number;
    blocksClaimed: number;
    currentStreak: number;
  }
}

// GET /api/profile/matches response data (per item)
{
  id: string;
  won: boolean;
  mode: GameMode;
  gridSize: number;
  roomCode: string | null; // null if room deleted
  blocksClaimed: number;
  xpEarned: number;
  playedAt: string;
}
// Wrapped in Sikka PaginatedResponse<T>
```

---

## Frontend: new component `MiniGridArt`

**Path**: `apps/frontend/src/components/common/MiniGridArt.tsx`

A purely decorative animated `4×4` grid using the `gridDrift` and `claimPulse` keyframes. No props. Each cell has a random animation delay so they appear to pulse organically. Used only inside `AuthLayout`'s hero column.

---

## Frontend: new component `AuthLayout`

**Path**: `apps/frontend/src/components/layout/AuthLayout.tsx`

```typescript
interface AuthLayoutProps {
  children: React.ReactNode;
}
```

Renders the two-column auth shell:

- Left (desktop): dark hero with fire gradient, `MiniGridArt`, game tagline
- Right: vertically centred glass card wrapping `children`

Used by: `Onboarding`, `Login`, `Signup`, `ForgotPassword`, `ResetPassword`.

---

## State transitions

### Auth lifecycle — registration path

```
First visit (no onboarded flag)
  → /onboarding  ──complete──►  /signup
                                   │
                              register()
                                   │
                            auth.store.setAuth()
                                   │
                               /home
```

### Auth lifecycle — password reset

```
/login  ──"Forgot password?"──►  /forgot
                                    │
                            forgotPassword(email)
                            [OTP logged to console in dev]
                                    │
                               /reset
                                    │
                       resetPassword(email, otp, newPassword)
                                    │
                     success toast + navigate /login
```

### Match history write path

```
GameGateway.onGameOver(results)
  → roomsService.transitionToFinished(code)
  → profileService.recordMatchResults(results, roomId)  ← new in Phase 7
      for each player in results.playerRankings:
        won = (player.rank === 1 in solo) OR (player.teamColor === winningTeam in team)
        xpEarned = 10 * score + (won ? 50 : 0)
        INSERT INTO match_player_records(...)
        UPDATE users SET xp = xp + xpEarned WHERE id = player.id
  → server.to(code).emit(GAME_OVER, results)
```

---

## Validation rules (Phase 7 additions)

| Entity                         | Field    | Rule                                              |
| ------------------------------ | -------- | ------------------------------------------------- |
| `RegisterDto.email`            | string   | Valid email format; unique in DB                  |
| `RegisterDto.password`         | string   | Min 8 chars                                       |
| `RegisterDto.fullName`         | string   | Min 2 chars, max 30 chars                         |
| `LoginDto.email`               | string   | Valid email format                                |
| `ResetPasswordDto.otp`         | string   | Exactly 6 digits                                  |
| `ResetPasswordDto.newPassword` | string   | Min 8 chars                                       |
| OTP expiry                     | DB field | 10 minutes; reject with specific error if expired |
