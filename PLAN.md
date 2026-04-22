# Zonite — Full Development Phases Plan

> Real-time block-claiming game | React + NestJS | TypeScript | Socket.io
> Built on Yalgamers design system | Documented in Spekit
> Visual design handed off via Claude Design (see `docs/design/zonite-game/`)

---

## Overview

Zonite is a real-time competitive game where players in a room race to claim blocks on a **square** configurable grid before a countdown ends. It supports solo and team modes (red vs blue), plus full account flow (onboarding, sign in / sign up, password reset, profile). The plan is structured into 8 sequential phases, each with clear deliverables.

### Design handoff (authoritative visual source)

A complete Claude Design prototype bundle — `zonite-game/` — is the authoritative visual and UX spec for every screen. It supersedes free-form audit of the Yalgamers frontend: tokens are pre-extracted, screens are fully mocked, and the intent is recorded in the design-team chat transcript. Layout is:

```
docs/design/zonite-game/
├── README.md                       ← handoff instructions (read first)
├── chats/chat1.md                  ← intent + iteration history
└── project/
    ├── Zonite App.html             ← primary prototype (routes + app shell)
    ├── colors_and_type.css         ← token source of truth (copy verbatim)
    ├── assets/                     ← logos
    └── components/                 ← Shell, Icons, Home, CreateRoom, Lobby,
                                      Game, Results, Auth, Profile, Countdown,
                                      GridCell
```

Rule: the prototype is prototype-grade HTML/CSS/JS. Match its **visual output pixel-perfectly**; rebuild it in the production stack (React 18 + Vite + Zustand + socket.io-client). Do not lift the prototype's internal structure or its `localStorage`-based state.

Board shape is **always square** (single size slider, min 5, max 50, default 12) — a product decision locked in during the design handoff.

---

## Project Structure (Monorepo)

```
zonite/
├── apps/
│   ├── backend/          ← NestJS (TypeScript)
│   └── frontend/         ← React + Vite (TypeScript)
├── packages/
│   └── shared/           ← shared types, enums, constants (consumed by both)
├── .env.example
├── docker-compose.yml
└── README.md
```

The `packages/shared` package is critical — it keeps socket event names, game state types, grid types, and room config interfaces in sync between frontend and backend without duplication.

---

## Phase 0 — Foundation & Project Setup

**Goal:** Everyone can run the project locally. Conventions are locked in. Spekit workspace is ready.

### 0.1 — Monorepo Initialization

- Initialize workspace with pnpm workspaces (or nx, but keep it lightweight)
- Configure TypeScript project references between `apps/backend`, `apps/frontend`, and `packages/shared`
- Set up ESLint + Prettier with shared config at root level
- Add husky + lint-staged for pre-commit checks
- Set up `.env.example` with all required variables documented inline

### 0.2 — Docker Compose (Local Dev)

- PostgreSQL service
- Backend service with hot reload
- Frontend service with Vite dev server
- No Redis, no message broker — keep it lean

### 0.3 — Shared Package

- Define all TypeScript interfaces that cross the wire: `RoomConfig`, `GameState`, `Player`, `Block`, `Team`, `GameMode`
- Define all socket event name constants as an enum (e.g., `GameEvents.BLOCK_CLAIMED`, `RoomEvents.PLAYER_JOINED`)
- Define all enums: `GameStatus` (LOBBY, PLAYING, FINISHED), `GameMode` (SOLO, TEAM), `TeamColor` (RED, BLUE, NONE)
- This package is the contract between frontend and backend

### 0.4 — Spekit Workspace Setup

- Create a Spekit Topic called **Zonite Dev Hub**
- Create initial Speks for: repo structure, environment setup, local dev guide, shared package contract
- Tag architecture decisions as they're made (a "Spek" per major decision)
- Invite all team members to the workspace
- Link the Spekit Topic in the repo README

---

## Phase 1 — Style Extraction (Yalgamers Design System)

**Goal:** Zonite looks and feels like a Yalgamers product from day one — driven by the committed **Claude Design handoff bundle**, not an ad-hoc audit.

### 1.1 — Commit the design handoff bundle

