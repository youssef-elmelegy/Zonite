# Feature Specification: Game Screens & Account Screens (Phase 7)

**Feature Branch**: `006-game-account-screens`
**Created**: 2026-04-25
**Status**: Draft
**Input**: Phase 7 from PLAN.md — every screen in the design handoff implemented, functional, and styled. Full game loop and full account flow work end-to-end.

---

## Overview

This feature delivers every screen visible to users — authentication (onboarding, login, signup, forgot/reset password), home, room creation, lobby, live game, results, and profile. After this phase, a new user can open the app, create an account, start a game, and see a results screen with real scores — using the real backend and real-time socket communication.

Screens are visually driven by the committed Claude Design handoff bundle at `docs/design/zonite-game/`. The prototype in that bundle is the authoritative visual reference. Every screen in this spec must match the prototype output pixel-perfectly; behavior must be wired to the live backend.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Full Game Loop: Login → Play → Results (Priority: P1)

A returning player opens the app, logs in, creates a room, configures it, invites a friend who joins via the room code, both ready up, the host starts the game, both players claim blocks on the live grid, the timer expires, and both see the results screen with rankings.

**Why this priority**: This is the entire product value. Every other screen is scaffolding for this loop. Without it, the app has no purpose.

**Independent Test**: Can be fully tested with two browser sessions (or two accounts). One session creates and hosts a room, the other joins via the 6-character code. Both play and see results. Delivers a complete, demonstrable product.

**Acceptance Scenarios**:

1. **Given** a returning player with valid credentials, **When** they enter their email and password on the Login screen, **Then** they are routed to the Home screen and their name/XP appear in the top bar.
2. **Given** an authenticated player on the Home screen, **When** they click "Create Room" and submit a valid configuration, **Then** they are routed to the Lobby screen with a copyable 6-character room code displayed.
3. **Given** a second player on the Home screen, **When** they enter the 6-character code and join, **Then** they appear in the Lobby player list of the first player's view within 2 seconds.
4. **Given** both players are in the Lobby with ready status, **When** the host clicks "Start Game", **Then** both sessions simultaneously navigate to the Game screen showing the same grid.
5. **Given** the game is live, **When** a player clicks an unclaimed block, **Then** the block visually flips to that player's color only after the server confirms the claim.
6. **Given** the countdown timer reaches zero, **When** the game ends, **Then** both sessions are navigated to the Results screen showing rankings, block counts, and a board thumbnail.

---

### User Story 2 — New User Onboarding & Account Creation (Priority: P2)

A brand-new visitor opens the app for the first time, sees a 3-step intro carousel explaining the game, is guided to sign up, creates an account, and arrives at the Home screen.

**Why this priority**: No player can join a game without an account. This is the top-of-funnel flow that gates all other features.

**Independent Test**: Open the app in a fresh browser session (no stored auth). Complete the full flow: 3-step carousel → Signup form → Home screen. Delivers a viable onboarding experience independently.

**Acceptance Scenarios**:

1. **Given** a first-time visitor with no stored session, **When** they open the app, **Then** they see the Onboarding screen (3-step carousel: "Claim your territory", "Solo or team", "Real-time play") — not the login screen.
2. **Given** a visitor who has already seen onboarding, **When** they open the app without a session, **Then** they are routed directly to the Login screen (onboarding is not repeated).
3. **Given** a visitor on the Signup screen, **When** they submit a valid username, email, and password with confirmation, **Then** their account is created and they are routed to the Home screen with their session persisted.
4. **Given** a visitor on the Signup screen, **When** they submit a password that does not match the confirmation, **Then** an inline field-level error is shown and submission is blocked.
5. **Given** a visitor on the Signup screen, **When** they submit an email already in use, **Then** an inline error message is shown on the email field.

---

### User Story 3 — Password Reset via OTP (Priority: P3)

An existing player who forgot their password uses the "Forgot password?" link, receives a reset code, enters it along with a new password, and regains access.

