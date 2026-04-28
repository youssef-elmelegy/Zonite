# Feature Specification: Frontend Foundation — Zonite Client App

**Feature Branch**: `005-frontend-foundation`
**Created**: 2026-04-24
**Status**: Draft
**Phase**: 6 — Frontend Foundation (React)

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — New player completes first-time auth flow (Priority: P1)

A brand-new player opens the Zonite app for the first time. They are greeted by an animated onboarding sequence that introduces the game concept in three steps. After completing onboarding, they are taken to the registration screen where they can sign up with an email and password. On success, they land on the Home screen and are ready to play.

**Why this priority**: Without authentication, no other feature in the app is accessible. This is the entry gate for every user.

**Independent Test**: A user with no prior account can open the app, complete all three onboarding steps, fill in the signup form, and reach the Home screen displaying their player chip in the top bar.

**Acceptance Scenarios**:

1. **Given** a first-time visitor (no local session), **When** they open the app, **Then** the onboarding carousel is shown as the first screen.
2. **Given** the onboarding carousel, **When** the user completes all three steps, **Then** they are taken to the Sign Up screen.
3. **Given** the Sign Up screen, **When** the user submits valid credentials (email + password + confirm), **Then** their account is created and they land on the Home screen with their display name visible.
4. **Given** the Sign Up screen, **When** the user submits mismatched passwords, **Then** an inline error is shown on the confirm field and the form is not submitted.
5. **Given** a returning user who has already onboarded, **When** they open the app while logged out, **Then** the Login screen is shown directly (onboarding is skipped).

---

### User Story 2 — Returning player signs in and navigates the app (Priority: P1)

A returning player opens the app, enters their credentials on the login screen, and is taken to the Home screen. From there they can navigate to Create Room, their Profile, or enter a room code to join a lobby. The top bar always shows their player chip and XP count.

**Why this priority**: Login is the most frequent entry path for existing users. The Home screen is the hub for all game-starting actions.

**Independent Test**: A user with an existing account can sign in, see the Home screen's "Create Room" and "Join Room" CTAs, and access their Profile page from the top bar player chip.

**Acceptance Scenarios**:

1. **Given** the Login screen, **When** the user enters valid credentials, **Then** they land on the Home screen with the fire-gradient hero and both CTAs visible.
2. **Given** the Login screen, **When** the user enters wrong credentials, **Then** an inline error message is shown (no screen change, no data loss).
3. **Given** the Home screen, **When** the user clicks the player chip in the top bar, **Then** the Profile screen opens.
4. **Given** any authenticated screen, **When** the user clicks the Zonite logo, **Then** they return to the Home screen.
5. **Given** the Home screen, **When** the user clicks "Join Room" and types a 6-character code, **Then** they navigate to the Lobby for that room.
6. **Given** the Home screen, **When** the user enters a code shorter or longer than 6 characters and submits, **Then** an inline validation error is shown.

---

### User Story 3 — Player navigates the full game loop visually (Priority: P2)

An authenticated player creates a room, enters the lobby, sees the room code displayed prominently, starts the game, sees the grid and countdown, and after the game ends sees the results screen. All screens match the Claude Design handoff visually.

**Why this priority**: The connected screens (Home → Create → Lobby → Game → Results) form the core game loop. The visual fidelity of this flow is critical for launch.

**Independent Test**: Starting from the Home screen, a player can reach each of the five game-loop screens in sequence, and each screen's visual layout matches the design handoff (correct colors, typography, animations, and layout).

**Acceptance Scenarios**:

1. **Given** the Home screen, **When** the user clicks "Create Room" and configures settings (mode, grid size, time limit, max players), **Then** submitting the form navigates to the Lobby with the generated 6-character room code prominently displayed.
2. **Given** the Lobby, **When** the host clicks "Start Game", **Then** the Game screen appears with the full grid, HUD bar, and countdown.
3. **Given** the Game screen, **When** a player clicks a cell, **Then** the claim action is sent and the cell updates to the claimant's color after server confirmation.
4. **Given** the Game screen, **When** the countdown reaches 0, **Then** the Results screen appears with player/team rankings.
5. **Given** the Results screen, **When** the player clicks "Play Again", **Then** they return to the Lobby with the same room code.
6. **Given** the Results screen, **When** the player clicks "Back to Home", **Then** the room state is cleared and the Home screen appears.

