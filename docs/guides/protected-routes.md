# Protected Routes Implementation Guide

## Context

This guide covers two things:

1. Updating the auth layer to use **HTTP-only cookies** (`withCredentials: true`) instead of Bearer tokens from localStorage.
2. Adding proper **protected routes** (redirect unauthenticated users to login) and **guest routes** (redirect already-authenticated users away from auth pages).

The backend already sets cookies on login/verify/refresh responses. The frontend currently reads tokens from the store and sends `Authorization: Bearer` headers — that needs to stop.

---

## Current State (what's broken / incomplete)

| File                        | Problem                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `services/api.ts`           | Sends `Authorization: Bearer <token>` from store. No `withCredentials`.                                    |
| `store/auth.store.ts`       | Stores `accessToken` + `refreshToken` in localStorage — unnecessary with cookies.                          |
| `services/auth.service.ts`  | `me()` points to `/auth/me` which doesn't exist. No `checkAuth()`.                                         |
| `App.tsx`                   | `AuthInitializer` only runs `me()` if `accessToken` is in store — cookie-based auth has no token in store. |
| `router/ProtectedRoute.tsx` | Validates only from localStorage — never calls the server. An expired cookie would still pass.             |
| `router/index.tsx`          | Auth pages have no guard — logged-in users can visit `/login`, `/signup`, etc.                             |
| `router/GuestRoute.tsx`     | Doesn't exist yet.                                                                                         |

---

## What We're Building

```
App load
  └─ AuthInitializer: always call GET /auth/check
       ├─ 200 → set user in store, set isServerVerified=true
       └─ 401 → clearAuth(), isServerVerified stays false

ProtectedRoute (wraps game pages)
  ├─ waiting for server check → show spinner
  ├─ isServerVerified=false + no user → redirect to /onboarding or /login
  └─ isServerVerified=true → render <Outlet />

GuestRoute (wraps /login, /signup, /onboarding only)
  ├─ waiting for server check → show spinner
  ├─ isServerVerified=true → redirect to /home
  └─ isServerVerified=false + no user → render <Outlet />
```

**Note:** `/forgot` and `/reset` are NOT wrapped with `GuestRoute` — they stay publicly accessible even when logged in.

---

## Step-by-Step Implementation

### Step 1 — `services/api.ts`

**Two changes:**

1. Add `withCredentials: true` to the axios instance config.
2. Remove the request interceptor that reads `accessToken` from the store and sets the `Authorization` header.
3. Update the refresh logic — it no longer sends `{ refreshToken }` in the body; the cookie is sent automatically via `withCredentials`. Change the refresh POST to just `api.post('/auth/refresh')` with no body.

The response interceptor (unwrap envelope, handle 401→refresh→retry) stays as-is, with the body change above.

**Final shape of the file:**

```ts
import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // ← added; sends cookies on every request
});

// ← DELETE the entire request interceptor that was here (the one that set Authorization header)

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
}> = [];

function drainQueue() {
  pendingQueue.forEach((p) => p.resolve(undefined));
  pendingQueue = [];
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach((p) => p.reject(err));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => {
    const data = response.data as { data?: unknown };
    if (data && typeof data === 'object' && 'data' in data) {
      response.data = data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const { clearAuth } = useAuthStore.getState();

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve: () => resolve(api(original)), reject });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Cookie is sent automatically — no body needed
      await api.post('/auth/refresh');
      drainQueue();
      return api(original);
    } catch (refreshError) {
      rejectQueue(refreshError);
      clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

---

### Step 2 — `store/auth.store.ts`

**Changes:**

- Remove `accessToken` and `refreshToken` fields and their persisted keys — cookies handle this now.
- Add `isServerVerified: boolean` (not persisted — resets to `false` on every page load).
- Add `setServerVerified: (v: boolean) => void` action.
- Update `setAuth` to accept only `user: CurrentUser` (no tokens argument).
- Keep `user`, `onboarded`, `isHydrated`, `clearAuth`, `setOnboarded` exactly as they are.

**Final shape:**

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CurrentUser } from '@zonite/shared';

interface AuthState {
  user: CurrentUser | null;
  onboarded: boolean;
  isHydrated: boolean;
  isServerVerified: boolean;
  setAuth: (user: CurrentUser) => void;
  clearAuth: () => void;
  setOnboarded: () => void;
  setServerVerified: (verified: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      onboarded: false,
      isHydrated: false,
      isServerVerified: false,
      setAuth: (user) => set({ user }),
      clearAuth: () =>
        set((s) => ({
          user: null,
          isServerVerified: false,
          onboarded: s.onboarded,
        })),
      setOnboarded: () => set({ onboarded: true }),
      setServerVerified: (verified) => set({ isServerVerified: verified }),
    }),
    {
      name: 'zonite-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        onboarded: state.onboarded,
        // isServerVerified intentionally excluded — must re-verify each session
      }),
      onRehydrateStorage: () => (_state) => {
        useAuthStore.setState({ isHydrated: true });
      },
    },
  ),
);
```