**Why this priority**: Essential for account recovery; without it locked-out users are permanently blocked. Independently testable with a test account.

**Independent Test**: Use the Forgot Password screen with a valid email, complete the OTP + new-password form, then verify login with the new password works.

**Acceptance Scenarios**:

1. **Given** a visitor on the Login screen, **When** they click "Forgot password?", **Then** they are routed to the Forgot Password screen with an email input.
2. **Given** a visitor on the Forgot Password screen, **When** they submit a registered email address, **Then** they are routed to the Reset Password screen (OTP + new password form).
3. **Given** a visitor on the Reset Password screen, **When** they enter the correct 6-digit OTP and a valid new password (with matching confirmation), **Then** their password is updated and they are routed to Login with a success message.
4. **Given** a visitor on the Reset Password screen, **When** they enter an incorrect OTP, **Then** an inline error is shown on the OTP field and they can retry.
5. **Given** a visitor on the Reset Password screen, **When** they enter a new password that does not match the confirmation, **Then** an inline field-level error is shown and submission is blocked.

---

### User Story 4 — Creating and Configuring a Room (Priority: P4)

An authenticated player creates a new game room, customizes the grid size, duration, mode, and player cap using the Create Room screen, then sees the Lobby with the generated room code.

**Why this priority**: The host path must work before joiners can do anything. Independently testable without a second player.

**Independent Test**: Log in, open Create Room, adjust all sliders/controls, submit — verify Lobby opens with a valid 6-character code and the configured settings are summarized correctly.

**Acceptance Scenarios**:

1. **Given** an authenticated player on the Create Room screen, **When** they drag the Board Size slider, **Then** the live grid preview redraws immediately to reflect the new square dimensions (e.g., 8 → "8 × 8").
2. **Given** an authenticated player on the Create Room screen, **When** they select "Red vs Blue" mode, **Then** the mode is highlighted and this choice persists to the Lobby's config summary.
3. **Given** an authenticated player on the Create Room screen, **When** they submit the form, **Then** they are routed to the Lobby screen showing the unique 6-character room code in large copyable text.
4. **Given** a player on the Create Room screen, **When** they set Max Players to 2 and Board Size to 5, **Then** both values are accepted without validation errors and are reflected on the Lobby config row.

---

### User Story 5 — Joining a Room and Lobby Readiness (Priority: P5)

An authenticated player on the Home screen enters a 6-character code to join a room, lands in the Lobby, sees other players, marks themselves ready, and waits for the host to start.

**Why this priority**: The joiner path completes the multiplayer loop. Testable with one live room (created by User Story 4 test above).

**Independent Test**: With an active lobby room code, open a second session, enter the code on Home, join the lobby — verify the player appears in both sessions' lobby views, and the Ready toggle works.

**Acceptance Scenarios**:

1. **Given** an authenticated player on the Home screen, **When** they enter a valid 6-character code and click "Join", **Then** they are routed to the Lobby screen for that room.
2. **Given** a player in the Lobby, **When** they toggle their ready status, **Then** their row updates immediately (optimistic) and all other players in the lobby see the change in real time.
3. **Given** a Lobby with fewer than 2 ready players, **When** the host views the Start Game button, **Then** the button is visually disabled and cannot be clicked.
4. **Given** a Lobby where ≥ 2 players (including host) are ready, **When** the host clicks "Start Game", **Then** all players in the lobby are navigated to the Game screen simultaneously.
5. **Given** a player is in the Lobby, **When** another player disconnects or leaves, **Then** the leaving player is removed from the list in real time across all remaining sessions.

---

### User Story 6 — Live Game Interaction (Priority: P6)

During a live game, a player clicks blocks to claim them, watches the board fill up in real time, sees the countdown change color as time runs low, monitors the scoreboard, and the game ends when the timer hits zero.

**Why this priority**: Core gameplay mechanics. Dependent on User Stories 4 & 5 first working.

**Independent Test**: Start a game with two players. Click blocks rapidly and verify real-time updates, color changes, countdown behavior, and game-end transition.