---

### User Story 4 — Player resets their password (Priority: P2)

A player who has forgotten their password uses the "Forgot password?" link from the login screen. They enter their email, receive a 6-digit OTP, enter it along with a new password, and can then sign in with the new credentials.

**Why this priority**: Password reset is a standard trust feature. Blocking users from account recovery damages retention.

**Independent Test**: From the Login screen, a user can reach the Forgot Password screen, submit their email, reach the Reset screen, enter a valid OTP and new password, and be redirected to Login.

**Acceptance Scenarios**:

1. **Given** the Login screen, **When** the user clicks "Forgot password?", **Then** the Forgot Password screen appears with an email input.
2. **Given** the Forgot Password screen, **When** the user submits their email, **Then** a success indicator appears and they are taken to the Reset Password screen.
3. **Given** the Reset Password screen, **When** the user enters a valid OTP and a matching new password + confirm, **Then** they are redirected to Login with a success toast.
4. **Given** the Reset Password screen, **When** the OTP input is complete (all 6 digits), **Then** the focus automatically moves to the new password field.

---

### User Story 5 — Player views their profile and signs out (Priority: P2)

An authenticated player visits their Profile screen from the top bar. They see their stats (total matches, wins, blocks claimed, current streak) and a paginated list of recent matches. They can sign out from the Profile screen via a confirmation modal.

**Why this priority**: Profile is a retention feature — players need to track their progress. Logout is a basic session-management requirement.

**Independent Test**: From any authenticated screen, clicking the player chip opens the Profile; the profile shows correctly-labeled stat cards; clicking "Sign out" shows a confirmation modal and, on confirm, returns the user to the Login screen.

**Acceptance Scenarios**:

1. **Given** the Profile screen, **When** it opens, **Then** four stat cards are visible (Matches, Wins, Blocks Claimed, Streak) with their values.
2. **Given** the Profile screen, **When** the user scrolls through recent matches, **Then** each row shows mode, grid size, room code, blocks claimed, XP, and result (won/lost).
3. **Given** the Profile screen, **When** the user clicks "Sign out", **Then** a confirmation modal appears before any action is taken.
4. **Given** the sign-out confirmation modal, **When** the user confirms, **Then** the session is cleared and the Login screen is shown.

---

### User Story 6 — Player's session survives a page refresh (Priority: P3)

An authenticated player refreshes the page (or closes and reopens the browser tab). Their login state is restored automatically without requiring them to sign in again. The correct screen and any in-progress room state are preserved or gracefully recovered.

**Why this priority**: Session persistence is baseline UX. Losing authentication on every refresh breaks the game flow.

**Independent Test**: After signing in and navigating to the Home screen, refreshing the page restores the authenticated Home screen without redirecting to Login.

**Acceptance Scenarios**:

1. **Given** an authenticated player on the Home screen, **When** they refresh the page, **Then** the Home screen reappears and the player chip shows their name and XP.
2. **Given** an unauthenticated visitor, **When** they navigate directly to any authenticated route, **Then** they are redirected to the appropriate auth screen (onboarding or login).
3. **Given** a player who onboarded but is logged out, **When** they refresh, **Then** the Login screen is shown (not onboarding again).
4. **Given** a player in the middle of a game, **When** their connection drops and they reconnect, **Then** the full game state is restored from the server and they can continue playing.

---

### Edge Cases

- What happens when a room code entered on the Home screen does not exist? The app shows an inline error without leaving the Home screen.
- What happens when the player's authentication token expires mid-session? The app silently refreshes the token using the refresh token; if that also fails, the player is redirected to Login.
- What happens when the player loses their internet connection during a game? The connection indicator shows "disconnected", and on reconnect the full game state is fetched and applied.
- What happens on a grid larger than fits the viewport? The game grid scrolls or scales to fit, keeping the HUD bar always visible.
- What happens when the OTP on the reset screen is entered incorrectly? An inline error is shown on the OTP field; the user can re-enter.

---

## Requirements _(mandatory)_

### Functional Requirements

**Authentication & Onboarding**

