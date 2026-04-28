# Tasks: Frontend Foundation — Zonite Client App

**Input**: Design documents from `specs/005-frontend-foundation/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: No test tasks generated — not requested in the feature spec. Type-check (`pnpm type-check`) and visual smoke tests (quickstart.md) serve as verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Phase 2 foundational tasks must complete before any user story phase begins.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P]-labeled tasks in the same phase (different files, no conflicts)
- **[Story]**: Maps to a user story from spec.md (US1–US6)
- All paths are relative to the monorepo root

---

## Phase 1: Setup

**Purpose**: Install new dependencies, configure environment variables, and create the shared types barrel. No user story work depends on each other here — all three tasks can start together once the branch is checked out.

- [x] T001 Install 5 new frontend dependencies in apps/frontend/ by running `pnpm --filter @zonite/frontend add react-router-dom zustand socket.io-client axios @tanstack/react-query` and verifying apps/frontend/package.json lists all five
- [x] T002 [P] Add VITE_API_BASE_URL=http://localhost:3000/api and VITE_SOCKET_URL=http://localhost:3000 to apps/frontend/.env.local (create if absent); add both keys with placeholder values to .env.example at the repo root
- [x] T003 [P] Create apps/frontend/src/types/index.ts as a barrel that re-exports everything from @zonite/shared using `export * from '@zonite/shared'`; no re-declarations or local type definitions

**Checkpoint**: All five packages appear in apps/frontend/package.json; types/index.ts compiles without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Zustand stores, Axios API layer, React Router config, and the App.tsx wiring. Every user story page and hook depends on these. **No user story phase can begin until this phase is complete.**

**⚠️ CRITICAL**: Stores T004–T006 can be written in parallel. T007 (api.ts) must come after T004 because the refresh interceptor calls `useAuthStore.getState()`. T008 and T009 can be parallel with T007. T010 and T011 must come after T009 (router needs the page stubs). T012 must be last (App.tsx wraps the router).

- [x] T004 [P] Create apps/frontend/src/store/auth.store.ts: Zustand store with `persist` middleware (localStorage key `'zonite-auth'`); state shape: `user: CurrentUser | null`, `accessToken: string | null`, `refreshToken: string | null`, `onboarded: boolean`, `isHydrated: boolean`; actions: `setAuth(tokens: AuthTokens, user: CurrentUser)`, `clearAuth()` (nulls tokens+user, preserves `onboarded`), `setOnboarded()` (sets `onboarded = true`); set `isHydrated = true` in the `onRehydrateStorage` callback
- [x] T005 [P] Create apps/frontend/src/store/room.store.ts: plain Zustand store (no persist); state: `roomCode: string | null`, `gameMode: GameMode | null`, `gridSize: number | null`, `durationSeconds: number | null`, `maxPlayers: number | null`, `players: LobbyPlayer[]`, `myTeam: TeamColor`; actions: `setRoom(code, config)`, `setPlayers(players)`, `addOrUpdatePlayer(p)`, `removePlayer(id)`, `clearRoom()` — all types from `@zonite/shared` via types/index.ts
- [x] T006 [P] Create apps/frontend/src/store/game.store.ts: plain Zustand store (no persist); state: `grid: Block[][]`, `players: Record<string, Player>`, `status: GameStatus`, `remainingSeconds: number`, `size: number`; actions: `setGameState(s: GameState)` (full replacement), `applyBlockClaim(block: Block)` (mutates only `grid[block.y][block.x]` and increments `players[block.claimedBy].score`), `tickTimer(remaining: number)`, `setFinished()`, `clearGame()` — invariant: `applyBlockClaim` is the ONLY mutation of a cell's `claimedBy`
- [x] T007 Create apps/frontend/src/services/api.ts: create a single Axios instance with `baseURL: import.meta.env.VITE_API_BASE_URL`; add a request interceptor that reads `useAuthStore.getState().accessToken` and sets `Authorization: Bearer <token>`; add a response interceptor that unwraps `SuccessResponse<T>.data` on success and on 401 implements the isRefreshing queue pattern: set `isRefreshing = true`, call POST /api/auth/refresh with `{ refreshToken }`, on success call `useAuthStore.getState().setAuth(...)` and drain the pending request queue, on refresh 401 call `useAuthStore.getState().clearAuth()` and redirect to `/login`
- [x] T008 [P] Create apps/frontend/src/hooks/useAuth.ts: reads `useAuthStore` (user, accessToken, onboarded, isHydrated); exposes `isAuthenticated: boolean`; re-exports the store's `setAuth`, `clearAuth`, `setOnboarded` actions for components that prefer the hook API over direct store access
- [x] T009 [P] Create apps/frontend/src/router/ProtectedRoute.tsx: reads `isHydrated` from auth.store — if false render a full-screen centered spinner (use existing Spinner component from components/ui/ or a simple CSS animation); if hydrated and `accessToken` is null navigate to `/onboarding` when `!onboarded` else `/login` (both with `replace`); if authenticated render `<Outlet />`
- [x] T010 Create all 12 page stub files under apps/frontend/src/pages/ as named minimal functional components: `pages/auth/Onboarding.tsx`, `pages/auth/Login.tsx`, `pages/auth/Signup.tsx`, `pages/auth/ForgotPassword.tsx`, `pages/auth/ResetPassword.tsx`, `pages/Home.tsx`, `pages/CreateRoom.tsx`, `pages/Lobby.tsx`, `pages/Game.tsx`, `pages/Results.tsx`, `pages/Profile.tsx` — each stub exports a default component returning a `<div>` with the page name; these will be replaced by their full implementations in subsequent phases
- [x] T011 Create apps/frontend/src/router/index.tsx using `createBrowserRouter`: unguarded routes at top level (element: `<AuthLayout />` or `<Outlet />`): `/onboarding` → Onboarding, `/login` → Login, `/signup` → Signup, `/forgot` → ForgotPassword, `/reset` → ResetPassword; protected routes wrapped in `<ProtectedRoute />`: `/home` → Home, `/create` → CreateRoom, `/lobby/:code` → Lobby, `/game/:code` → Game, `/results` → Results, `/profile` → Profile; index route `/` redirects to `/home`
- [x] T012 Update apps/frontend/src/App.tsx: remove the existing placeholder content and replace with `<RouterProvider router={router} />` importing `router` from `./router/index`; wrap the RouterProvider with `<QueryClientProvider client={queryClient}>` (new QueryClient) for TanStack Query

**Checkpoint**: `pnpm type-check` passes with zero errors; navigating to `http://localhost:5173/home` shows the ProtectedRoute spinner briefly then redirects to `/onboarding`; the showcase at `/_showcase` still renders correctly.