**Acceptance Scenarios**:

1. **Given** the game is in PLAYING state, **When** a player clicks an unclaimed block, **Then** the claim request is sent and the block only changes color after the server confirms (no optimistic flip).
2. **Given** a player clicks a block already claimed by another player, **Then** no visual change occurs and no error message is shown.
3. **Given** the countdown is above 20 seconds, **Then** the timer displays in yellow; when it drops to ≤ 20 seconds, it turns orange; when it drops to ≤ 10 seconds, it turns red and pulses.
4. **Given** a block is successfully claimed, **Then** a brief pulse animation plays on that block to confirm the claim.
5. **Given** the socket connection drops and reconnects during a game, **Then** the full board state is automatically re-fetched from the server and the grid is repopulated without user action.
6. **Given** the timer reaches zero, **Then** the grid becomes unclickable and all players are navigated to the Results screen.

---

### User Story 7 — Viewing Results and Playing Again (Priority: P7)

After a game ends, players see a Results screen with the final rankings, board thumbnail, and options to play again or return home.

**Why this priority**: Completes the game loop; also the surface for scoring validation. Depends on game ending (User Story 6).

**Independent Test**: Complete a game and verify the Results screen shows correct rankings, block counts, and the board thumbnail matches the final grid state.

**Acceptance Scenarios**:

1. **Given** a completed Solo mode game, **When** the Results screen loads, **Then** players are ranked by block count with their name, block count, and percentage of board shown.
2. **Given** a completed Team mode game, **When** the Results screen loads, **Then** the winning team is highlighted at the top and individual rankings are shown within each team.
3. **Given** the Results screen, **When** a player clicks "Play Again", **Then** they are navigated back to the Lobby for the same room code with ready states reset.
4. **Given** the Results screen, **When** a player clicks "Back to Home", **Then** room state is cleared and they are navigated to the Home screen.

---

### User Story 8 — Profile Screen and Sign Out (Priority: P8)

An authenticated player views their profile stats and match history, and can sign out with a confirmation modal.

**Why this priority**: Provides account ownership and session exit. Independently testable at any point after login.

**Independent Test**: Log in, navigate to Profile from the top bar player chip, verify stats display, open the sign-out modal, confirm — verify session is cleared and user is redirected to Login.

**Acceptance Scenarios**:

1. **Given** an authenticated player, **When** they click the player chip in the top bar, **Then** they are routed to the Profile screen showing their avatar, username, join date, XP, and the 4 stat cards (Matches, Wins, Blocks Claimed, Streak).
2. **Given** a player on the Profile screen, **When** they click "Sign Out", **Then** a confirmation modal appears before any action is taken.
3. **Given** the sign-out confirmation modal is open, **When** the player confirms sign out, **Then** their session is cleared, persistent storage is wiped, and they are routed to the Login screen.
4. **Given** a player on the Profile screen, **When** they view their recent matches, **Then** each row shows the match outcome (won/lost), mode, grid size, room code, blocks claimed, XP gained, and relative time.

---

### Edge Cases

- **Direct navigation to a protected route**: A user who pastes `/game` or `/lobby` into the browser without a session is redirected to `/onboarding` (first-time) or `/login` (returning user) — not a blank screen or error.
- **Page reload during active game**: The game screen must restore the full board state within 3 seconds; the player must not be removed from the room due to the reload.
- **Invalid room code on Home**: Entering a non-existent or finished room code shows an inline error on the input; the user stays on Home.
- **Timer expiry before results screen loads**: The results data is already available on the server; the screen renders correctly regardless of client-side timing.
- **OTP expired or invalid**: The Reset Password screen shows a specific "Code expired — request a new one" error and links back to Forgot Password.
- **All grid blocks claimed before timer**: The game continues running the timer; clicking any cell has no effect. The Results screen shows 100% board coverage.
- **Player tries to start game as non-host**: The Start Game button is not rendered at all for non-hosts (not just disabled).
- **Onboarding flag survives logout**: A user who onboarded, logged out, and logs back in as a different account still skips onboarding (the flag is device-level, not account-level).
- **Team mode — grid block ownership color**: In team mode, the player's own blocks are a slightly lighter shade of their team color; opponents' blocks are a flat team color. The distinction must be visible.