- **FR-001**: The app MUST present a three-step animated onboarding carousel to first-time visitors before any other screen.
- **FR-002**: Once onboarded, returning visitors MUST be taken directly to the Login screen (onboarding never shown again, even after logout).
- **FR-003**: Players MUST be able to register with an email address and password; the signup form MUST include a live password strength indicator and a confirm password field.
- **FR-004**: Players MUST be able to sign in with email and password.
- **FR-005**: Players MUST be able to initiate a password reset via email, entering a 6-digit OTP received by email followed by a new password.
- **FR-006**: The OTP input MUST be a specialized 6-box field where focus advances automatically between digits.
- **FR-007**: Players MUST be able to sign out from the Profile screen; sign-out MUST show a confirmation modal before clearing the session.
- **FR-008**: All non-auth routes MUST redirect unauthenticated players to the appropriate auth screen.

**Navigation & Layout**

- **FR-009**: Every screen MUST use the Zonite shell: dark canvas (`--ink-900`), top bar with logo + right slot, optional animated grid background and corner blobs.
- **FR-010**: The top bar logo MUST be clickable and return authenticated players to the Home screen; for unauthenticated players it MUST return to the start of the auth flow.
- **FR-011**: Authenticated players MUST see a player chip (display name + XP count) in the top bar; clicking it MUST open the Profile screen.

**Home Screen**

- **FR-012**: The Home screen MUST display a fire-gradient "CLAIM YOUR TERRITORY" hero headline and two primary CTAs: "Create Room" and "Join Room".
- **FR-013**: The "Join Room" CTA MUST expand inline to show a 6-character code input; submitting a valid code MUST navigate to that room's Lobby.
- **FR-014**: The Home screen MUST display three mini stats: Active rounds, Online now, and Season indicator.

**Create Room Screen**

- **FR-015**: The Create Room screen MUST provide configuration for: game mode (Solo / Red vs Blue), board size (single square-grid slider, min 5, max 50, default 12), time limit (segmented selector: 30s / 60s / 90s / 120s, default 60s), and max players (min 2, max 10, default 6).
- **FR-016**: The board size slider MUST show a live grid preview that redraws as the slider moves.
- **FR-017**: Submitting the form MUST create the room via the backend API and navigate to the Lobby showing the generated 6-character code.

**Lobby Screen**

- **FR-018**: The Lobby MUST display the room code prominently with a one-click copy-to-clipboard button.
- **FR-019**: The Lobby MUST show a summary row of room configuration (mode, grid dimensions, time limit, max players).
- **FR-020**: The Lobby MUST list all connected players; each player row MUST show avatar, display name, rank pill, ready status, host crown (for the host), and team badge (in Team mode).
- **FR-021**: The host MUST see a "Start Game" button gated on a minimum of 2 ready players; non-host players MUST see a "Ready" toggle.
- **FR-022**: The Lobby MUST update in real time as players join, leave, or toggle their ready status.

**Game Screen**

- **FR-023**: The Game screen MUST render the full square grid (size × size cells) where each cell can be empty, owned by the local player, or owned by another player/team.
- **FR-024**: Clicking a cell MUST send a claim request to the server; the cell MUST only update visually after the server confirms the claim.
- **FR-025**: Newly claimed cells MUST play the `claimPulse` animation.
- **FR-026**: The HUD bar MUST show: room code (with copy button), game mode, grid dimensions, and the countdown timer.
- **FR-027**: The countdown timer MUST change color based on remaining time: yellow (>20s), orange (≤20s), red with `timerPulse` animation (≤10s).
- **FR-028**: A collapsible sidebar MUST show live scores — in Team mode: two team bars (red/blue) with block counts; in Solo mode: ranked player list. Below scores: a live claim feed.
- **FR-029**: On socket reconnect, the app MUST request the full game state and repopulate the board without requiring user action.

**Results Screen**

- **FR-030**: The Results screen background MUST flood with the winning team's color (Team mode) or the fire gradient (Solo mode).
- **FR-031**: Results MUST show each player/team with rank, block count, board coverage percentage, and a final board thumbnail.
- **FR-032**: In Solo mode, the top 3 players MUST appear in a podium layout; in Team mode, a winning team banner MUST appear with per-team individual breakdowns.
- **FR-033**: Results MUST offer two CTAs: "Play Again" (returns to Lobby with same room code, resets readiness) and "Back to Home" (clears room state and navigates to Home).

**Profile Screen**