---

## Phase 3: User Story 1 — New Player Auth Flow (Priority: P1) 🎯 MVP

**Goal**: First-time visitor sees 3-step onboarding → completes onboarding → registers via signup form → lands on Home screen.

**Independent Test**: With no localStorage session, open the app — onboarding carousel appears; complete all 3 steps; fill signup form with valid credentials; Home screen appears with the player chip in the top bar. Mismatched passwords show an inline error and block submission.

- [x] T013 Create apps/frontend/src/services/auth.service.ts with a `register(email, password, fullName?)` method: POST to `/api/auth/register` using the Axios instance from api.ts; on success call `useAuthStore.getState().setAuth(data.tokens, data.user)` and return the response; on error re-throw the Sikka ErrorResponse so callers can display field-level messages
- [x] T014 [P] [US1] Implement pages/auth/Onboarding.tsx: replace the stub with a 3-step carousel matching the design handoff (step 1: "Claim Your Territory", step 2: "Solo or Team", step 3: "Real-Time Play"); each step uses the `fadeUp` CSS animation from animations.css; a "Next" button advances steps; on step 3 completion call `useAuthStore.getState().setOnboarded()` and `navigate('/signup')` using `useNavigate`; use `--font-display` for headline text and design token colors only
- [x] T015 [US1] Implement pages/auth/Signup.tsx: replace the stub with an email input, password input with live strength indicator (visual bar, no library), confirm password input; validate that passwords match before submit — show an inline error on the confirm field if they don't; on valid submit call `auth.service.register(...)`; on success navigate to `/home`; on API error display the message inline; use Shell + the existing form components from components/ui/; no hard-coded hex

**Checkpoint**: A user can open the app fresh, step through onboarding, and register a new account, landing on the stubbed Home page.

---

## Phase 4: User Story 2 — Returning Player Sign-In and Navigation (Priority: P1)

**Goal**: Existing player logs in → sees Home screen with hero + CTAs + player chip → navigates to Profile or lobby.