- Commit `docs/design/zonite-game/` verbatim (README, chat transcript, `Zonite App.html`, `colors_and_type.css`, `assets/`, every `components/*.jsx` prototype).
- The bundle is **read-only reference material**. Edits live in `apps/frontend/` or in `docs/design/CHANGES.md`; the bundle itself is never hand-mutated.
- Link `docs/design/zonite-game/README.md` from the root `README.md` so engineers find the handoff before writing UI code.

### 1.2 — Adopt `colors_and_type.css` as the token source of truth

- Copy `docs/design/zonite-game/project/colors_and_type.css` into `apps/frontend/src/styles/tokens.css` verbatim. It is the canonical token file.
- Wire it up: imported once from the frontend entry point (e.g., `main.tsx`) so every CSS variable is live at the `:root` level.
- Token categories shipped by the handoff (do NOT re-derive these):
  - **Brand**: `--ink-900/850/800/700` (dark canvas), `--accent-yellow*`, `--magenta-*`, `--fire-red/pink`, `--sky-*`, `--cyan-*`, `--lime-*`, `--orange-500`, `--peach-300`.
  - **Team / cell state**: `--team-red*`, `--team-blue*`, `--team-neutral`, `--cell-empty`, `--cell-empty-border`, `--cell-hover*`, `--cell-own`, `--cell-opponent`, `--cell-disabled`.
  - **Semantic**: `--bg-page`, `--bg-elevated`, `--bg-card`, `--bg-card-solid`, `--bg-overlay`, `--border-subtle/default/strong/accent`, `--focus-ring`.
  - **Gradients**: `--grad-fire` (`fire-red → accent-yellow`), `--grad-magenta-glass`, `--grad-magenta-solid`, `--grad-lime`, `--grad-page-veil`.
  - **Radii**: `--radius-xs` (4) → `--radius-3xl` (40), plus `--radius-pill` (100px) and `--radius-full` (9999px).
  - **Spacing (4pt)**: `--sp-0` … `--sp-16` (4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px).
  - **Type**: `--font-ui` (Mulish → Gilroy → Inter), `--font-display` (Bruno Ace SC → Clash Display), `--font-mono`. Weights 400/500/600/700. Scale `--fs-xs` (10) → `--fs-3xl` (40).
  - **Motion**: `--ease-out`, `--ease-in-out`, `--dur-fast/base/slow`.
  - **Breakpoints**: `--bp-mobile` (375), `--bp-tablet` (768), `--bp-desktop` (1280), `--bp-wide` (1920).
  - **Blur**: `--blur-sm/md/lg` for glass surfaces.
- **Tailwind (if used)** MUST wrap these CSS variables rather than redeclaring values — e.g., `colors.accent.yellow: 'rgb(var(--accent-yellow) / <alpha-value>)'` or plain `var(--accent-yellow)` references. No raw hex in `tailwind.config.ts`.
- Typography note: Gilroy is proprietary; ship the Mulish stand-in the handoff already wires up via Google Fonts. When licensed Gilroy `.woff2` files become available, swap the `@import` for `@font-face` in one place — no other file changes.

### 1.3 — Base Component Inventory (adapt from handoff)

The handoff already ships the full component set as prototypes under `docs/design/zonite-game/project/components/`. Phase 1 ports them to the production stack (React 18 + Vite + TypeScript) with **visual parity**, not a structural port.

Ship, in `apps/frontend/src/components/`:

- `layout/Shell.tsx` — page shell (top bar, corner blobs, grid background, page veil). Source: `Shell.jsx`.
- `layout/TopBar.tsx` — logo-home link + right-slot chrome. Source: `Shell.jsx::TopBar`.
- `layout/CornerBlobs.tsx`, `layout/GridBg.tsx` — decorative layers (gated on tweaks). Source: `Shell.jsx`.
- `common/PlayerChip.tsx` — name + XP pill used in the top bar. Source: `Shell.jsx::PlayerChip`.
- `common/Countdown.tsx` — animated countdown (warning / critical color shifts, pulse). Source: `Countdown.jsx`.
- `common/Icons.tsx` — icon set (re-export). Source: `Icons.jsx`.
- `ui/Button.tsx`, `ui/Input.tsx`, `ui/Field.tsx`, `ui/OtpField.tsx`, `ui/Badge.tsx`, `ui/Modal.tsx`, `ui/Alert.tsx`, `ui/Avatar.tsx`, `ui/Slider.tsx`, `ui/SegButton.tsx`, `ui/Chip.tsx` — extract from the prototype screens where they appear inline and promote to reusable primitives. Source: `Auth.jsx`, `CreateRoom.jsx`, `Lobby.jsx`, `Profile.jsx`.
- `game/GridCell.tsx` — claim-pulse cell with owner/empty/hover states. Source: `GridCell.jsx` + `Game.jsx::Cell`.

