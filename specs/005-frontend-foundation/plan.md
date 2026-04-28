# Implementation Plan: Frontend Foundation — Zonite Client App

**Branch**: `005-frontend-foundation` | **Date**: 2026-04-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-frontend-foundation/spec.md`

---

## Summary

Phase 6 wires the existing Vite + React + TypeScript frontend (which already has all design tokens, UI primitives, layout components, and GridCell from Phase 1) into a fully routed, authenticated, real-time-connected SPA. The deliverables are: react-router-dom v6 routing with protected routes, three Zustand stores (auth / room / game), an Axios service with 401-refresh interceptors, a `useSocket` hook connecting to the `/game` WebSocket namespace with JWT auth, and all 12 page-level components (5 auth screens + Home + CreateRoom + Lobby + Game + Results + Profile). Type re-exports from `@zonite/shared` and a constants barrel for socket event names complete the frontend contract layer.

---

## Technical Context

**Language/Version**: TypeScript ^5.7 (strict), Node.js 22 LTS  
**Primary Dependencies (to be added)**: `react-router-dom` v6, `zustand` ^4, `zustand/middleware` (persist), `socket.io-client`, `axios`, `@tanstack/react-query` v5  
**Already installed**: `react` ^18.3, `vite` ^5, `tailwindcss` ^3, `clsx`, `lucide-react`, `@zonite/shared` (workspace)  
**Storage**: Browser `localStorage` via `zustand/middleware/persist` (auth store only)  
**Testing**: Type-check via `tsc --noEmit`; visual verification against design handoff  
**Target Platform**: Web browser, desktop-first, responsive to mobile  
**Project Type**: Single-Page Application (SPA) within existing monorepo  
**Performance Goals**: Page hydration < 1 s; board update < 300 ms after `block_claimed`; countdown tick < 100 ms  
**Constraints**: No hex values outside `tokens.css`; `game.store` populated only from socket events; socket auth via `handshake.auth.token`; server-authoritative block claim (no optimistic update)  
**Scale/Scope**: 12 page components, 3 Zustand stores, 4 service modules, 2 hooks, 1 router config

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                               | Status                       | Notes                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I — Shared Contract**                 | ✅ PASS                      | All socket event names consumed via `GameEvents` / `RoomEvents` from `@zonite/shared`. All payload types (`GameState`, `RoomState`, `LobbyPlayer`, `Results`, `Block`, `AuthTokens`, `CurrentUser`) imported from `@zonite/shared`. No string literals at socket call sites. `types/index.ts` re-exports only — no re-declarations. |
| **II — Sikka Backend Parity**           | ✅ PASS (frontend exemption) | Phase 6 touches only `apps/frontend/`. No backend modules modified. Axios unwraps Sikka `SuccessResponse<T>` envelope in the response interceptor — client aligns with server shape.                                                                                                                                                |
| **III — Yalgamers Design Fidelity**     | ✅ PASS                      | All colors via `--token` CSS vars already enforced by the `color-no-hex` stylelint rule and the `no-hex-in-jsx` ESLint rule from Phase 1. Typography uses `--font-ui` (Mulish) / `--font-display` (Bruno Ace SC). Pages use existing `Shell`, `TopBar`, `CornerBlobs`, `GridBg`, `PlayerChip` from `components/layout/`.            |
| **IV — Authoritative Real-Time Server** | ✅ PASS                      | `game.store` state (grid, scores, timer) updated only on: `game_started`, `block_claimed`, `game_tick`, `game_over` socket events. No REST calls during gameplay. Cell click emits `claim_block`; cell color updates only after `block_claimed` broadcast. Reconnect emits `request_state` and awaits full snapshot.                |
| **V — Spekit Docs**                     | ✅ REQUIRED                  | Three new Speks must accompany Phase 6 PR: "Auth flow UX", "Frontend state management guide", "Route guards and auth-store hydration".                                                                                                                                                                                              |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-frontend-foundation/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   ├── rest-api.md      ← REST endpoint shapes
│   └── socket-events.md ← WebSocket event shapes (client↔server)
└── tasks.md             ← Phase 2 output (generated by /speckit.tasks)
```

### Source Code

```text
apps/frontend/src/
├── styles/             ← ALREADY EXISTS (Phase 1) — tokens, animations, overlays, tailwind
├── components/         ← ALREADY EXISTS (Phase 1) — layout/, ui/, common/, game/
│
├── pages/              ← NEW (Phase 6)
│   ├── auth/
│   │   ├── Onboarding.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── Home.tsx
│   ├── CreateRoom.tsx
│   ├── Lobby.tsx
│   ├── Game.tsx
│   ├── Results.tsx
│   └── Profile.tsx
│
├── hooks/              ← NEW (Phase 6)
│   ├── useSocket.ts    ← socket.io-client lifecycle, isConnected, typed emit/on
│   ├── useGameState.ts ← subscribes to game socket events, updates game.store
│   └── useAuth.ts      ← reads auth.store, exposes login/logout helpers
│
├── store/              ← NEW (Phase 6)
│   ├── auth.store.ts   ← Zustand + persist: user, accessToken, refreshToken, onboarded
│   ├── room.store.ts   ← Zustand: roomCode, players, roomConfig, myTeam
│   └── game.store.ts   ← Zustand: grid (flat Block[]), playerScores, teamScores, status, remainingTime
│
├── services/           ← NEW (Phase 6)
│   ├── api.ts          ← Axios instance, JWT interceptor, 401-refresh logic
│   ├── auth.service.ts ← login, signup, refresh, forgotPassword, resetPassword, logout
│   ├── room.service.ts ← createRoom, getRoom
│   └── profile.service.ts ← getProfile, getmatchPlayerRecords (paginated)
│
├── types/              ← NEW (Phase 6)
│   └── index.ts        ← re-export everything from @zonite/shared
│
├── router/             ← NEW (Phase 6)
│   ├── index.tsx       ← createBrowserRouter, route tree
│   └── ProtectedRoute.tsx ← reads auth.store, redirects to /login or /onboarding
│
├── App.tsx             ← UPDATED: replace placeholder with RouterProvider
└── main.tsx            ← NO CHANGE (already wires styles + StrictMode)
```

**Structure Decision**: Single SPA inside `apps/frontend/`. All Phase 1 files are untouched. Phase 6 adds four new top-level directories (`pages/`, `hooks/`, `store/`, `services/`, `router/`) and `types/index.ts`. The showcase at `/_showcase` continues to function unchanged.

---

## Complexity Tracking

_No constitution violations. No entries required._