**Independent Test**: Enter valid credentials on Login → Home screen with fire-gradient hero and Create/Join CTAs; player chip in top bar shows display name; clicking chip opens Profile stub; entering a valid 6-char code in Join Room navigates to `/lobby/:code`; wrong credentials show an inline error.

- [x] T016 Add `login(email, password)` and `logout()` methods to apps/frontend/src/services/auth.service.ts: login POSTs to `/api/auth/login`, calls `setAuth` on success; logout POSTs to `/api/auth/logout` (bearer token attached automatically by api.ts), then calls `useAuthStore.getState().clearAuth()`
- [x] T017 [P] [US2] Implement pages/auth/Login.tsx: email + password form; on submit call `auth.service.login(...)`; on success navigate to `/home`; on error display a non-dismissible inline error message below the form (no field highlight); include a "Forgot password?" link navigating to `/forgot`; include scaffolded (non-functional) social auth button placeholders per design handoff; no hard-coded hex
- [x] T018 [US2] Implement pages/Home.tsx: fire-gradient "CLAIM YOUR TERRITORY" hero headline using `--font-display` and `--gradient-fire` token; "Create Room" CTA button navigates to `/create`; "Join Room" CTA expands inline to reveal a 6-char alphanumeric input — on submit validate exactly 6 chars (show inline error otherwise) then navigate to `/lobby/:code`; 3 mini stats panel (Active rounds, Online now, Season) with placeholder values; render the existing `PlayerChip` component in the top bar wired to `useAuth().user`; PlayerChip click navigates to `/profile`

**Checkpoint**: A returning user can log in, see the Home screen, navigate to Profile, and use the Join Room inline input with validation.

---

## Phase 5: User Story 3 — Full Game Loop Screens (Priority: P2)

**Goal**: Home → Create Room → Lobby (real-time player list) → Game (real-time grid + timer) → Results.

**Independent Test**: Starting from Home, a player can reach all five game-loop screens in sequence; the Lobby shows the room code and updates player list in real time; the Game grid renders correct cell colors after `block_claimed` events; the Results screen shows rankings with Play Again and Back to Home CTAs.