- **FR-034**: The Profile screen MUST show: avatar, display name, join date, and XP.
- **FR-035**: The Profile MUST display four stat cards: Matches, Wins, Blocks Claimed, Current Streak.
- **FR-036**: The Profile MUST show a paginated list of recent match history rows with: won/lost indicator, mode, grid size, room code, blocks claimed, XP earned, and relative timestamp.
- **FR-037**: The Profile MUST include a settings section with at least a "Change password" option; other settings may be placeholders for future phases.

**Session & Real-Time**

- **FR-038**: Authentication state (tokens, user info, onboarded flag) MUST persist across page refreshes and browser sessions using the browser's persistent storage.
- **FR-039**: The `onboarded` flag MUST persist even after logout, so returning users never see onboarding again.
- **FR-040**: All authenticated API calls MUST attach the current access token; on receiving a 401 response, the app MUST attempt a silent token refresh and retry the request once before logging the user out.
- **FR-041**: The socket connection to the `/game` namespace MUST authenticate using the current access token on handshake.
- **FR-042**: Game state (grid, scores, timer) MUST be populated entirely from socket events — no REST polling during active gameplay.

**Visual Design**

- **FR-043**: All colors MUST come exclusively from the design token CSS variables defined in `tokens.css`; no hard-coded hex values are permitted anywhere in the frontend source.
- **FR-044**: Typography MUST use `--font-ui` (Mulish) for body/UI text and `--font-display` (Bruno Ace SC) for headlines and large display values.
- **FR-045**: The following animations MUST be present and match the handoff: `claimPulse`, `cellPulse`, `timerPulse`, `gridDrift`, `fadeUp`.
- **FR-046**: Screen transitions MUST use the `fadeUp` animation.

### Key Entities

- **Player Session**: user identity (display name, XP, email), access token, refresh token, onboarded flag — persisted across reloads.
- **Room Config**: room code, game mode, grid size, time limit, max players, host player ID.
- **Lobby State**: list of connected players with their ready status, team assignment, and host crown.
- **Game State**: 2D grid of cells (each with claimed-by player ID and team), per-player scores, timer, game status. Sourced entirely from socket events.
- **Results**: final grid snapshot, player rankings (rank, score, coverage %), team scores in Team mode.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new player can complete the full first-time flow (onboarding → sign up → Home screen) in under 2 minutes.
- **SC-002**: An authenticated player can navigate from the Home screen to an active game session (Home → Create → Lobby → Game start) in under 90 seconds.
- **SC-003**: A page refresh on any authenticated screen restores the correct screen and user state within 1 second, without showing a flash of the wrong content.
- **SC-004**: After a socket disconnection, the game state is fully resynced and the player can resume gameplay within 2 seconds of reconnecting.
- **SC-005**: Every screen in the app passes a visual diff against the Claude Design handoff prototype with no structural or color deviations; zero hard-coded hex values exist in the frontend source tree.
- **SC-006**: The countdown timer updates every second with no perceptible lag; color state transitions (yellow → orange → red) fire at exactly the correct remaining-time thresholds.
- **SC-007**: Cell claim events update the game board within 300ms of the server confirmation event being received.
- **SC-008**: Auth token refresh is transparent — the player never sees a 401 error screen during normal use when a valid refresh token exists.

---

## Assumptions

- The backend API (Phases 2–5) is fully operational and accessible at the expected base URL before Phase 6 frontend testing begins.
- The Claude Design handoff bundle at `docs/design/zonite-game/` is the authoritative visual reference; the spec does not duplicate pixel measurements already captured there.
- The `packages/shared` types and socket event constants are already defined (Phases 0–5) and will be re-exported from the frontend's `types/` directory without modification.
- Social authentication (Google, etc.) is scaffolded in the auth screens as visible buttons but not wired to a provider until a later phase; the buttons exist for visual completeness only.
- The "Change password" and other profile settings beyond display are treated as non-functional placeholders in this phase; only the password-reset flow (forgot/reset screens) is fully wired.
- The onboarding carousel content (three steps: claim territory / solo or team / real-time play) matches the Claude Design handoff; copy and imagery are not subject to change in this phase.
- The Mulish font (the Gilroy stand-in) is self-hosted; no external Google Fonts CDN call is made in production.
- Match history data on the Profile screen is read from the backend API via paginated REST; real data will replace mock values once the backend persists game results (Phase 4 game-over hook).