---

## Requirements _(mandatory)_

### Functional Requirements

#### Authentication & Account Flow

- **FR-001**: The system MUST route first-time visitors (no stored onboarding flag) to an Onboarding screen before login or signup is reachable.
- **FR-002**: The Onboarding screen MUST present exactly 3 steps that describe the game concept and guide the user toward creating an account.
- **FR-003**: After completing onboarding, the system MUST store a persistent device-level flag so onboarding is never repeated on that device, even after logout.
- **FR-004**: Users MUST be able to create an account by providing a username, email address, and password (with a confirmation field).
- **FR-005**: The Signup form MUST display a live password strength indicator that updates as the user types.
- **FR-006**: Users MUST be able to sign in with their email address and password.
- **FR-007**: On successful authentication, the session (access token + refresh token + user profile) MUST be persisted to device-local persistent storage so page reloads do not require re-login.
- **FR-008**: The session MUST be silently refreshed when the access token expires — the user MUST NOT be shown a re-login prompt unless the refresh token itself is invalid.
- **FR-009**: Users MUST be able to initiate a password reset by providing their email address on a Forgot Password screen.
- **FR-010**: Users MUST be able to complete a password reset by entering a 6-digit OTP code and a new password (with confirmation) on a Reset Password screen.
- **FR-011**: All auth form fields MUST display inline, field-level error messages (not page-level alerts) for validation failures (required fields, format errors, server-returned errors).
- **FR-012**: All auth screens MUST share the same visual layout: a dark canvas with a fire-gradient hero illustration column and a glass-card form column.

#### Home Screen

- **FR-013**: The Home screen MUST display a "Create Room" call-to-action and a "Join Room" call-to-action with an inline 6-character code input.
- **FR-014**: The Home screen MUST display the authenticated player's personal stats: total matches played, total wins, and current win streak.
- **FR-015**: If an entered room code does not correspond to an active LOBBY-status room, the system MUST display an inline error on the input and keep the user on the Home screen.
- **FR-016**: The top bar on the Home screen MUST display the player's name and XP pill, which navigates to the Profile screen when clicked.

#### Create Room Screen

- **FR-017**: The Create Room screen MUST allow the player to select game mode: Solo (all-vs-all) or Team (Red vs Blue).
- **FR-018**: The Create Room screen MUST include a Board Size slider with a range of 5–50 (default 12). The board is always square; a single dimension value is configured.
- **FR-019**: A live grid preview MUST render the selected board size in real time as the slider moves (before the form is submitted).
- **FR-020**: The Create Room screen MUST include a Time Limit selector with exactly four presets: 30s, 60s, 90s, 120s (default 60s).
- **FR-021**: The Create Room screen MUST include a Max Players control with a range of 2–10 (default 6).
- **FR-022**: On successful room creation, the system MUST route the player to the Lobby screen for the newly created room.

#### Lobby Screen

- **FR-023**: The Lobby screen MUST display the room's 6-character code in large, prominent text with a one-click copy-to-clipboard button.
- **FR-024**: The Lobby screen MUST display a config summary row showing the room mode, grid dimensions (e.g., "12 × 12"), duration, and max players.
- **FR-025**: Each player in the Lobby MUST be shown in a player row with their avatar, display name, rank pill, ready/not-ready state, and (in Team mode) their team badge (red or blue).
- **FR-026**: The room host MUST be visually distinguished in the player list (e.g., a crown icon).
- **FR-027**: Non-host players MUST have a visible "Ready" toggle they can click to signal readiness.
- **FR-028**: The host MUST see a "Start Game" button. This button MUST be disabled (and visually indicate it) when fewer than 2 players are in the ready state. Non-host players MUST NOT see this button.
- **FR-029**: The Lobby player list MUST update in real time as players join, leave, or change ready state — without requiring a page refresh.
- **FR-030**: The Lobby MUST display a spectator count pill when spectators are present.

