# Feature Specification: Team Mode, Polish & Game Wrap-Up (Phase 8)

**Feature Branch**: `007-team-mode-polish`
**Created**: 2026-04-25
**Status**: Draft
**Phase**: 8 — Team Mode, Polish & Wrap-Up

---

## Overview

Phase 8 completes the Zonite game by implementing collaborative team-based play, allowing hosts to reconfigure rooms after creation, ensuring players can reconnect without losing their session, and validating the entire game loop end-to-end. This phase delivers a production-ready, fully playable Zonite experience.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Team-Based Gameplay (Priority: P1)

Two groups of players join a room configured for "Red vs Blue" mode, claim blocks as a coordinated team, and see a unified team winner declared at game end — alongside individual rankings within each team.

**Why this priority**: Team mode is a core product differentiator. Without it, the game only supports a single mode; shipping Phase 8 without it would be incomplete.

**Independent Test**: Two players on Red and two on Blue join the same room in TEAM mode. Each claims blocks. After the timer ends, the team with more blocks wins and both team and individual rankings are shown on the Results screen. Independently verifiable with just 4 browser tabs.

**Acceptance Scenarios**:

1. **Given** a room is in TEAM mode, **When** a player joins, **Then** they are assigned to either Red or Blue team (balanced across teams) and their team assignment is visible to all lobby participants.
2. **Given** players are in a live TEAM mode game, **When** any player claims a block, **Then** the block is colored in the claiming team's palette (red or blue), and both team score totals update instantly for all players.
3. **Given** two players on the same team claim different blocks, **When** the game ends, **Then** the winning team is declared by total block count, and individual rankings are shown within each team on the Results screen.
4. **Given** a team-mode game, **When** a player views their own claimed blocks, **Then** their blocks appear in a slightly lighter/brighter variant of their team color to distinguish "mine" from "teammate's".
5. **Given** the host selects TEAM mode on the Create Room screen, **When** the lobby loads, **Then** each player row shows a Red or Blue team badge next to their name.

---

### User Story 2 — Host Reconfigures Room in Lobby (Priority: P2)

A room host realizes after creating the room that they want to change the board size or match duration. They edit the settings from the lobby screen and all other connected players see the update instantly — without anyone needing to leave and rejoin.

**Why this priority**: Hosts frequently adjust settings based on who has joined. Without live editing, players would need to destroy and recreate rooms, which is a poor experience.

**Independent Test**: Host creates a room, a second player joins. Host changes board size from 12 to 20. Second player's lobby view reflects the new size without page reload. Testable with 2 browser tabs.

**Acceptance Scenarios**:

1. **Given** a room is in LOBBY status, **When** the host changes grid size, game duration, or player mode, **Then** all connected players see the updated config in their lobby view within 1 second.
2. **Given** the host edits room settings, **When** a non-host player views the lobby, **Then** they see the latest config but have no controls to modify settings.
3. **Given** the host updates mode from SOLO to TEAM, **When** the lobby refreshes, **Then** team badges and team assignment UI become visible for all players.
4. **Given** a lobby with connected players, **When** the host changes max players to a number lower than current occupancy, **Then** the change is rejected and the host sees an inline error.

---

### User Story 3 — Player Reconnects Mid-Game (Priority: P3)

A player loses their internet connection during a live game. Their blocks remain on the board. Within 15 seconds they reconnect and their game resumes exactly where it left off, including full board state and their current score.

**Why this priority**: Network interruptions are common. Players abandoning a game due to a brief disconnect destroys session quality and team balance.

**Independent Test**: Start a game in one browser tab. Disconnect the socket (e.g., toggle offline mode). Wait under 15 seconds. Reconnect. Verify board state, score, and remaining time are fully restored. Testable in one tab with browser devtools.

**Acceptance Scenarios**:

