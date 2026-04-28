# REST API Contracts — Frontend Consumption (Phase 6)

All endpoints return the Sikka `SuccessResponse<T>` envelope:

```typescript
// From @zonite/shared/http/envelope
interface SuccessResponse<T> {
  data: T;
  meta?: PaginationMeta;
}
```

The Axios response interceptor unwraps `data` so service methods return `T` directly.

Base URL: `VITE_API_BASE_URL` (e.g., `http://localhost:3000/api`)

---

## Auth Endpoints (`/api/auth`)

### POST /api/auth/login

```typescript
// Request body
{
  email: string;
  password: string;
}

// Response data
{
  tokens: AuthTokens;
  user: CurrentUser;
}
// AuthTokens from @zonite/shared:
// { accessToken, refreshToken?, accessTokenExpiresIn, refreshTokenExpiresIn }
// CurrentUser from @zonite/shared:
// { id: string; email: string; role: 'user' | 'admin' }
```

Called by: `auth.service.login()`, then `auth.store.setAuth()`

---

### POST /api/auth/register

```typescript
// Request body
{ email: string; password: string; fullName?: string }

// Response data
{ tokens: AuthTokens; user: CurrentUser }
```

Called by: `auth.service.register()`, then `auth.store.setAuth()`

---

### POST /api/auth/refresh

```typescript
// Request body
{
  refreshToken: string;
}

// Response data
{
  tokens: AuthTokens;
  user: CurrentUser;
}
```

Called by: Axios 401 interceptor in `api.ts`. On success: `auth.store.setAuth()`. On 401: `auth.store.clearAuth()` + redirect to `/login`.

---

### POST /api/auth/forgot-password

```typescript
// Request body
{
  email: string;
}

// Response data
{
  message: string;
} // e.g., "OTP sent to your email"
```

Called by: `auth.service.forgotPassword()` from `ForgotPassword.tsx`

---

### POST /api/auth/reset-password

```typescript
// Request body
{
  email: string;
  otp: string;
  newPassword: string;
}

// Response data
{
  message: string;
}
```

Called by: `auth.service.resetPassword()` from `ResetPassword.tsx`

---

### POST /api/auth/logout

```typescript
// Request body — none
// Headers: Authorization: Bearer <accessToken>

// Response data
{
  message: string;
}
```

Called by: `auth.service.logout()` from `Profile.tsx` sign-out confirm. Followed by `auth.store.clearAuth()`.

---

## Room Endpoints (`/api/rooms`)

### POST /api/rooms

```typescript
// Request body (matches CreateRoomDto on backend)
{
  gameMode: GameMode; // 'SOLO' | 'TEAM'
  gridSize: number; // 5–50
  durationSeconds: number; // 30–300
  maxPlayers: number; // 2–10
}

// Response data
{
  id: string;
  code: string; // 6-char room code, e.g., "ZX7K4P"
  status: 'LOBBY';
  hostUserId: string;
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  createdAt: string;
}
```

Called by: `room.service.createRoom()` from `CreateRoom.tsx`. On success: `room.store.setRoom()` + navigate to `/lobby/:code`.

---

### GET /api/rooms/:code

```typescript
// Response data
{
  id: string;
  code: string;
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  hostUserId: string;
  gameMode: GameMode;
  gridSize: number;
  durationSeconds: number;
  maxPlayers: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}
```

Called by: `room.service.getRoom(code)` — used when joining by code from the Home screen to verify room exists before emitting `join_room`.

---

## Profile Endpoints (`/api/profile` — placeholder shape)

These are consumed by TanStack Query in `Profile.tsx` for paginated display. Exact endpoint paths depend on backend Phase 7+; stubs return mock data in Phase 6.

### GET /api/profile (authenticated)

```typescript
// Response data
{
  id: string;
  fullName: string;
  email: string;
  xp: number;
  joinedAt: string;
  stats: {
    matches: number;
    wins: number;
    blocksClaimed: number;
    currentStreak: number;
  }
}
```

### GET /api/profile/matches?page=N&limit=10 (authenticated, paginated)

```typescript
// Response data
matchPlayerRecordsItem[]
// meta: PaginationMeta (from @zonite/shared/http)

interface matchPlayerRecordsItem {
  id: string;
  won: boolean;
  mode: GameMode;
  gridSize: number;
  roomCode: string;
  blocksClaimed: number;
  xpEarned: number;
  playedAt: string;
}
```

---

## Error shape

All errors use the Sikka `ErrorResponse` shape. The Axios interceptor passes errors through; service methods handle them via try/catch and surface to the UI as form-level error strings.

```typescript
interface ErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
```