Screen-specific primitives (`ModeCard`, `SectionHeader`, `SummaryItem`, `PlayerRow`, `SettingRow`, `StatCard`, `BoardThumb`, etc.) stay co-located with their consuming screen (Phase 7) — they are not pulled into `ui/`.

### 1.4 — Animations & interaction tokens

Copy the keyframes defined in `Zonite App.html` into a global stylesheet consumed by the frontend: `claimPulse`, `cellPulse`, `timerPulse`, `gridDrift`, `zpulse`, `fadeUp`, plus the `input[type=range]` custom thumb styling. These are part of the product, not prototype scaffolding.

### 1.5 — Quality gates

- Add an ESLint rule (or equivalent) that blocks hard-coded hex colors and raw `font-family` declarations in `apps/frontend/src/**` outside the designated token file(s).
- A monorepo-wide type-check MUST still pass; token adoption does not introduce new `any` surface.
- Before Phase 1 exit: one visual-diff pass comparing the rendered app's landing/auth/lobby/game/results views against the handoff prototype screenshots captured in Spekit.

### 1.6 — Spekit Documentation

- Spek: **"Zonite Design System — token sources and override policy"** — link to `tokens.css`, describe the override policy (new token vs. local style vs. reject), name the lint rule that enforces it, and point at the handoff bundle.
- Spek: **"Claude Design handoff bundle — what it is and how to update"** — explains the bundle is read-only reference, how to refresh it when Design ships a new version, and how to diff `colors_and_type.css` deltas into `tokens.css`.
- Spek: **"Zonite typography — Gilroy vs. Mulish fallback"** — records the Mulish stand-in decision and the one-file swap when Gilroy is licensed.
- Attach screenshots of each handoff screen (Onboarding, Login, Signup, Forgot, Reset, Home, Create, Lobby, Game, Results, Profile) to the design-system Spek for future reference.

---

## Phase 2 — Backend Foundation (NestJS)

**Goal:** A production-shaped backend built on the existing Sikka Platform backend patterns.

### 2.1 — Project Initialization (BASED ON EXISTING PROJECT)

- Extend existing backend structure from:
  `/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend`

- Do NOT reinvent structure — follow its conventions strictly:
  - Existing module system
  - Existing config loader pattern
  - Existing env handling strategy (centralized env module)
  - Existing bootstrap flow in `main.ts`

- Configure:
  - `ConfigModule` using existing central env system (do not duplicate config layers)
  - Database connection using existing DB module pattern (reuse existing provider structure)
  - Global validation pipe following Sikka standard setup
  - Global exception filter using existing base error handler

---

### 2.2 — Backend Folder Structure (ADAPTED TO SIKKA STYLE)

---

### 2.3 — Core Backend Rules (INHERITED FROM SIKKA PLATFORM)

You MUST reuse existing system components:

#### Base Response System (MANDATORY)

- All API responses must use Sikka base response wrapper
- No custom response format allowed
- Game endpoints must return:
  - `data`
  - `meta`
  - `errors` (if any)

#### Pagination System (MANDATORY)

- Use existing pagination helpers from Sikka
- Apply to:
  - room listing
  - match history
  - leaderboard queries

#### Auth System (STRICT REUSE)

- Do NOT rebuild auth
- Extend existing Sikka auth module:
  - JWT strategy already defined
  - Guards already exist
  - Current user decorator already exists

- Only add game-specific role checks if needed

---

### 2.4 — Swagger / Scaler Docs (EXISTING SYSTEM)

- Use existing Sikka documentation pipeline:
  - Scaler-style API docs (already configured in project)

- Only register new modules under existing docs registry
- Do not create separate Swagger bootstrap unless missing

---

### 2.5 — Shared Examples / Patterns (FROM EXISTING PROJECT)

Before implementing any new module:

- Copy patterns from:
  - Existing service structure in Sikka backend
  - Existing controller + service separation rules
  - Existing DTO validation patterns
  - Existing error handling conventions

Rules:

- No new architectural pattern introduced
- Everything must align with Sikka backend style