---

### Step 3 — `hooks/useAuth.ts`

Remove `accessToken`, `refreshToken`, and the `setAuth` token params. Update `isAuthenticated` to rely on `user` presence (not token) since tokens are in cookies.

```ts
import { useAuthStore } from '../store/auth.store';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useAuthStore((s) => s.onboarded);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isServerVerified = useAuthStore((s) => s.isServerVerified);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setOnboarded = useAuthStore((s) => s.setOnboarded);
  const setServerVerified = useAuthStore((s) => s.setServerVerified);

  return {
    user,
    onboarded,
    isHydrated,
    isServerVerified,
    isAuthenticated: !!user,
    setAuth,
    clearAuth,
    setOnboarded,
    setServerVerified,
  };
}
```

---

### Step 4 — `services/auth.service.ts`

**Changes:**

- Remove `me()` entirely.
- Add `checkAuth()` that calls `GET /auth/check`.
- Update `login()`, `register()`, and other methods that previously called `setAuth(data.tokens, data.user)` — now they call `setAuth(data.user)` (no tokens).
- The backend response for login/register still returns a `user` object inside the envelope `data` field. The axios response interceptor already unwraps the envelope, so `response.data` is the inner `data` object.

**`checkAuth` method to add:**

```ts
async checkAuth(): Promise<CurrentUser> {
  const { data } = await api.get<{ isAuthenticated: boolean; user: CurrentUser }>('/auth/check');
  useAuthStore.getState().setAuth(data.user);
  useAuthStore.getState().setServerVerified(true);
  return data.user;
},
```

**`login` update (example — apply the same pattern to `register`):**

```ts
async login(email: string, password: string): Promise<CurrentUser> {
  // Backend returns the full user object (AuthResponse) directly in envelope data
  const { data } = await api.post<CurrentUser>('/auth/login', { email, password });
  useAuthStore.getState().setAuth(data);
  return data;
},
```

**`logout` stays the same** — it calls `POST /auth/logout` and then `clearAuth()`.

---

### Step 5 — `App.tsx`

Replace `AuthInitializer` to always call `checkAuth()` on mount regardless of store state. With cookies there's no local token to check first — we just ask the server.

```tsx
function AuthInitializer() {
  useEffect(() => {
    void authService.checkAuth().catch(() => {
      // 401 → server said not authenticated; clearAuth already called inside checkAuth's
      // error path via the axios 401 interceptor → clearAuth() + redirect only if _retry fails.
      // Here we just suppress the unhandled rejection.
      useAuthStore.getState().clearAuth();
    });
  }, []);
  return null;
}
```

---

### Step 6 — `router/ProtectedRoute.tsx`

Replace the current implementation. The server check is now done in `AuthInitializer` (App.tsx), so `ProtectedRoute` only needs to:

1. Wait for localStorage hydration.
2. Wait for server verification (spinner while `checkAuth` is in-flight).
3. Redirect if not authenticated after verification completes.

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';
import { useEffect, useState } from 'react';

export function ProtectedRoute(): JSX.Element {
  const { isAuthenticated, isServerVerified, onboarded, isHydrated } = useAuth();
  const [persistHydrated, setPersistHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (persistHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setPersistHydrated(true));
    setPersistHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, [persistHydrated]);

  const hydrated = isHydrated || persistHydrated;

  // Phase 1: wait for localStorage to load
  if (!hydrated) return <LoadingDot />;

  // Phase 2: localStorage loaded, no user → redirect immediately (skip server call)
  if (!isAuthenticated) {
    return <Navigate to={onboarded ? '/login' : '/onboarding'} replace />;
  }

  // Phase 3: user exists in store but server hasn't confirmed yet → wait for AuthInitializer
  if (!isServerVerified) return <LoadingDot />;

  // Phase 4: server confirmed → render the protected page
  return <Outlet />;
}