- [x] T019 [P] Create apps/frontend/src/services/room.service.ts: `createRoom(dto: CreateRoomDto)` — POST to `/api/rooms`, returns the room row (id, code, status, hostUserId, gameMode, gridSize, durationSeconds, maxPlayers, createdAt); `getRoom(code: string)` — GET to `/api/rooms/:code`, returns the full room row including status, startedAt, endedAt
- [x] T020 [P] Create apps/frontend/src/hooks/useSocket.ts: accept `roomCode: string` parameter; on mount create a `io('/game', { auth: { token: useAuthStore.getState().accessToken }, reconnection: true, reconnectionAttempts: 5 })` socket to the URL from `VITE_SOCKET_URL`; on `'connect'` emit `join_room` with `{ roomCode }`; on `'reconnect'` emit `request_state` with `{ roomCode }`; on cleanup emit `leave_room` with `{ roomCode }` then call `socket.disconnect()`; maintain `isConnected: boolean` state via `'connect'` and `'disconnect'` events; return `{ isConnected, emit, on }` where `on` returns an unsubscribe function
- [x] T021 Create apps/frontend/src/hooks/useGameState.ts: accepts the socket reference from useSocket; subscribes to all server→client events using the `on` helper — `room_state` → `room.store.setPlayers()` + update config, `player_joined` → `room.store.addOrUpdatePlayer()`, `player_left` → `room.store.removePlayer()`, `game_started` → `game.store.setGameState()` + navigate to `/game/:code`, `block_claimed` → `game.store.applyBlockClaim()`, `game_tick` → `game.store.tickTimer()`, `game_over` → `game.store.setFinished()` + store results + navigate to `/results`, `exception` → surface message as a visible toast/alert; return cleanup unsubscribes in a useEffect cleanup function
- [x] T022 [P] [US3] Implement pages/CreateRoom.tsx: replace stub with a form containing: game mode toggle (Solo / Red vs Blue) wired to local state; board size slider (range 5–50, default 12) with a live mini CSS grid preview that redraws as the slider moves; time limit segmented selector (30s / 60s / 90s / 120s, default 60s); max players stepper (2–10, default 6); on submit validate inputs, call `room.service.createRoom(dto)`, call `room.store.setRoom(code, config)`, navigate to `/lobby/:code`; use design token colors only
- [x] T023 [P] [US3] Implement pages/Lobby.tsx: replace stub with useSocket(roomCode) + useGameState; display room code from room.store in large text with a one-click copy-to-clipboard button; config summary row (mode, grid dimensions, time limit, max players); player list using room.store.players — each row: avatar placeholder, display name, rank pill, ready status indicator, host crown icon if isHost, team badge if Team mode; if current user is host render a "Start Game" button that emits `start_game` and is disabled until ≥2 players have isReady=true; if not host render a "Ready" toggle that emits `player_ready` on click; all player list changes arrive via socket events and reflect automatically via room.store
- [x] T024 [P] [US3] Implement pages/Game.tsx: replace stub with useSocket(roomCode) + useGameState; render game.store.grid as a CSS grid container (`display: grid; grid-template-columns: repeat(size, 1fr)`) inside an `overflow-auto` wrapper; each cell is the existing `GridCell` component from components/game/ receiving its `claimedBy` and `teamColor` from `game.store.grid[y][x]`; clicking an unclaimed cell emits `claim_block` with `{ x, y }` — no optimistic update; cells update only after `block_claimed` event via `applyBlockClaim`; newly claimed cells automatically play `claimPulse` animation (already in GridCell); HUD bar (position: sticky top-0): room code with copy button, game mode, grid dimensions, countdown timer — timer text color: `var(--color-warning)` (>20s), `var(--color-warning-dark)` (≤20s), `var(--color-danger)` with `timerPulse` animation (≤10s); when isConnected=false show a "Reconnecting…" banner
- [x] T025 [P] [US3] Implement pages/Results.tsx: replace stub with results data from game.store or a results ref populated in useGameState on game_over event; background: winning team color CSS var in Team mode, `--gradient-fire` in Solo mode; in Solo mode render a podium layout for top-3 players (1st center/tallest, 2nd left, 3rd right) with rank, display name, block count, coverage %; in Team mode render a winning team banner + per-team individual breakdown; "Play Again" button calls `game.store.clearGame()` and navigates to `/lobby/:code`; "Back to Home" button calls `room.store.clearRoom()`, `game.store.clearGame()`, navigates to `/home`
- [x] T026 [US3] Implement the collapsible score sidebar inside pages/Game.tsx: a slide-in panel toggled by a button on the HUD; in Team mode show two progress bars (red team vs blue team block counts); in Solo mode show a ranked player list with name, score, and team color dot; below scores in both modes show a live claim feed: last 10 `block_claimed` events displayed as `"[PlayerName] claimed (x,y)"` lines with the player's color

**Checkpoint**: The full game loop works end-to-end in two browser windows — create room, join, ready, start, claim cells, results, back to home.

---

## Phase 6: User Story 4 — Password Reset (Priority: P2)

**Goal**: Login → "Forgot password?" → enter email → OTP + new password → redirect to Login.

**Independent Test**: Click "Forgot password?" from Login → enter any email → navigate to Reset screen → enter valid 6-digit OTP in the 6-box field with auto-advance → new password + confirm → redirect to Login; incorrect OTP shows inline error.

- [x] T027 Add `forgotPassword(email: string)` and `resetPassword(email, otp, newPassword)` methods to apps/frontend/src/services/auth.service.ts: forgotPassword POSTs to `/api/auth/forgot-password`; resetPassword POSTs to `/api/auth/reset-password`; both re-throw API errors for callers to handle
- [x] T028 [P] [US4] Implement pages/auth/ForgotPassword.tsx: replace stub with a single email input and submit button; on submit call `auth.service.forgotPassword(email)`; on success show an inline success message ("Check your email for the OTP") and navigate to `/reset` after a brief delay; on error show the API message inline
- [x] T029 [US4] Implement pages/auth/ResetPassword.tsx: replace stub with the existing `OtpField` component from components/ui/OtpField.tsx for the 6-digit code (auto-advance between boxes, paste handling, backspace delete); new password input + confirm password input; when all 6 OTP digits are filled, programmatically focus the new password input; validate password match before submit; on submit call `auth.service.resetPassword(email, otp, newPassword)`; on success navigate to `/login` and show a success toast; on error show OTP field inline error

**Checkpoint**: The complete forgot → reset flow works from Login through to the Login redirect.

---

## Phase 7: User Story 5 — Profile and Sign-Out (Priority: P2)

**Goal**: Player chip in top bar → Profile screen with stats + paginated match history → sign-out confirmation modal → Login.

