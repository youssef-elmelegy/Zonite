# Quickstart & Smoke-Test Guide — Phase 8

**Feature**: 007-team-mode-polish
**Date**: 2026-04-25

This guide describes how to run and smoke-test Phase 8 features from scratch. Follow these steps after implementation is complete.

---

## Prerequisites

- Docker and Docker Compose installed.
- Node 22 LTS (`nvm use` at repo root reads `.nvmrc`).
- `pnpm` installed globally.
- A `.env` file created from `.env.example` with at least `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` set.

---

## 1. Start the stack

```bash
# From repo root
pnpm install
pnpm dev          # → docker compose up --build (postgres + backend + frontend)
```

Wait for:

- `Backend is running on http://localhost:3000`
- Vite dev server on `http://localhost:5173`

---

## 2. Seed two test accounts

Open two separate browser windows (or incognito tabs) — each will be a different player.

**Window A (Player 1 — will be host)**:

1. Navigate to `http://localhost:5173`.
2. Register as `player1@test.com` / `Password1!` / display name `Alpha`.
3. Complete onboarding.

**Window B (Player 2)**:

1. Register as `player2@test.com` / `Password2!` / display name `Bravo`.
2. Complete onboarding.

---

## 3. Smoke Test — Team Mode Full Game Loop

### 3a. Create room in TEAM mode

**In Window A:**

1. Click **Create Room**.
2. Select mode **Red vs Blue**.
3. Set board size to `10`, time limit `30s`, max players `4`.
4. Click **Create**. You land on the Lobby screen.
5. Copy the 6-character room code.

**Verify**: Player 1 appears in the lobby with a **RED** team badge (first joiner → RED).

### 3b. Player 2 joins

**In Window B:**

1. Click **Join Room**, paste the room code, confirm.
2. You land on the Lobby screen.

**Verify**: Player 2 appears with a **BLUE** team badge. Both windows show both players.

### 3c. Host edits config in lobby

**In Window A (host):**

1. Change board size to `8` using the inline config editor.
2. Click **Save**.

**Verify**: Both windows update board size to `8×8` without reload.

### 3d. Both players ready up and start

1. Player 2 clicks **Ready**.
2. Player 1 (host) can now click **Start Game**.
3. Click **Start Game**.

**Verify**: Both windows transition to the Game screen with an `8×8` grid.

### 3e. Play the game

1. Both players click cells to claim blocks.
2. **Verify**:
   - Player 1's blocks appear in **red** palette.
   - Player 2's blocks appear in **blue** palette.
   - Claimed blocks of the current user appear slightly **lighter** than teammate's blocks.
   - Team scores update in the sidebar in real time.
   - Timer counts down; at ≤10 s it pulses red.

### 3f. Game ends and results

1. Wait for the 30-second timer to end (or claim all blocks).
2. Both windows navigate to the Results screen.
3. **Verify**:
   - The winning team banner matches the majority-block team color (red or blue gradient).
   - Both team scores and individual block counts are shown.
   - If scores are equal, banner reads "IT'S A DRAW" on a fire gradient.

### 3g. Play Again

**In Window A (host):**

1. Click **Play Again**.
2. Both windows return to the Lobby with `isReady = false` for all players.
3. **Verify**: Board is empty; scores are reset; room config is retained.

---

## 4. Smoke Test — Graceful Disconnect

1. Start a game (follow steps 3a–3d).
2. **In Window B (Player 2)**: Open DevTools → Network → go Offline.
3. **In Window A**: Continue claiming blocks. Observe that Player 2's blocks remain on the board.
4. Within 15 seconds, **go Online** in Window B.
5. **Verify**:
   - Window B shows a "Reconnecting…" overlay while offline.
   - On reconnect, Window B receives the full current board state instantly.
   - Player 2 can resume claiming blocks.
6. Repeat but stay offline for >15 seconds.
7. **Verify**: After 15 s, `player_left` fires — Window A shows Player 2 as departed. Player 2's existing blocks remain on the board (frozen score).

---

## 5. Smoke Test — Sequential Games

1. Complete a full game (team mode, steps 3a–3f).
2. Click **Play Again** (step 3g).
3. Play a second game.
4. **Verify**: No blocks from the first game are visible; scores start at 0; results after game 2 are independent of game 1.
5. Click **Play Again** again and run a third game.
6. **Verify**: All three games complete without crash or stale state.

---

## 6. Type-Check Gate

```bash
# From repo root
pnpm type-check
```

Must exit 0. Any type errors in `packages/shared`, `apps/backend`, or `apps/frontend` block the PR.

---

## 7. Known Edge Cases to Verify

| Scenario                                             | Expected                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| Both teams end with equal block count                | "IT'S A DRAW" banner, `isDraw: true` in `GAME_OVER` payload |
| Player 3 joins a TEAM room with 1R + 1B              | Assigned RED (balance: now 2R 1B)                           |
| Player 4 joins the same room                         | Assigned BLUE (balance: now 2R 2B)                          |
| Host tries to reduce max players below current count | Error toast; config unchanged                               |
| Non-host player tries to emit `update_room`          | Receives `exception` event; no config change                |
| Non-host player emits `reset_game`                   | Receives `exception` event; game state unchanged            |