Add Speks:

- "Sikka backend architecture rules"
- "How to extend a module safely"

---

## Phase 3 — Room System

**Goal:** Players can create rooms, configure them, and join them. Room state persists in DB.

### 3.1 — Room Entity & Config

The `Room` entity stores:

- `id`, `code` (6-character human-readable join code, e.g., `ZX7K4P`), `status` (LOBBY/PLAYING/FINISHED)
- `hostUserId`
- `gameMode`: SOLO or TEAM
- `gridSize` (default 12, min 5, max 50) — **board is always a square** per the design handoff; a single `size` is the only grid dimension stored
- `durationSeconds` (default 60, allowed presets 30 / 60 / 90 / 120, min 30, max 300)
- `maxPlayers` (default 6, min 2, max 10)
- `createdAt`, `startedAt`, `endedAt`

### 3.2 — Room CRUD Endpoints

- `POST /rooms` — create room (host only), returns room code
- `GET /rooms/:code` — get room details (used by join page)
- `PATCH /rooms/:code` — update room config (host only, only in LOBBY status)
- `DELETE /rooms/:code` — close room (host only)
- `GET /rooms` — list public rooms in LOBBY status (optional, for a browse screen)

### 3.3 — Room Service Logic

- Generate unique, collision-resistant **6-character** room codes (matches the `XXXXXX` copyable code shown in the Lobby design)
- Enforce max players cap
- Only host can update room config
- Room transitions: LOBBY → PLAYING → FINISHED (irreversible in one direction)

### 3.4 — Spekit Documentation

- Add a Spek: "Room lifecycle — states, transitions, and who can do what"

---

## Phase 4 — Game Engine (Backend, In-Memory)

**Goal:** The core game logic lives in a service that manages game state per room entirely in memory during a session. State is saved to DB only at game end.

### 4.1 — In-Memory Game State

The `GameStateService` is a singleton that holds a `Map<roomId, GameState>`:

Each `GameState` holds:

