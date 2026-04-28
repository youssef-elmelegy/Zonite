# Quickstart: Frontend Foundation — Phase 6

---

## Prerequisites

- Node.js 22 LTS (see `.nvmrc`)
- pnpm 9+
- Docker + Docker Compose (for backend + PostgreSQL)
- Phase 1 design tokens adopted (`apps/frontend/src/styles/tokens.css` exists)
- Phase 2–5 backend running (`docker compose up backend postgres`)

---

## 1. Install new frontend dependencies

```bash
pnpm --filter @zonite/frontend add \
  react-router-dom \
  zustand \
  socket.io-client \
  axios \
  @tanstack/react-query
```

Verify `apps/frontend/package.json` now lists all five packages.

---

## 2. Environment variables

Add to `apps/frontend/.env.local` (create if absent):

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

The production equivalents go in `.env.example` at the repo root (already exists; add these keys with placeholder values).

---

## 3. Run the full stack

```bash
# Terminal 1 — backend + postgres
docker compose up backend postgres

# Terminal 2 — frontend dev server
pnpm --filter @zonite/frontend dev
```

Frontend dev server starts at `http://localhost:5173`.

---

## 4. Verify the showcase still works

```
http://localhost:5173/_showcase
```

All Phase 1 components (layout, ui, common, game) must still render correctly. This is a quick regression check — if the showcase breaks, a Phase 1 import was accidentally modified.

---

## 5. Smoke-test the auth flow

1. Open `http://localhost:5173`
2. Onboarding carousel should appear (3 steps).
3. Complete onboarding → Sign Up page.
4. Register with `test@zonite.io` / `Password123!`.
5. Home screen should appear with player chip in the top bar.
6. Refresh the page → still authenticated (Zustand persist).
7. Click the player chip → Profile screen.
8. Sign out → Login screen (onboarding NOT shown again).

---

## 6. Smoke-test the game loop

1. Open two browser windows (or incognito) at `http://localhost:5173`.
2. Sign in with two different accounts in each window.
3. Window 1: Create Room (Solo, 5×5, 30s, 2 players) → note the room code.
4. Window 2: Join Room with that code.
5. Both windows: mark ready.
6. Window 1 (host): click Start Game.
7. Both windows: should see the 5×5 grid and the countdown.
8. Click cells in window 1 → cells update in both windows after ~100ms.
9. Wait for countdown → Results screen appears in both windows.

---

## 7. Type-check pass

```bash
pnpm type-check
```

Must produce zero errors. `@zonite/shared` types are resolved via workspace: protocol — if types are not found, run `pnpm install` from the root first.

---

## Key file locations

| File                                    | Purpose                             |
| --------------------------------------- | ----------------------------------- |
| `apps/frontend/src/router/index.tsx`    | All routes + ProtectedRoute wrapper |
| `apps/frontend/src/store/auth.store.ts` | Persisted auth state                |
| `apps/frontend/src/store/game.store.ts` | Real-time game state                |
| `apps/frontend/src/services/api.ts`     | Axios instance + interceptors       |
| `apps/frontend/src/hooks/useSocket.ts`  | Socket.io connection lifecycle      |
| `apps/frontend/src/pages/`              | All 12 page components              |
| `apps/frontend/src/types/index.ts`      | Re-export of `@zonite/shared`       |