#### Game Screen

- **FR-031**: The Game screen MUST render the full square grid sized to the room's configured grid size. The grid MUST be the dominant visual element on the screen.
- **FR-032**: Each cell in the grid MUST visually represent one of these states: empty, claimed-by-self (own color), claimed-by-opponent (opponent color), hovered (pre-click highlight), or disabled (post-game).
- **FR-033**: When a player clicks an unclaimed cell, a claim request MUST be sent. The cell state MUST only change after a server confirmation arrives — no optimistic client-side flip.
- **FR-034**: When a block is successfully claimed, a brief animated pulse MUST play on that cell to confirm the claim visually.
- **FR-035**: The Game screen HUD MUST display: the room code (with copy icon), the game mode, the grid dimensions, and the countdown timer.
- **FR-036**: The countdown timer MUST change color and behavior based on remaining time:
  - Above 20 seconds: accent yellow, no animation.
  - 20 seconds or below: orange color.
  - 10 seconds or below: red color with a pulsing animation.
- **FR-037**: A live scoreboard MUST be visible alongside the grid. In Solo mode it shows a ranked list of players and their block counts. In Team mode it shows two team score bars (red block count vs blue block count) plus individual player rows within each team.
- **FR-038**: If the socket connection is lost and then restored, the system MUST automatically request full game state from the server and repopulate the entire board without user action.
- **FR-039**: When the game ends, the grid MUST become fully unclickable and all players MUST be navigated to the Results screen.

#### Results Screen

- **FR-040**: The Results screen MUST display the final ranking with each player's name, rank position, block count, and percentage of the total board they claimed.
- **FR-041**: The Results screen MUST display a visual thumbnail of the final board state, showing each block's color as it was at game end.
- **FR-042**: In Solo mode, the Results screen MUST use a podium-style layout for the top 3 players and a ranked list for the rest.
- **FR-043**: In Team mode, the Results screen MUST prominently show the winning team and then break down individual rankings within each team.
- **FR-044**: The Results screen background MUST visually reflect the winner: fire-gradient flood for Solo mode, winning team's color flood for Team mode.
- **FR-045**: The Results screen MUST provide two CTAs: "Play Again" (returns all players to the Lobby with ready states reset) and "Back to Home" (clears room state and routes to Home).

#### Profile Screen

- **FR-046**: The Profile screen MUST display the player's avatar, display name, join date, and total XP.
- **FR-047**: The Profile screen MUST display four stat cards: Matches Played, Wins, Total Blocks Claimed, and Current Streak.
- **FR-048**: The Profile screen MUST display a paginated list of recent matches, each row showing: outcome (won/lost), game mode, grid size, room code, blocks claimed, XP earned, and relative timestamp.
- **FR-049**: The Profile screen MUST include a "Sign Out" action that opens a confirmation modal before signing out.
- **FR-050**: On confirmed sign out, the system MUST clear the session, wipe persistent token storage, wipe any room or game state, and route the user to the Login screen.

#### Route Guards & Session Persistence

- **FR-051**: All routes except `/onboarding`, `/login`, `/signup`, `/forgot`, and `/reset` MUST be protected. Any unauthenticated access attempt MUST redirect to `/login` (or `/onboarding` if onboarding has not been completed).
- **FR-052**: On any page load, the system MUST rehydrate the auth session from persistent storage before making any routing decision — to prevent flash of the wrong screen.
- **FR-053**: The `onboarded` flag MUST be stored independently from the auth session (device-level). It MUST NOT be cleared on logout.

---

### Key Entities

