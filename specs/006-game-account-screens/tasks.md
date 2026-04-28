# Tasks: Game Screens & Account Screens (Phase 7)

**Input**: Design documents from `/specs/006-game-account-screens/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Backend auth HTTP layer is Foundational because it blocks US1, US2, US3, and US8.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story this task belongs to (maps to spec.md)
- All paths are absolute from repo root; shown relative for readability

---

## Phase 1: Setup (DB Schema & Shared Types)

**Purpose**: Extend the existing schema and shared contract. Must complete before any auth or profile work.

- [x] T001 Extend `apps/backend/src/db/schema/users.ts` with `fullName TEXT NOT NULL DEFAULT ''` and `xp INTEGER NOT NULL DEFAULT 0` columns, then run `pnpm drizzle-kit generate && pnpm drizzle-kit migrate` in `apps/backend/` to produce migration `0002_add_display_name_xp.sql`
- [x] T002 [P] Create `apps/backend/src/db/schema/match-history.ts` with the `matchPlayerRecords` Drizzle table (id, userId FK, roomId FK nullable, gameMode, gridSize, won, blocksClaimed, xpEarned, playedAt) and indexes; add export to `apps/backend/src/db/schema/index.ts`; generate migration `0003_match_player_records.sql`
- [x] T003 [P] Add `fullName: string` to `CurrentUser` interface in `packages/shared/src/auth/user.ts`; bump `packages/shared/package.json` version to `0.2.0`
- [x] T004 [P] Create `apps/backend/src/common/strategies/refresh-token.strategy.ts` — a PassportStrategy(`passport-jwt`) using `REFRESH_SECRET` with `jwtFromRequest: ExtractJwt.fromBodyField('refreshToken')`; validates decoded `nonce` against `users.refreshTokenNonce`; export from `apps/backend/src/common/strategies/index.ts`

**Checkpoint**: DB migrations applied, shared types updated, refresh strategy ready.

---

## Phase 2: Foundational (Auth HTTP Layer)

**Purpose**: Implement all auth HTTP endpoints. BLOCKS US1 (login), US2 (register), US3 (forgot/reset), and US8 (logout).

**⚠️ CRITICAL**: No user-story auth flows can be tested end-to-end until this phase completes.

- [x] T005 Create Auth DTOs in `apps/backend/src/modules/auth/dto/`: `RegisterDto` (email, password minLen 8, fullName minLen 2 maxLen 30), `LoginDto` (email, password), `ForgotPasswordDto` (email), `ResetPasswordDto` (email, otp exactly 6 digits, newPassword minLen 8); create barrel `apps/backend/src/modules/auth/dto/index.ts`
- [x] T006 Create `apps/backend/src/modules/auth/services/auth.service.ts` with 6 methods: `register(dto)` — bcrypt hash, insert user with fullName, generate access+refresh tokens with nonce; `login(dto)` — verify email+password, rotate nonce, return tokens+CurrentUser; `refreshTokens(userId, nonce)` — verify nonce matches DB, rotate, return new tokens; `logout(userId)` — set refreshTokenNonce=null; `forgotPassword(email)` — generate 6-digit OTP (`crypto.randomInt`), SHA-256 hash, store in `users.resetOtpHash` + 10min expiry `otpExpiresAt`, log OTP to console (`[OTP] <email> → <code>`); `resetPassword(dto)` — verify OTP hash + expiry not past, bcrypt hash new password, clear OTP fields
- [x] T007 Create `apps/backend/src/modules/auth/controllers/auth.controller.ts` with 6 endpoints: `POST /auth/register` (@Public), `POST /auth/login` (@Public), `POST /auth/refresh` (RefreshTokenGuard), `POST /auth/logout` (JwtAuthGuard), `POST /auth/forgot-password` (@Public), `POST /auth/reset-password` (@Public); all responses via `successResponse()` envelope; follow Sikka decorator pattern (`{Auth}{Op}Decorator` files in `apps/backend/src/modules/auth/decorators/`)
- [x] T008 Update `apps/backend/src/modules/auth/auth.module.ts` to declare and export `AuthController`, `AuthService`, `RefreshTokenStrategy`; add `DbModule` to imports so `AuthService` can inject the DB pool
- [x] T009 Fix fullName derivation in `apps/backend/src/modules/gateway/game.gateway.ts`: replace `user.email.split('@')[0]` with `user.fullName` in `handleJoinRoom`; also set `isReady: true` for the host player on join (R-007: host auto-ready)

**Checkpoint**: `POST /api/auth/login` returns `{ tokens, user }`. Frontend Login screen can authenticate against a seeded user.

---

## Phase 3: User Story 1 — Full Game Loop: Login → Play → Results (Priority: P1) 🎯 MVP

**Goal**: Two authenticated players complete a full game from login to results screen using the live backend.

**Independent Test**: Log in with two accounts (create via `POST /api/auth/register`). Tab 1 creates a room, Tab 2 joins with the code. Both ready up, host starts game, both claim blocks, timer expires, both see results. All within 10 minutes (SC-001).

- [x] T010 Create `apps/frontend/src/components/layout/AuthLayout.tsx` — two-column shell: left hero column (fire gradient background, `CornerBlobs`, `MiniGridArt` placeholder, tagline) hidden on mobile (`< 768px`); right glass-card column (`bg-elevated`, `border-subtle`, `radius-xl`, padding `sp-8`, max-width 400px, vertically centred); accepts `children` rendered in right column
- [x] T011 [P] [US1] Fix gateway host auto-ready (see T009 — both tasks edit `game.gateway.ts`; coordinate to avoid conflicts): when `room.hostUserId === user.id` set `isReady: true` on the `InternalLobbyPlayer` before broadcasting `ROOM_STATE`; this task is a no-op if T009 already handles it
- [x] T012 [US1] Adopt `AuthLayout` in `apps/frontend/src/pages/auth/Login.tsx` — replace the current single-column full-page div with `<AuthLayout>`; move the form into the right glass-card slot; retain all existing state logic and error handling

**Checkpoint**: Login → Create Room → Lobby → Game → Results works end-to-end. Host sees Start Game enabled when ≥2 players are ready (including host auto-ready).

---

## Phase 4: User Story 2 — New User Onboarding & Account Creation (Priority: P2)

**Goal**: A first-time visitor sees the 3-step carousel, signs up, and arrives at Home with their chosen display name in the top bar.

**Independent Test**: Open fresh browser session (clear localStorage). Complete carousel → Signup with email + fullName + password → Home screen shows fullName in the PlayerChip.

- [x] T013 Create `apps/frontend/src/components/common/MiniGridArt.tsx` — purely decorative `4×4` grid of 16 cells; each cell has a random `animation-delay` (0–2s) and plays `claimPulse` from `animations.css`; cells cycle through `--accent-yellow`, `--team-red`, `--team-blue`, `--sky-300` colors; no props, no interaction; used only inside `AuthLayout` hero column
- [x] T014 [P] [US2] Adopt `AuthLayout` in `apps/frontend/src/pages/auth/Onboarding.tsx` — wrap current content in `<AuthLayout>`; the carousel content (step cards, dots, Next button) becomes the right-column child; left hero column shows `MiniGridArt` + tagline "Claim Your Territory"
- [x] T015 [US2] Adopt `AuthLayout` in `apps/frontend/src/pages/auth/Signup.tsx` — wrap form in `<AuthLayout>`; change fullName field from "optional" to required (minLength 2) matching `RegisterDto`; the form already calls `authService.register(email, password, fullName)` — verify this wires to `POST /api/auth/register` correctly

**Checkpoint**: New user onboarding → Signup → Home with fullName visible in PlayerChip.

---

## Phase 5: User Story 3 — Password Reset via OTP (Priority: P3)

**Goal**: A user who forgot their password requests a reset code, enters it with a new password, and logs in successfully.

**Independent Test**: Log in → navigate to `/forgot` → submit email → copy OTP from backend console → enter on `/reset` → verify login with new password succeeds.

- [x] T016 [P] [US3] Adopt `AuthLayout` in `apps/frontend/src/pages/auth/ForgotPassword.tsx` — wrap form in `<AuthLayout>`; retain existing submit logic and success/error states
- [x] T017 [US3] Adopt `AuthLayout` in `apps/frontend/src/pages/auth/ResetPassword.tsx` — wrap form in `<AuthLayout>`; retain OtpField, password fields, and all existing error handling; verify the backend error message "Code expired — request a new one" surfaces correctly on the OTP field

**Checkpoint**: Forgot password → OTP console log → Reset password → Login with new password works.

---

## Phase 6: User Story 4 — Creating and Configuring a Room (Priority: P4)

**Goal**: An authenticated player configures and creates a room; the Lobby shows the generated 6-character code.

**Independent Test**: Log in → `/create` → adjust all controls → submit → Lobby opens with valid code and correct config summary (after Phase 7 Lobby work is done this will be fully visible).

- [x] T018 [US4] Audit `apps/frontend/src/pages/CreateRoom.tsx` against spec FR-017–FR-022: confirm Board Size slider range is 5–50 (currently is), time presets are 30/60/90/120 (currently 30/60/90/120 ✅), Max Players is 2–10 (currently is), grid preview re-renders on slider drag (currently does ✅); fix the grid preview so it uses `gridSize` for the column count directly (not capped at 20 for large boards — use a max display size of 30×30 with smaller cells); confirm navigation to `/lobby/:code` on success

**Checkpoint**: Room creation works with all controls functional and grid preview accurate.

---

## Phase 7: User Story 5 — Joining a Room and Lobby Readiness (Priority: P5)

**Goal**: A player joins a room via code and sees the full lobby with config summary, player list with ready states, and team badges in TEAM mode.

**Independent Test**: Create a TEAM room → join from a second session → verify: config row shows mode/grid/duration/max, both player rows show correct names + ready state + team badge, the host sees Start Game (disabled with 1 ready), toggling Ready in Tab 2 updates Tab 1 in real time.

- [x] T019 [P] [US5] Add config summary row to `apps/frontend/src/pages/Lobby.tsx` — below the room code, render a horizontal row showing: `gameMode === TEAM ? 'Red vs Blue' : 'Solo'` · `${gridSize}×${gridSize}` · `${durationSeconds}s` · `${maxPlayers} players`; data comes from `useRoomStore` (already populated from `ROOM_STATE` socket event)
- [x] T020 [US5] Add team badges and spectator count pill to `apps/frontend/src/pages/Lobby.tsx` — for TEAM mode player rows, show a colored badge (`RED` / `BLUE`) next to the avatar using `player.teamColor`; add a spectator count pill near the Players header showing `0 spectators` (placeholder — no real spectator tracking in Phase 7); pill is only shown when `players.length >= maxPlayers` or always shown as a display element

**Checkpoint**: Lobby displays config summary and team badges; real-time player list updates work.

---

## Phase 8: User Story 6 — Live Game Interaction (Priority: P6)

**Goal**: During a live TEAM mode game, own blocks are visually distinguished from teammate/opponent blocks.

**Independent Test**: Start a TEAM game with two players on opposite teams. Player A claims blocks — their blocks should be lighter shade of team color. Player B's blocks should be flat team color. Verify countdown timer color changes at ≤20s (orange) and ≤10s (red + pulse).

- [x] T021 [US6] Update `apps/frontend/src/components/game/GridCell.tsx` and `apps/frontend/src/pages/Game.tsx` — in TEAM mode, own claimed blocks (`block.claimedBy === user.id`) render with `opacity: 0.7` overlay or a CSS `filter: brightness(1.3)` on top of the team color to create the lighter-shade distinction required by FR-032; pass `isOwnBlock: boolean` prop to `GridCell`; the cell uses `var(--team-red)` / `var(--team-blue)` base with brightness filter for own vs flat for opponent

**Checkpoint**: TEAM game visually distinguishes own blocks (lighter) from opponent blocks (flat team color).

---

## Phase 9: User Story 7 — Viewing Results and Playing Again (Priority: P7)

**Goal**: After a Solo game, top 3 appear on a podium and remaining players appear in a ranked list below.

**Independent Test**: Complete a Solo game with 4+ players → Results screen shows podium (ranks 1–3) + ranked list of remaining players with name, score, and % coverage.

- [x] T022 [US7] Update `apps/frontend/src/pages/Results.tsx` — in Solo mode, after the podium section (already renders top 3), add a ranked list section for `sorted.slice(3)` players; each row shows rank (#4, #5…), player name, block score, and percentage; style consistent with the podium section (uses same tokens); only rendered when `sorted.length > 3`

**Checkpoint**: Results screen shows complete solo rankings (podium + rest list). "Play Again" navigates to lobby with reset ready states. "Back to Home" clears room + game state.

---

## Phase 10: User Story 8 — Profile Screen and Sign Out (Priority: P8)

**Goal**: Authenticated players view real stats and match history on the Profile screen. Home screen shows real player stats.

**Independent Test**: Play 2+ games → open Profile → verify Matches, Wins, Blocks Claimed, Streak stats are correct → verify match history rows show correct game data → sign out → verify redirect to Login and session cleared.

- [x] T023 Create `apps/backend/src/modules/profile/services/profile.service.ts` with 3 methods: `getProfile(userId)` — query users table + run aggregate queries on match_player_records for stats (matches, wins, blocksClaimed, currentStreak); `getmatchPlayerRecords(userId, paginationQuery)` — paginated query on match_player_records with Sikka pagination helper, join rooms to get room code; `recordMatchResults(results: Results, roomId: string)` — bulk insert match_player_records rows (one per playerRanking), determine winner per results.gameMode (Solo: rank===1; Team: matching winningTeam), compute xpEarned, UPDATE users.xp += xpEarned
- [x] T024 [P] [US8] Create `apps/backend/src/modules/profile/controllers/profile.controller.ts` with `GET /profile` and `GET /profile/matches` (with `PaginationQueryDto`); both guarded by `JwtAuthGuard`; responses via `successResponse()` and Sikka paginated response; create decorators `apps/backend/src/modules/profile/decorators/`
- [x] T025 [US8] Create `apps/backend/src/modules/profile/profile.module.ts` (declare ProfileController, ProfileService; import DbModule); register ProfileModule in `apps/backend/src/app.module.ts`
- [x] T026 [US8] Inject `ProfileService` into `GameGateway` via constructor; call `await this.profileService.recordMatchResults(results, room.id)` inside the `onGameOver` callback before emitting `GAME_OVER`; update `apps/backend/src/modules/gateway/gateway.module.ts` to import ProfileModule
- [x] T027 [US8] Wire `GET /api/profile` into `apps/frontend/src/pages/Home.tsx` — add `useQuery({ queryKey: ['profile'], queryFn: profileService.getProfile })` call; replace the three `'—'` placeholder stat values with `profile.stats.matches`, `profile.stats.wins`, and computed win-rate `(stats.wins/stats.matches*100).toFixed(0)+'%'` (show `'—'` when `isLoading` or `stats.matches === 0`)
- [x] T028 [P] [US8] Update `apps/frontend/src/pages/Profile.tsx` to show `user.fullName` (from auth store) instead of `user.email.split('@')[0]` in the avatar initial and heading; update `apps/frontend/src/components/common/PlayerChip.tsx` to receive `fullName` and `apps/frontend/src/pages/Home.tsx`, `apps/frontend/src/pages/Lobby.tsx`, `apps/frontend/src/pages/Game.tsx` to pass `user.fullName` to PlayerChip

**Checkpoint**: Profile screen shows real stats + match history. Home shows real match/win counts. Sign out clears session and routes to Login.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, consistency, and final smoke test.

- [x] T029 [P] Run `pnpm type-check` from repo root and fix all TypeScript errors arising from `CurrentUser.fullName` addition — check all places that destructure or access `user` from `useAuth()`, auth store, and JWT payload in backend strategies/guards
- [x] T030 [P] Add `@types/bcrypt` to `devDependencies` in `apps/backend/package.json` if not already present; run `pnpm install` to update lockfile
- [x] T031 Run full two-session smoke test per `specs/006-game-account-screens/quickstart.md`: onboarding → signup → create room → join room → ready up → start game → claim blocks → results → profile stats verified; capture any console errors or TypeScript runtime issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately in parallel where marked
- **Foundational (Phase 2)**: Requires T001–T004 complete (DB migrations applied, types updated)
- **User Story phases (3–10)**: All require Phase 2 complete; then proceed in priority order or parallel if team allows
- **Polish (Phase 11)**: Requires all desired user stories complete

### User Story Dependencies

| Story                | Depends on                                           | Can parallelize with     |
| -------------------- | ---------------------------------------------------- | ------------------------ |
| US1 (Login → Game)   | Phase 2 (auth endpoints)                             | US2, US3 (after Phase 2) |
| US2 (Onboarding)     | Phase 2 (register endpoint) + T010 (AuthLayout)      | US3, US4                 |
| US3 (Password Reset) | Phase 2 (forgot/reset endpoints) + T010 (AuthLayout) | US2, US4                 |
| US4 (Create Room)    | Phase 2 (login to test)                              | US5, US6                 |
| US5 (Lobby)          | US4 (room to join)                                   | US6, US7                 |
| US6 (Game)           | US5 (lobby to start)                                 | US7                      |
| US7 (Results)        | US6 (game to finish)                                 | US8                      |
| US8 (Profile)        | Phase 2 (auth) + T023 (ProfileService)               | US6, US7                 |

### Critical path

```
T001 (schema) → T005-T008 (auth HTTP) → T010 (AuthLayout) → T012 (Login) → [US1 smoke test]
T002 (match_player_records) → T023 (ProfileService) → T026 (wire onGameOver) → T027 (Home stats) → [US8 smoke test]
```

---

## Parallel Opportunities

### Phase 1 (all 4 tasks can run in parallel)

```
T001: Extend users schema + migration
T002: Create match_player_records schema
T003: Update shared CurrentUser type
T004: Create RefreshTokenStrategy
```

### Phase 2 (sequential — each depends on previous)

```
T005 (DTOs) → T006 (Service) → T007 (Controller) → T008 (Module)
T009 (gateway fix) can run in parallel with T005-T008
```

### After Phase 2 (user stories can start in parallel)

```
Dev A: T010 (AuthLayout) → T012 (US1 Login) → T013 (MiniGridArt) → T014/T015 (US2)
Dev B: T016/T017 (US3) → T018 (US4) → T019/T020 (US5)
Dev C: T023 (ProfileService) → T024-T028 (US8)
```

---

## Implementation Strategy

### MVP First (US1: Full Game Loop)

1. Complete Phase 1 (Setup — ~1h)
2. Complete Phase 2 (Auth HTTP — ~3h)
3. Complete Phase 3 (US1 — AuthLayout + Login + host auto-ready — ~1h)
4. **STOP AND VALIDATE**: Two-session game loop from login to results
5. Everything else is additive — MVP is playable at this checkpoint

### Incremental Delivery

```
Phase 1+2 done → Register + Login working
+ US1 (Phase 3) → Full game loop testable
+ US2 (Phase 4) → Onboarding + signup working
+ US3 (Phase 5) → Password reset working
+ US4/US5 (Phase 6+7) → Lobby polish complete
+ US6/US7 (Phase 8+9) → Game + results polish complete
+ US8 (Phase 10) → Profile + stats working
+ Polish (Phase 11) → Shippable
```

---

## Notes

- Tasks marked [P] have different file targets and no dependencies on sibling [P] tasks — safe to run concurrently
- T009 and T011 both edit `game.gateway.ts` — coordinate to avoid merge conflicts (do T009 first, then T011 adds the host auto-ready logic)
- The gateway's `handleJoinRoom` needs both changes from T009 and T011: fullName fix (T009) + host isReady (T011) — combine into one edit when possible
- `pnpm drizzle-kit migrate` in T001/T002 requires the local Postgres container running (`pnpm dev` or `docker compose up db -d`)
- After T003, run `pnpm install` at repo root to update the shared package symlink