- `size`: integer — the square board's edge length (copied from `Room.gridSize` at game start)
- `grid`: a 2D array of `Block` objects sized `size × size`. Each `Block` has `{ x, y, claimedBy: userId | null, teamColor: TeamColor | null }`. Per-player display color is NOT stored on the block (the frontend derives it from the claimer's `PlayerState.color`).
- `players`: a map of `playerId → PlayerState` (score, team, socketId, `color` — in SOLO mode assigned from a 10-entry palette; in TEAM mode the team color wins)
- `status`: LOBBY | PLAYING | FINISHED
- `timer`: remaining seconds
- `startedAt` timestamp

### 4.2 — Block Claim Logic

- A player sends a `claim_block` event with `{ x, y }`
- Backend validates: game is PLAYING, block is not already claimed, player is in the room
- If valid: mark block as claimed by this player (and team), update player score
- Broadcast updated block state to all players in the room
- In TEAM mode: score is the count of blocks owned by the team, not individual

### 4.3 — Timer & Lifecycle

- On game start: initialize state, set `status = PLAYING`, start a `setInterval` every second
- Each tick: decrement timer, emit `game_tick` event with remaining time
- On timer reaching 0: stop interval, set `status = FINISHED`, calculate final results, persist to DB, emit `game_over`
- The host can also trigger early start from the lobby (if all players are ready, optional)

### 4.4 — Score Calculation

- Solo mode: rank players by block count
- Team mode: aggregate block counts per team, then rank teams; within team, rank individuals
- `ResultsService` handles this calculation and formats the leaderboard payload

### 4.5 — Spekit Documentation

- Add a Spek: "Game engine — how in-memory state works and why"
- Add a Spek: "Block claim flow — validation rules"

---

## Phase 5 — WebSocket Gateway (NestJS + Socket.io)

**Goal:** Real-time, bi-directional game communication via a clean, well-guarded Socket.io gateway.

### 5.1 — Gateway Setup

- Use `@WebSocketGateway()` with `namespace: '/game'` and CORS configured
- Use `socket.io` adapter (not the default WS adapter) — install `@nestjs/platform-socket.io`
- Gateway uses rooms via `socket.join(roomCode)` to broadcast only to correct players

### 5.2 — Auth on WebSocket

- `WsJwtGuard`: extracts JWT from `socket.handshake.auth.token`, validates it, attaches user to socket data
- Apply at message handler level with `@UseGuards(WsJwtGuard)`
- On auth failure: emit `exception` event back and disconnect

### 5.3 — Event Handlers (Server ← Client)

| Event           | Payload        | Description                       |
| --------------- | -------------- | --------------------------------- |
| `join_room`     | `{ roomCode }` | Player joins room's socket room   |
| `leave_room`    | `{ roomCode }` | Player leaves socket room         |
| `player_ready`  | —              | Host sees who is ready            |
| `start_game`    | `{ roomCode }` | Host triggers game start          |
| `claim_block`   | `{ x, y }`     | Player claims a block             |
| `request_state` | `{ roomCode }` | Client asks for full state resync |

### 5.4 — Event Emitters (Server → Client)

| Event           | Payload                 | Description                            |
| --------------- | ----------------------- | -------------------------------------- |
| `room_state`    | `RoomState`             | Full room snapshot (on join or resync) |
| `player_joined` | `Player`                | New player joined the room             |
| `player_left`   | `playerId`              | Player disconnected                    |
| `game_started`  | `GameState`             | Game begins, full initial state        |
| `block_claimed` | `Block`                 | Single block update                    |
| `game_tick`     | `{ remaining: number }` | Every second                           |
| `game_over`     | `Results`               | Final leaderboard                      |
| `exception`     | `{ message }`           | Error feedback                         |

### 5.5 — WsExceptionFilter

- Custom filter that catches gateway errors and formats them as `{ event: 'exception', data: { message } }` before returning to client
- Never let raw stack traces reach the client

### 5.6 — Spekit Documentation

- Add a Spek: "WebSocket events reference — full table with payload shapes"
- This becomes the contract documentation for frontend devs

---

## Phase 6 — Frontend Foundation (React)

**Goal:** The React app is set up, routed, connected to the socket, and styled with Yalgamers tokens.

### 6.1 — Project Initialization

- Vite + React + TypeScript
- Install: `react-router-dom`, `zustand`, `socket.io-client`, `axios`, `react-query` (TanStack Query v5)
- Install: `clsx`, `tailwind-merge` (if using Tailwind), or the CSS variables from Phase 1

### 6.2 — Folder Structure

```
src/
├── styles/
│   ├── tokens.css       ← verbatim copy of docs/design/.../colors_and_type.css
│   └── animations.css   ← claimPulse, cellPulse, timerPulse, gridDrift, fadeUp
├── components/
│   ├── layout/          ← Shell, TopBar, CornerBlobs, GridBg
│   ├── ui/              ← Button, Input, Field, OtpField, Badge, Modal, Alert,
│   │                      Avatar, Slider, SegButton, Chip (adapted primitives)
│   ├── common/          ← PlayerChip, Countdown, Icons
│   └── game/            ← GridCell, Scoreboard, TeamScore, PlayerScoreRow
├── pages/
│   ├── auth/
│   │   ├── Onboarding.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── Home.tsx
│   ├── CreateRoom.tsx
│   ├── JoinRoom.tsx     ← (if a dedicated join screen lands; otherwise join UX is on Home)
│   ├── Lobby.tsx
│   ├── Game.tsx
│   ├── Results.tsx
│   └── Profile.tsx
├── hooks/
│   ├── useSocket.ts     ← socket instance + connection lifecycle
│   ├── useGameState.ts  ← subscribes to game events, updates store
│   └── useAuth.ts       ← JWT + user state + route guard
├── store/
│   ├── auth.store.ts    ← Zustand: user, tokens, onboarded flag, hydration
│   ├── room.store.ts    ← Zustand: current room config, players
│   └── game.store.ts    ← Zustand: grid, scores, timer
├── services/
│   ├── api.ts           ← Axios instance with interceptors
│   ├── auth.service.ts  ← login / signup / forgot / reset / logout
│   ├── profile.service.ts
│   └── room.service.ts
├── types/               ← re-export from packages/shared
└── constants/
    └── socket-events.ts ← re-export from packages/shared
```

### 6.3 — Axios API Service

- Base instance with `baseURL` from env
- Request interceptor: attach JWT from store
- Response interceptor: on 401, attempt token refresh, retry request once, then logout

### 6.4 — Socket Hook

- `useSocket` initializes the socket client with auth token
- Handles reconnect logic (socket.io handles this automatically, but hook exposes `isConnected` state)
- Exposes `emit` and `on` with TypeScript generic types for event safety

### 6.5 — State Management

- `auth.store.ts`: user profile, accessToken, refreshToken, `onboarded` flag, login/logout/signup/refresh actions. Hydrates from persisted storage on boot; the prototype uses `localStorage`, the production stack replaces that with the same pattern via `zustand/middleware/persist` (never direct `localStorage` reads in components).
- `room.store.ts`: roomCode, players, roomConfig (including `gridSize`, `durationSeconds`, `maxPlayers`, `mode`), myTeam
- `game.store.ts`: grid (flat array sized `size × size`), playerScores, teamScores, status, remainingTime
- Game store is populated entirely from socket events — no REST calls during gameplay

---

## Phase 7 — Game Screens & Account Screens (Frontend)

**Goal:** Every screen in the design handoff is implemented, functional, and styled. The full game loop and the full account flow work end-to-end. Each screen matches the prototype at `docs/design/zonite-game/project/` visually; behavior is wired to the real backend and socket gateway.

### 7.1 — Home Screen

Source: `components/Home.jsx`.

- Logged-in user lands here. Top bar shows logo + player chip (XP, rank pill) — clickable → Profile.
- Hero: big fire-gradient **"CLAIM YOUR TERRITORY"** headline over an animated mini-grid backdrop using `--grad-fire` and the `gridDrift` animation.
- Primary CTAs: **Create Room** (yellow CTA) and **Join Room** (outlined), with an inline 6-character code input under the Join toggle.
- Mini stats row (total matches, wins, streak) read from the `auth.store`.
- Optional: list of public rooms in LOBBY status (paged via Sikka pagination).

### 7.2 — Create Room Screen

Source: `components/CreateRoom.jsx`.

- Room configuration form styled as a single glass card on a dark canvas:
  - **Mode**: `ModeCard` toggle — Solo (one-vs-all) / Red vs Blue (team).
  - **Board Size**: a single `Slider` (label `Board Size · N × N`, min 5, max 50, default 12) with a live `GridPreview` that redraws cells in real time. The board is always square.
  - **Time Limit**: segmented `SegButton`s — `30s` / `60s` / `90s` / `120s` (default 60).
  - **Max Players**: stepper or slider (min 2, max 10, default 6).
- On submit: call `POST /rooms`, store the returned room, navigate to Lobby with the generated 6-char code displayed.

### 7.3 — Lobby Screen

Source: `components/Lobby.jsx`.

- Large, copyable 6-character room code at the top with a copy-to-clipboard button (success toast uses `--lime-400`).
- Room config summary row (mode, `N×N`, time, max players).
- `PlayerRow` list — each player shows avatar, name, rank pill, team badge (red/blue in TEAM mode), host crown (`--accent-yellow`), and a ready toggle. A spectator pill surfaces the spectator count.
- Host sees a **Start Game** button, gated on **≥ 2 ready** players (host counts). Non-host sees a **Ready** toggle.
- Wired to socket events: `player_joined`, `player_left`, `player_ready`, `room_updated` (for Phase 8.3 host-edits-in-lobby).

### 7.4 — Game Screen

Source: `components/Game.jsx` + `components/GridCell.jsx`.

- Full-screen square grid (`size × size`, from `game.store`). Each cell rendered via `GridCell` with states `empty` / `own` / `opponent` / `hover` / `disabled` and a `claimPulse` animation on newly-claimed cells.
- HUD bar: room code (copy icon), mode, `N×N` dims, and a large **`Countdown`**:
  - ≥ 21s: yellow (`--accent-yellow`)
  - ≤ 20s: orange (`--orange-500`)
  - ≤ 10s: red (`--team-red`) with `timerPulse` animation
- Sidebar (collapsible): scoreboard — in TEAM mode two `TeamScore` bars (red/blue) with live block counts; in SOLO mode a ranked `PlayerScoreRow` list. Below: a live claim feed.
- On cell click: emit `claim_block` with `{ x, y }`. The server is authoritative; the cell only flips after the `block_claimed` broadcast arrives.
- Reconnect: on socket reconnect emit `request_state` and repopulate the whole board from the response.

### 7.5 — Results Screen

Source: `components/Results.jsx`.

- Winner flood background: in TEAM mode a full-bleed gradient in the winning team's color; in SOLO mode a `--grad-fire` flood.
- Score breakdown with rank, block count, percent of board, and a `BoardThumb` thumbnail of the final state.
- In SOLO: podium-style top 3 + full ranking below. In TEAM: winning team banner + individual rankings within each team.
- CTAs: **Play Again** (re-enters Lobby with the same room code, readies reset) and **Back to Home** (clears room state).

### 7.6 — Onboarding & Auth Screens

Source: `components/Auth.jsx` — shared `AuthLayout` (hero + form column), `MiniGridArt`, `Field`, `OtpField`, `SocialRow`, `SocialGlyph`.

- **Onboarding** (`/onboarding`): three-step intro carousel (claim territory → solo or team → real-time play) with the animated `MiniGridArt`. Marks `zonite-onboarded` in the persisted auth store on completion, then routes to `/login`. Route-guarded so it is skipped for returning users.
- **Login** (`/login`): email + password, "Forgot password?" link, social auth row (providers surfaced as `SocialGlyph` — concrete providers gated by backend support), **Sign In** CTA, toggle to **Sign Up**. On success: hydrate `auth.store`, route to `/home`.
- **Signup** (`/signup`): username, email, password (with live strength meter), confirm password, social row. On success: same as login (or a welcome toast before Home).
- **Forgot Password** (`/forgot`): email input → calls the backend, routes to `/reset` with the email in-flight (short-lived state, not persisted).
- **Reset Password** (`/reset`): 6-digit `OtpField` + new password (with strength) + confirm. On success: toast + route to `/login`.
- **Logout**: triggered from Profile; clears `auth.store`, clears persisted tokens, clears any room state, routes to `/login`.

All auth forms share the same glass-card + fire-gradient hero and use the same primitives. Error states surface via inline `Field` error text; global errors via the `Alert` primitive.

Backend wiring: every call MUST go through the existing Sikka auth endpoints (login / signup / refresh / password reset) — no parallel auth system. Tokens are stored via the interceptor pattern from Phase 6.3; refresh-on-401 is transparent.

### 7.7 — Profile Screen

Source: `components/Profile.jsx`.

- Route: `/profile`. Reached from the `PlayerChip` in the top bar.
- Header card: avatar, display name, join-date caption, XP stat.
- Stats grid: 4 `StatCard`s — Matches, Wins, Blocks Claimed, Current Streak. Uses `--sky-300` for numeric stats and `--lime-400` for win rate.
- Recent matches: list rows showing won/lost, mode, size, room code, blocks claimed, XP, relative time. Data paged via Sikka pagination.
- Settings section: `SettingLine` rows — change password, notifications, language, etc. Settings beyond password are placeholders unless a product requirement lands.
- **Sign out** with a confirm modal (`Modal` primitive). On confirm: trigger the logout flow from 7.6.

### 7.8 — Route guards & persistence

- Every non-auth route is guarded: unauthenticated access redirects to `/onboarding` (if `onboarded=false`) or `/login` (if already onboarded).
- On hard reload: the `auth.store` rehydrates from persistent storage; routing decisions wait for rehydration to avoid flashes of the wrong screen.
- `onboarded` flag is persisted across logouts — a user who onboarded once does not see onboarding again.

### 7.9 — Spekit Documentation

Add Speks:

- "Game screen layout and grid rendering"
- "Block claim UX flow and optimistic-vs-authoritative trade-off"
- "Auth flow UX — onboarding, login, signup, forgot/reset, logout"
- "Profile screen — what is shown and where the data comes from"
- "Route guards and auth-store hydration"

---

## Phase 8 — Team Mode, Polish & Wrap-Up

**Goal:** Team mode is fully implemented. The game is stable, documented, and ready to extend.

### 8.1 — Team Mode Logic (Backend)

- On `join_room` with team mode: player specifies `teamColor` (RED or BLUE)
- Backend enforces team balance: if one team is full, redirect to the other (or let player choose freely, configurable)
- Score service aggregates per team: `teamScores: { RED: number, BLUE: number }`
- Game-over payload includes both team and individual rankings

### 8.2 — Team Mode UI (Frontend)

- Unclaimed blocks: neutral gray
- Red team blocks: red palette
- Blue team blocks: blue palette
- Your own blocks: slightly lighter/brighter shade of your team color
- Team scores are always visible in the sidebar, updated in real time

### 8.3 — Room Config Persistence (Host Can Edit in Lobby)

- Host can edit grid size, duration, and mode from the Lobby screen before starting
- `PATCH /rooms/:code` is called; new config is broadcast to all players via socket `room_updated` event
- Lobby updates without re-joining

### 8.4 — Disconnect Handling

- On socket disconnect: keep player in game state for 15 seconds (grace period)
- If they reconnect within grace: restore their session, send full state resync
- If not: remove player from game state, broadcast `player_left`
- On game end: disconnected players are still in the results with their score frozen at disconnect time

### 8.5 — Final Testing Checklist

- Two players can join the same room and claim blocks in real time
- Timer counts down and game ends correctly
- Results screen shows correct rankings in both solo and team mode
- Host can configure and start multiple sequential games
- Disconnect/reconnect works without crashing the room
- Swagger docs are accessible and accurate
- All socket events are typed end-to-end using `packages/shared` types

### 8.6 — Spekit Final Documentation Sprint

Document one Spek per major area:

1. Architecture overview (diagram + explanation)
2. How to add a new game mode
3. How to add a new socket event (backend + frontend steps)
4. How to change the grid size range
5. Auth flow — JWT + refresh
6. Environment variables reference
7. Local dev setup guide
8. Deployment guide (docker-compose for prod)

---

## Appendix A — Backend Libraries Reference

| Purpose    | Library                                                       |
| ---------- | ------------------------------------------------------------- |
| Framework  | `@nestjs/core`, `@nestjs/common`                              |
| WebSocket  | `@nestjs/websockets`, `@nestjs/platform-socket.io`            |
| Auth       | reuse Sikka auth system                                       |
| Validation | class-validator (Sikka standard)                              |
| ORM        | existing Sikka DB layer (TypeORM/Prisma depending on project) |
| Config     | centralized Sikka env module                                  |
| Docs       | Scaler docs system already in Sikka                           |
| Response   | Sikka base response wrapper (mandatory)                       |
| Pagination | Sikka pagination helpers (mandatory)                          |
| Testing    | `jest`, `@nestjs/testing`, `supertest`                        |

---

## Appendix B — Frontend Libraries Reference

| Purpose      | Library                                   |
| ------------ | ----------------------------------------- |
| Build        | `vite`, `typescript`                      |
| UI           | `react`, `react-dom`                      |
| Routing      | `react-router-dom` v6                     |
| State        | `zustand`                                 |
| Server state | `@tanstack/react-query` v5                |
| HTTP         | `axios`                                   |
| WebSocket    | `socket.io-client`                        |
| Styling      | Tailwind (match Yalgamers) or CSS modules |
| Utilities    | `clsx`, `date-fns`                        |

---

## Appendix C — Backend Rules Summary (SIKKA OVERRIDE RULES)

### MUST FOLLOW

- Sikka module structure (no deviation)
- Sikka base response format
- Sikka pagination system
- Sikka auth system
- Sikka env management
- Sikka error handling system

### MUST NOT DO

- No duplicate response wrappers
- No custom pagination logic
- No separate auth system
- No parallel config system
- No independent Swagger setup if Scaler docs exist

---

## Appendix D — Spekit Spek Checklist

By the end of the project, the Spekit workspace should contain at least these Speks:

- [ ] Repo structure and monorepo guide
- [ ] Local dev setup (step-by-step)
- [ ] Environment variables reference
- [ ] Architecture overview
- [ ] Shared package — types and event contracts
- [ ] Design system — token sources and override policy
- [ ] Claude Design handoff bundle — what it is and how to update
- [ ] Zonite typography — Gilroy vs. Mulish fallback
- [ ] Auth flow — JWT + refresh (backend)
- [ ] Auth flow UX — onboarding, login, signup, forgot/reset, logout
- [ ] Profile screen — what is shown and where the data comes from
- [ ] Route guards and auth-store hydration
- [ ] Room lifecycle
- [ ] Game engine — in-memory state
- [ ] Game screen layout and grid rendering
- [ ] Block claim UX flow and authoritative-server trade-off
- [ ] WebSocket events reference
- [ ] How to add a new socket event
- [ ] How to add a new REST endpoint
- [ ] How to add a new game mode
- [ ] Backend conventions (decorators, guards, filters)
- [ ] Frontend state management guide
- [ ] Deployment guide