**Independent Test**: Click PlayerChip → Profile opens with 4 stat cards (Matches, Wins, Blocks Claimed, Streak); scrolling loads more match history rows; clicking Sign Out shows a confirmation modal; confirming clears the session and redirects to `/login`.

- [x] T030 Create apps/frontend/src/services/profile.service.ts: `getProfile()` — GET `/api/profile` using Axios instance, returns ProfileData; `getmatchPlayerRecords(page: number)` — GET `/api/profile/matches?page=${page}&limit=10`, returns `{ data: matchPlayerRecordsItem[], meta: PaginationMeta }`; both methods are designed to be called from TanStack Query hooks (no internal state)
- [x] T031 [US5] Implement pages/Profile.tsx: replace stub with TanStack Query `useQuery` for getProfile and `useInfiniteQuery` for getmatchPlayerRecords; render avatar placeholder, display name, join date, XP; 4 stat cards (Matches, Wins, Blocks Claimed, Current Streak) using values from profile data; paginated match history list — each row: won/lost colored indicator, mode, grid size, room code, blocks claimed, XP earned, relative timestamp; "Load more" button or scroll-based pagination trigger; sign-out button opens a confirmation modal (Dialog or custom overlay from components/ui/); on confirm call `auth.service.logout()` then navigate to `/login`; settings section with a "Change password" placeholder item (non-functional in this phase)
- [x] T032 [US5] Wire PlayerChip navigation in apps/frontend/src/components/layout/TopBar.tsx (or Shell.tsx): wrap the existing PlayerChip component in a `<button onClick={() => navigate('/profile')}>` or similar interactive element so clicking the chip navigates to `/profile` from any authenticated screen

**Checkpoint**: Clicking the player chip from Home opens the Profile; sign-out confirms and redirects to Login; match history paginates.

---

## Phase 8: User Story 6 — Session Persistence and Reconnect (Priority: P3)

**Goal**: Auth state survives page refresh; game state is fully restored after socket reconnect.

**Independent Test**: Sign in → refresh page → still on Home with player chip showing; navigate to a game in-progress → disconnect socket → reconnect → grid and scores restored without user action.

- [x] T033 [US6] Verify apps/frontend/src/store/auth.store.ts persist behavior: confirm `onRehydrateStorage` sets `isHydrated = true` after reading localStorage; confirm `clearAuth()` sets `user` and tokens to null but leaves `onboarded` unchanged; add a manual test by opening DevTools → Application → localStorage → `zonite-auth` and verifying the stored shape matches AuthState after login and logout
- [x] T034 [US6] Verify and harden apps/frontend/src/hooks/useSocket.ts reconnect logic: confirm `reconnectionAttempts: 5` is set; add a listener for the socket.io `'reconnect'` event (not `'connect'`) that emits `request_state` with `{ roomCode }`; verify `useGameState.ts` applies the resulting `game_started` event payload via `game.store.setGameState()` which replaces the full grid and player state
- [x] T035 [US6] Verify route guard behavior in apps/frontend/src/router/ProtectedRoute.tsx: confirm that direct URL navigation to any authenticated route (e.g., `/home`) while unauthenticated redirects to `/onboarding` (first-time) or `/login` (returning); confirm the spinner renders until `isHydrated = true` and no "flash of wrong content" occurs

**Checkpoint**: After signing in and refreshing, the Home screen reappears immediately with the player chip; network-throttling to simulate disconnect and reconnect restores the game grid.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, design fidelity, and quickstart verification across the whole feature.