1. **Given** a player disconnects mid-game, **When** fewer than 15 seconds have passed, **Then** their blocks and score remain on the board (no `player_left` broadcast yet) and other players see no visible change.
2. **Given** a player reconnects within the 15-second grace window, **When** reconnection completes, **Then** they receive the full current game state (board + scores + remaining time) and can continue claiming blocks immediately.
3. **Given** a player disconnects and does not reconnect within 15 seconds, **When** the grace period expires, **Then** a `player_left` event is broadcast, their slot is freed, but their claimed blocks and frozen score remain in the results at game end.
4. **Given** the game ends while a player is disconnected, **When** results are shown to connected players, **Then** the disconnected player's final score (frozen at disconnect) is included in the leaderboard.

---

### User Story 4 — Complete End-to-End Game Loop (Priority: P4)

Two or more authenticated players can run multiple sequential games in the same room — each game starting fresh, ending with a results screen, and returning to the lobby — without any crashes, data leaks between rounds, or stuck states.

**Why this priority**: Stability of the full game loop determines whether the product is shippable. This is a quality-gate story.

**Independent Test**: Create a room, play 3 sequential games with 2 players. Verify correct results after each, state resets cleanly, no error toasts, no stale block data from prior rounds.

**Acceptance Scenarios**:

1. **Given** a game has finished and results are shown, **When** the host clicks "Play Again," **Then** all players return to the lobby with the same room code, all players show as "not ready," and the board is fully cleared.
2. **Given** a second game starts in the same room, **When** players claim blocks, **Then** no blocks from the previous game are visible and scores start from zero.
3. **Given** the game timer reaches zero, **When** results are calculated, **Then** rankings are accurate in both SOLO mode (by individual block count) and TEAM mode (team wins by total, individuals ranked within team).

---

### Edge Cases

- What happens when both teams have an equal block count at game end?
- What happens if a player joins a TEAM mode room when one team is already full?
- What happens if the host disconnects mid-game (not just during lobby)?
- What happens if a player tries to claim a block during the final second of the timer?
- What happens if a player reconnects after the game has already ended (results are showing)?

---

## Requirements _(mandatory)_

### Functional Requirements

**Team Mode — Backend**

- **FR-001**: In TEAM mode, the system MUST assign joining players to Red or Blue team, enforcing balance so neither team exceeds a one-player differential before the game starts.
- **FR-002**: The system MUST aggregate block counts per team so that team scores (Red total vs. Blue total) update in real time as blocks are claimed.
- **FR-003**: The game-over payload MUST include both team rankings (which team won) and individual player rankings within each team.
- **FR-004**: In TEAM mode, block ownership MUST record both the claiming player ID and their team color, so the frontend can render block colors independently.

**Team Mode — Frontend**

- **FR-005**: Unclaimed blocks MUST render in a neutral color (`--cell-empty` / `--team-neutral` tokens from the design system).
- **FR-006**: Red team blocks MUST render using the red team palette (`--team-red*` tokens); Blue team blocks MUST use the blue palette (`--team-blue*` tokens).
- **FR-007**: A player's own claimed blocks MUST render in a visually distinguishable variant of their team color (lighter/brighter) so they can identify their personal contribution.
- **FR-008**: Team score totals (Red vs. Blue) MUST always be visible in the game sidebar and update without page interaction.

**Room Config in Lobby**

- **FR-009**: The host MUST be able to edit grid size, match duration, and game mode from the Lobby screen while the room is in LOBBY status.
- **FR-010**: When the host saves updated config, the system MUST broadcast the new settings to all connected players; each player's lobby view MUST update without requiring a page reload or re-join.
- **FR-011**: Config edits MUST be rejected if the room is not in LOBBY status (i.e., cannot change settings once a game is in progress).
- **FR-012**: Reducing max players below the current occupancy MUST be rejected with a clear error to the host.

**Disconnect Handling**

