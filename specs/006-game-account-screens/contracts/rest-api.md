# REST API Contracts — Phase 7 (Game Screens & Account Screens)

All endpoints use the Sikka `SuccessResponse<T>` envelope. The Axios interceptor in `api.ts` unwraps `data` so service methods return `T` directly.

Base URL: `VITE_API_BASE_URL` (e.g., `http://localhost:3000/api`)

**New in Phase 7**: Auth HTTP endpoints (previously missing) and Profile endpoints.

---

## Auth Endpoints (`/api/auth`)

### POST /api/auth/register

```typescript
// Request body
{
  email: string;
  password: string; // min 8 chars
  fullName: string; // min 2, max 30 chars — the player's in-game username
}

// Response data (SuccessResponse<AuthResponse>)
{
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: number; // seconds
    refreshTokenExpiresIn: number;
  }
  user: {
    id: string;
    email: string;
    role: string;
    fullName: string;
  }
}

// Error cases
// 409 Conflict — email already registered
// 422 Unprocessable — validation failure (field-level errors)
```

Called by: `auth.service.register()` → `auth.store.setAuth()` → navigate `/home`

---

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
  user: CurrentUser; // includes fullName
}

// Error cases
// 401 Unauthorized — invalid credentials
```

Called by: `auth.service.login()` → `auth.store.setAuth()` → navigate `/home`

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

// Error cases
// 401 Unauthorized — invalid, expired, or nonce-mismatch refresh token
```

Called by: Axios 401 interceptor in `api.ts`. On success: `auth.store.setAuth()` and drain the pending request queue. On 401: `auth.store.clearAuth()` + redirect `/login`.

---

### POST /api/auth/logout

```typescript
// Request body — none
// Headers: Authorization: Bearer <accessToken>

// Response data
{
  message: 'Logged out successfully';
}
```

Called by: `auth.service.logout()` from `Profile.tsx` sign-out confirm → `auth.store.clearAuth()` → navigate `/login`.

---

### POST /api/auth/forgot-password

```typescript
// Request body
{
  email: string;
}

// Response data
{
  message: 'OTP sent to <email>';
}

// Note: always returns 200 even if email not found (security — don't confirm email existence)
// Dev: OTP is also printed to backend console log.
```

Called by: `auth.service.forgotPassword()` from `ForgotPassword.tsx` → navigate `/reset`

---

### POST /api/auth/reset-password

```typescript
// Request body
{
  email: string;
  otp: string; // exactly 6 digits
  newPassword: string; // min 8 chars
}

// Response data
{
  message: 'Password reset successfully';
}

// Error cases
// 400 Bad Request — OTP invalid or expired (with specific message)
// 404 Not Found — email not found
```

Called by: `auth.service.resetPassword()` from `ResetPassword.tsx` → success toast → navigate `/login`

---

## Profile Endpoints (`/api/profile`)

All profile endpoints require `Authorization: Bearer <accessToken>`.

### GET /api/profile

```typescript
// Response data
{
  id: string;
  fullName: string;
  email: string;
  xp: number;
  joinedAt: string; // ISO 8601 timestamp
  stats: {
    matches: number;
    wins: number;
    blocksClaimed: number;
    currentStreak: number;
  }
}
```

Called by: TanStack Query in `Profile.tsx` (`queryKey: ['profile']`). Cached for 30 seconds (default `staleTime` in `App.tsx`).

---

### GET /api/profile/matches

Paginated via Sikka `PaginationQueryDto` (`?page=1&pageSize=10`).

```typescript
// Query params
page?: number;      // default 1
pageSize?: number;  // default 10

// Response (PaginatedResponse<matchPlayerRecordsItem>)
{
  data: matchPlayerRecordsItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface matchPlayerRecordsItem {
  id: string;
  won: boolean;
  mode: GameMode;       // 'SOLO' | 'TEAM'
  gridSize: number;
  roomCode: string | null;
  blocksClaimed: number;
  xpEarned: number;
  playedAt: string;    // ISO 8601
}
```

Called by: TanStack `useInfiniteQuery` in `Profile.tsx` (`queryKey: ['matches']`).

---

## Room Endpoints (unchanged from Phase 6)

Refer to `specs/005-frontend-foundation/contracts/rest-api.md`.

---

## Error shape (unchanged from Phase 6)

```typescript
interface ErrorResponse {
  message: string | string[];
  statusCode: number;
  errors?: Record<string, string[]>;
}
```

Auth screen forms catch `err.response.data.message` and surface it as an inline field error. A string error displays at form-level; a `Record<string, string[]>` error maps to specific fields.

---

## Home screen stats source

`Home.tsx` (Phase 7) calls `GET /api/profile` and renders:

- `stats.matches` → "Matches Played"
- `stats.wins` → "Wins"
- Computed win rate = `(stats.wins / stats.matches * 100).toFixed(0) + '%'` (or `'—'` if 0 matches)

This replaces the current `'—'` placeholder values.