- [x] T036 Run `pnpm type-check` from the monorepo root; systematically fix every TypeScript error in apps/frontend/src/ (imports, missing types, incorrect prop shapes) until the command exits with zero errors and under 60 seconds
- [x] T037 [P] Audit all new files in apps/frontend/src/ for hard-coded hex color values (search for `#[0-9a-fA-F]{3,6}` and `rgb(` not inside comments); replace every occurrence with the corresponding CSS variable from apps/frontend/src/styles/tokens.css; confirm the `color-no-hex` stylelint rule passes
- [x] T038 [P] Verify all 5 required animations are applied correctly: `claimPulse` on newly claimed GridCell transitions; `cellPulse` on GridCell hover; `timerPulse` on the countdown when remainingSeconds ≤ 10; `gridDrift` on animated background elements in Onboarding and Home; `fadeUp` on page-level transitions — cross-reference apps/frontend/src/styles/animations.css to confirm keyframe names match
- [x] T039 Run the full quickstart.md smoke test sequence: auth flow (open fresh app → onboarding → sign up → Home → refresh → player chip visible → player chip click → Profile → sign out → Login); game loop (two browser windows → sign in with two accounts → window 1 creates room → window 2 joins with code → both mark ready → host starts → grid appears in both → claim cells → countdown → Results in both windows)
- [x] T040 [P] Open `http://localhost:5173/_showcase` with the dev server running and verify all Phase 1 component groups (layout, ui, common, game) still render correctly with no visual regressions introduced by Phase 6 changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (deps installed) — **BLOCKS all user stories**
- **User Story Phases (3–8)**: All depend on Phase 2 completion; stories can then proceed in priority order or in parallel if staffed
- **Polish (Phase 9)**: Depends on all desired user story phases being complete

### User Story Dependencies

| Story                     | Phase   | Depends on                         | Notes                              |
| ------------------------- | ------- | ---------------------------------- | ---------------------------------- |
| US1 — New player auth     | Phase 3 | Phase 2                            | Auth service + Signup + Onboarding |
| US2 — Returning player    | Phase 4 | Phase 2, US1 (auth.service shared) | Login + Home                       |
| US3 — Game loop           | Phase 5 | Phase 2, US2 (Home screen entry)   | Largest phase — 8 tasks            |
| US4 — Password reset      | Phase 6 | Phase 2, US2 (Login link)          | Independent auth screens           |
| US5 — Profile + sign-out  | Phase 7 | Phase 2, US2 (PlayerChip nav)      | TanStack Query                     |
| US6 — Session persistence | Phase 8 | All prior phases                   | Verification + hardening           |

### Within Each Phase

- Tasks marked [P] within a phase can be worked simultaneously (different files)
- Services (T013, T016, T019, T027, T030) must exist before the pages that call them
- Stores (T004–T006) and api.ts (T007) must exist before hooks and pages that import them

---

## Parallel Examples

### Phase 2 Parallel Batch (start all together)

```
T004 — auth.store.ts
T005 — room.store.ts
T006 — game.store.ts
→ then T007 (api.ts) → T009 (ProtectedRoute) → T010 (page stubs) → T011 (router) → T012 (App.tsx)
T008 (useAuth.ts) can run alongside T007
```

### Phase 5 Parallel Batch (after T021 is complete)

```
T022 — CreateRoom.tsx
T023 — Lobby.tsx
T024 — Game.tsx (without sidebar)
T025 — Results.tsx
→ then T026 — Game sidebar (depends on T024)
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (onboarding + signup)
4. Complete Phase 4: US2 (login + home)
5. **STOP and VALIDATE**: Full auth flow works end-to-end with session persistence
6. Demo or deploy the auth-only build

### Incremental Delivery

1. Setup + Foundational → scaffolded SPA with router and stores
2. US1 + US2 → complete auth flow (MVP)
3. US3 → full game loop screens connected to real-time backend
4. US4 + US5 → password reset + profile (parallel if two developers)
5. US6 → session hardening and reconnect polish
6. Phase 9 → type-check + visual audit + smoke tests

### Parallel Team Strategy (3 developers)

After Phase 2 is complete:

- **Developer A**: US1 (Phase 3) → US2 (Phase 4)
- **Developer B**: US3 (Phase 5) — largest phase, needs solo focus
- **Developer C**: US4 (Phase 6) → US5 (Phase 7)
- All three converge on US6 (Phase 8) + Polish (Phase 9)

---

## Task Count Summary

| Phase                       | Tasks  | Parallelizable |
| --------------------------- | ------ | -------------- |
| Phase 1: Setup              | 3      | 2              |
| Phase 2: Foundational       | 9      | 5              |
| Phase 3: US1 Auth Flow      | 3      | 1              |
| Phase 4: US2 Sign-In + Nav  | 3      | 1              |
| Phase 5: US3 Game Loop      | 8      | 5              |
| Phase 6: US4 Password Reset | 3      | 1              |
| Phase 7: US5 Profile        | 3      | 1              |
| Phase 8: US6 Persistence    | 3      | 0              |
| Phase 9: Polish             | 5      | 3              |
| **Total**                   | **40** | **19**         |

**MVP scope**: Phases 1–4 (15 tasks) deliver a fully working auth flow.