- **FR-013**: When a player's socket disconnects, the system MUST retain their game state (blocks, score, team) for a 15-second grace period before treating them as departed.
- **FR-014**: If a player reconnects within the grace period, the system MUST send them a full game-state resync (board, scores, remaining time) and resume their session.
- **FR-015**: If the grace period expires without reconnection, the system MUST broadcast `player_left` to all other players and free the player's slot, while preserving their block claims on the board.
- **FR-016**: Disconnected players MUST still appear in the final results leaderboard with their score frozen at the moment of last disconnect.

**Results Screen**

- **FR-017**: In TEAM mode, the Results screen MUST display a winner banner in the winning team's color (red or blue gradient), followed by team block totals and individual rankings within each team.
- **FR-018**: In SOLO mode, the Results screen MUST display a fire-gradient flood with a podium-style top-3 and full individual ranking below.
- **FR-019**: "Play Again" MUST reset all player ready states, clear the board, and return all connected players to the lobby under the same room code.
- **FR-020**: "Back to Home" MUST clear all room and game state and navigate to the Home screen.

**Stability & Loop**

- **FR-021**: Sequential games in the same room MUST start with a fully clean board; no block state from a prior game may persist visually or in memory.
- **FR-022**: Equal-score ties in TEAM mode MUST produce a defined outcome (draw result rather than a crash or undefined winner).

### Key Entities

- **TeamAssignment**: Maps a player to a team color (RED, BLUE, or NONE) for the duration of a game session.
- **TeamScore**: Aggregate block count per team, recalculated on every claim event.
- **GameResults**: Final leaderboard including team rankings, individual rankings, block counts, and board percentage per player; persisted to the match history table at game end.
- **DisconnectGrace**: Ephemeral per-player timer (15 s) tracking whether a disconnected player is within the reconnect window.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Two players on opposing teams can complete a full TEAM mode game — from lobby to results screen — without any error states or manual intervention.
- **SC-002**: Block color updates reflecting team ownership reach all connected players within 200 ms of a claim event under normal network conditions.
- **SC-003**: A player who disconnects for up to 15 seconds and reconnects sees their board state fully restored with no missed blocks or score discrepancy.
- **SC-004**: The host can apply a room config change in the lobby and all connected players' UIs reflect the new config within 1 second.
- **SC-005**: Three sequential games can be played in a single room without any crash, stale state, or unhandled error reaching the UI.
- **SC-006**: Results accuracy: in 100% of completed games, the team with more blocks is declared winner; individual scores match the count of blocks claimed per player on the final board.
- **SC-007**: All socket event payloads between frontend and backend use types defined exclusively in `packages/shared` — zero type drift detectable via the monorepo type-check command.

---

## Assumptions

- The design system tokens (`--team-red*`, `--team-blue*`, `--team-neutral`, `--cell-empty`, `--grad-fire`) defined in Phase 1 (`tokens.css`) are in place and available; no new color values are introduced in Phase 8.
- The Results screen winner flood for TEAM mode uses `--team-red` or `--team-blue` gradients; for SOLO mode it uses `--grad-fire` — consistent with the Zonite design handoff prototype (`components/Results.jsx`).
- Team balance enforcement means neither team can have more than one extra player vs. the other (e.g., in a 5-player room Red can have 3 and Blue 2, but Red cannot have 4 and Blue 1).
- In the event of a tie (equal team block counts), the game declares a draw — no tiebreaker mechanic is required in this phase.
- The "Play Again" flow keeps the same room code and host; it does not create a new room.
- Host disconnect during a live game follows the same 15-second grace rule as any other player; if the host does not reconnect, the remaining players can still finish the game (no automatic game abort on host disconnect).
- The existing Sikka base response envelope, pagination, and auth system are already wired from Phase 4; Phase 8 extends them without modification.
- The `packages/shared` types for `TeamColor`, `GameMode`, `Results`, `RoomState`, and all socket events are already defined from earlier phases; Phase 8 adds only what's missing (e.g., `TeamScore`, `DisconnectGrace` concept types).
- Mobile responsiveness is a Phase 8 polish item only if the design handoff explicitly specifies breakpoints for the game and results screens; otherwise desktop-first applies.