- **Screen**: A routed page view with a unique URL path and its own navigation lifecycle.
- **Player**: An authenticated user with identity attributes (id, username, display name, XP, rank, avatar) and aggregate stats (match count, win count, block count, streak).
- **Room**: A game container identified by a 6-character code, holding configuration (mode, gridSize, durationSeconds, maxPlayers) and a list of player slots with ready states.
- **Block**: A single cell in the game grid identified by (x, y) coordinates. Has an owner (null if unclaimed, playerId if claimed) and a display state derived from the viewer's perspective (empty, own, opponent).
- **GameResult**: The post-game data set: final rankings (ordered by score), per-player stats (block count, percentage), team aggregates in Team mode, and the board snapshot.
- **AuthSession**: The persisted credential set: access token (short-lived), refresh token (long-lived), and the user's profile data. Stored in persistent device-local storage. The onboarded flag is stored separately.
- **RouteGuard**: A navigation rule that checks session validity before allowing access to a protected route. The guard waits for session rehydration to complete before evaluating the redirect decision.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A player can complete the full game loop — from login to results screen — in under 10 minutes on their first attempt.
- **SC-002**: All real-time board updates (block claims) appear on all connected players' screens within 500 ms of the server confirming the claim.
- **SC-003**: The countdown timer updates every second with no visible frame drops or delays across the full game duration.
- **SC-004**: A page reload during an active game restores the full board state within 3 seconds, without the player being removed from the room.
- **SC-005**: 100% of navigation attempts to protected routes by unauthenticated users result in the correct redirect — no protected screen is ever rendered without a valid session.
- **SC-006**: Session state (tokens + user profile) survives a browser close and reopen — a player who closes and reopens the tab is returned to the Home screen without re-authenticating.
- **SC-007**: Every screen in this feature visually matches the corresponding design handoff prototype as validated by a side-by-side comparison review.
- **SC-008**: All inline form errors appear immediately on field blur or submission — no error requires a page reload to surface.
- **SC-009**: The live grid preview on Create Room updates without any perceptible lag as the size slider is dragged across its full range.
- **SC-010**: Clicking "Play Again" from Results returns all participating players to a ready-reset Lobby within 2 seconds.

---

## Assumptions

- **Backend readiness**: The auth, room, and game REST endpoints (Phases 2–3) and the WebSocket gateway (Phase 5) are fully operational before frontend screens are wired up.
- **Shared types**: All cross-wire types, socket event names, and enums are exported from `packages/shared` and are available for import (Phase 0 deliverable).
- **Design tokens available**: The `tokens.css` file from Phase 1 is imported at the app entry point, making all CSS variables live.
- **Mulish font**: Mulish (the Gilroy stand-in) is loaded via Google Fonts. Gilroy `.woff2` files are not yet licensed; no Gilroy-specific behavior is expected in this phase.
- **Animations keyframes available**: The global `animations.css` (Phase 6 deliverable: `claimPulse`, `cellPulse`, `timerPulse`, `gridDrift`, `fadeUp`) is imported and available.
- **Social auth**: Social login providers (Google, etc.) appear as placeholder buttons in the auth screens. They are not wired to any backend provider in this phase.
- **Spectator role**: The spectator count shown in the Lobby is a display-only indicator based on player count vs max-players. No dedicated spectator role or special spectator screen exists in this phase.
- **Profile settings (beyond password)**: Settings rows on the Profile screen other than "Change Password" are visual placeholders with no backend wiring in this phase.
- **Host disconnect mid-lobby**: Handling for host disconnection and host transfer is Phase 8. In this phase, if the host disconnects, the lobby may become inoperable — this is an accepted limitation.
- **Match history pagination**: The recent matches list on Profile is paginated using the Sikka pagination system. An empty history state is handled with a placeholder message.
- **Onboarding animation**: The `MiniGridArt` animated grid on the Onboarding screen uses the `gridDrift` keyframe from the global animations file.
- **Minimum ready players**: The host counts as a player when evaluating the "≥ 2 ready" gate — the host does not need a separate ready toggle (joining the lobby implicitly marks the host as ready, or the host must explicitly mark themselves ready before seeing Start Game become active — the specific interpretation follows the design handoff's Lobby prototype behavior).