function LoadingDot() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
      }}
    >
      <span
        className="z-loading-pulse"
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--accent-yellow)',
          display: 'inline-block',
        }}
      />
    </div>
  );
}
```

**Note:** `LoadingDot` can be extracted to `components/common/LoadingDot.tsx` and reused in `GuestRoute` — avoids duplication.

---

### Step 7 — `router/GuestRoute.tsx` (new file)

Create this file at `src/router/GuestRoute.tsx`.

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthStore } from '../store/auth.store';
import { useEffect, useState } from 'react';
import { LoadingDot } from '../components/common/LoadingDot'; // extract from ProtectedRoute

export function GuestRoute(): JSX.Element {
  const { isAuthenticated, isServerVerified, isHydrated } = useAuth();
  const [persistHydrated, setPersistHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (persistHydrated) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setPersistHydrated(true));
    setPersistHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, [persistHydrated]);

  const hydrated = isHydrated || persistHydrated;

  // Wait for localStorage
  if (!hydrated) return <LoadingDot />;

  // No user in store at all → let them through immediately (avoids waiting for server)
  if (!isAuthenticated) return <Outlet />;

  // User exists in store but server check still in-flight → wait
  if (!isServerVerified) return <LoadingDot />;

  // Server confirmed they're logged in → send them home
  return <Navigate to="/home" replace />;
}
```

---

### Step 8 — `router/index.tsx`

Wrap `/onboarding`, `/login`, `/signup` with `GuestRoute`. Leave `/forgot` and `/reset` unwrapped (accessible even when logged in).

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './GuestRoute';
import Onboarding from '../pages/auth/Onboarding';
import Login from '../pages/auth/Login';
import Signup from '../pages/auth/Signup';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import Home from '../pages/Home';
import CreateRoom from '../pages/CreateRoom';
import Lobby from '../pages/Lobby';
import Game from '../pages/Game';
import Results from '../pages/Results';
import Profile from '../pages/Profile';

export const router = createBrowserRouter([
  // Auth pages blocked for authenticated users
  {
    element: <GuestRoute />,
    children: [
      { path: '/onboarding', element: <Onboarding /> },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
    ],
  },
  // Auth pages always accessible (even when logged in)
  { path: '/forgot', element: <ForgotPassword /> },
  { path: '/reset', element: <ResetPassword /> },
  // Protected game pages
  {
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: '/home', element: <Home /> },
      { path: '/create', element: <CreateRoom /> },
      { path: '/lobby/:code', element: <Lobby /> },
      { path: '/game/:code', element: <Game /> },
      { path: '/results', element: <Results /> },
      { path: '/profile', element: <Profile /> },
    ],
  },
]);
```

---

## Summary of All Files Changed

| File                               | Action                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `services/api.ts`                  | Add `withCredentials: true`, remove Bearer interceptor, simplify refresh (no body) |
| `store/auth.store.ts`              | Remove token fields, add `isServerVerified` + `setServerVerified`                  |
| `hooks/useAuth.ts`                 | Remove token fields, expose `isServerVerified`                                     |
| `services/auth.service.ts`         | Replace `me()` with `checkAuth()`, update `setAuth` call sites                     |
| `App.tsx`                          | Update `AuthInitializer` to always call `checkAuth()`                              |
| `router/ProtectedRoute.tsx`        | Add `isServerVerified` gate, extract `LoadingDot`                                  |
| `router/GuestRoute.tsx`            | Create new file                                                                    |
| `router/index.tsx`                 | Wrap guest routes with `GuestRoute`                                                |
| `components/common/LoadingDot.tsx` | Extract from `ProtectedRoute` for reuse                                            |

## Important Notes for the Implementor

1. **`AuthInitializer` is the only place that calls `checkAuth()`** — `ProtectedRoute` and `GuestRoute` only read `isServerVerified` from the store, they don't trigger the call themselves. This means the check runs exactly once per page load, not once per navigation.

2. **`isServerVerified` is never persisted** — it resets to `false` on every browser refresh, forcing a fresh server check each session.

3. **The `clearAuth` action now also resets `isServerVerified: false`** — so after logout, a user visiting a protected route immediately gets the `!isAuthenticated` redirect without waiting for a server round-trip.

4. **The axios 401 interceptor calls `clearAuth()` and redirects to `/login`** when the refresh also fails. This handles the case where both the access and refresh cookies have expired.

5. **Don't add `withCredentials` to individual requests** — it's set globally on the `api` axios instance, so every call automatically sends cookies.
