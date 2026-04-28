# Tasks: Team Mode, Polish & Game Wrap-Up (Phase 8)

**Input**: Design documents from `specs/007-team-mode-polish/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks are grouped by user story. The shared package foundation (Phase 2) must be complete before any user story work begins. After that, US1–US3 backend tasks are sequential within `game.gateway.ts` but frontend tasks for each story can proceed in parallel with backend work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (touches a different file than concurrent tasks)
- **[US1–US4]**: Maps to spec.md user story

---

## Phase 2: Foundational — Shared Package Contract

**Purpose**: Extend `packages/shared` with the two new event names, the `isDraw` field, and the `UpdateRoomPayload` type. Every task in every user story depends on this phase being complete.

**⚠️ CRITICAL**: No app-side work can begin until T001–T004 are done and `pnpm type-check` passes on the shared package.

- [x] T001 [P] Add `RESET_GAME: 'reset_game'` entry to the `GameEvents` const object in `packages/shared/src/events/game-events.enum.ts`
- [x] T002 [P] Add `UPDATE_ROOM: 'update_room'` entry to the `RoomEvents` const object in `packages/shared/src/events/room-events.enum.ts`
- [x] T003 [P] Add `isDraw?: boolean` optional field to the `Results` interface in `packages/shared/src/types/results.type.ts`
- [x] T004 [P] Add `UpdateRoomPayload` interface to `packages/shared/src/types/room-config.type.ts` — fields: `roomCode: string` (required), `gridSize?: number`, `durationSeconds?: number`, `maxPlayers?: number`, `gameMode?: GameMode`; export it from `packages/shared/src/index.ts`

**Checkpoint**: Run `pnpm type-check` on `packages/shared` — must pass zero errors before proceeding.

---

## Phase 3: User Story 1 — Team-Based Gameplay (Priority: P1) 🎯 MVP

**Goal**: Players in TEAM mode are assigned RED or BLUE at lobby-join time so team badges are visible in the lobby; the game engine broadcasts team scores; the Results screen handles the draw case.

**Independent Test**: Open two browser tabs. Create a TEAM mode room in tab A, join in tab B. Both tabs should show a RED badge (A) and BLUE badge (B) in the lobby before the game starts. Play the game; if scores are equal, Results shows "IT'S A DRAW" with fire gradient.

### Implementation for User Story 1

- [x] T005 [US1] Update `handleJoinRoom` in `apps/backend/src/modules/gateway/game.gateway.ts`: for rooms in TEAM mode (`room.gameMode === 'TEAM'`), count existing RED and BLUE players in `lobbyPlayers`; assign `TeamColor.RED` or `TeamColor.BLUE` (whichever group is smaller, or RED on tie) to the joining player's `teamColor` field instead of `TeamColor.NONE`; the updated `LobbyPlayer` wire object (with the new `teamColor`) is already included in the `PLAYER_JOINED` and `ROOM_STATE` broadcasts that follow
- [x] T006 [P] [US1] Add a `setMyTeam(color: TeamColor) => void` action to the `RoomStore` interface and implementation in `apps/frontend/src/store/room.store.ts` — sets `myTeam` field (field already exists, action is missing)
- [x] T007 [US1] Update the `GAME_STARTED` handler in `apps/frontend/src/hooks/useGameState.ts` to call `roomStore.setMyTeam(state.players[userId]?.teamColor ?? TeamColor.NONE)` where `userId` comes from `useAuthStore().user.id`; import `useRoomStore` and `TeamColor` (depends on T006)
- [x] T008 [P] [US1] Update `ResultsService.calculate()` in `apps/backend/src/modules/game/services/results.service.ts`: after computing `teamRankings`, check if `gameMode === GameMode.TEAM` and both teams share `rank === 1` (equal scores); if so, set `isDraw: true` on the returned `Results` object
- [x] T009 [P] [US1] Update `apps/frontend/src/pages/Results.tsx`: in the team-mode branch, check `results.isDraw === true`; if true, replace the winning-team gradient banner with a fire-gradient (`--grad-fire`) banner reading "IT'S A DRAW" and render both team scores side by side instead of a ranked winner/loser layout

**Checkpoint**: US1 fully functional — team badges visible in lobby, blocks colored per team, draw case renders correctly.

---

## Phase 4: User Story 2 — Host Reconfigures Room in Lobby (Priority: P2)

**Goal**: Host can edit grid size, duration, mode, and max players from the Lobby screen; all connected clients see the update immediately without reload.

**Independent Test**: Create a room (tab A, host), join from tab B. Host changes board size from 12 to 8. Tab B's lobby config row updates to 8×8 within 1 second without any page reload.

### Implementation for User Story 2

- [x] T010 [US2] Create `apps/backend/src/modules/gateway/dto/update-room.dto.ts` — export class `UpdateRoomDto` decorated with class-validator: `@IsString() roomCode: string`; `@IsOptional() @IsInt() @Min(5) @Max(50) gridSize?: number`; `@IsOptional() @IsInt() @Min(30) @Max(300) durationSeconds?: number`; `@IsOptional() @IsInt() @Min(2) @Max(10) maxPlayers?: number`; `@IsOptional() @IsEnum(GameMode) gameMode?: GameMode`; add a class-level `@ValidateIf` (or custom validator) requiring at least one optional field to be present
- [x] T011 [US2] Add `@SubscribeMessage(RoomEvents.UPDATE_ROOM)` handler `handleUpdateRoom` to `apps/backend/src/modules/gateway/game.gateway.ts` — guard with `@UseGuards(WsJwtGuard)`; validate `room.hostUserId === user.id` (throw `WsException('Only the host can update room config')`); validate `room.status === GameStatus.LOBBY`; validate `dto.maxPlayers >= lobby.get(roomCode)?.size` if `dto.maxPlayers` set; call `roomsService.update(roomCode, user.id, dto)` to persist; if `dto.gameMode` changed to `SOLO`, reset all lobby players' `teamColor` to `TeamColor.NONE`; if changed to `TEAM`, re-run the RED/BLUE balance assignment (same logic as T005) for all current lobby players; broadcast `this.server.to(roomCode).emit(RoomEvents.ROOM_UPDATED, updatedRoom.data)` where the payload is `RoomConfig` shape (gridSize, durationSeconds, maxPlayers, gameMode)
- [x] T012 [P] [US2] Update `apps/frontend/src/pages/Lobby.tsx`: (a) add a `ROOM_UPDATED` socket listener in the existing `useEffect` that calls `roomStore.setRoom(roomCode, newConfig)` to refresh displayed config; (b) render an inline "Edit" section visible only when `myPlayer?.isHost` showing the same `Slider` (board size), `SegButton` (time), stepper (max players), and `SegButton` (mode) controls that appear in `CreateRoom.tsx`; on any control change emit `socket.emit(RoomEvents.UPDATE_ROOM, { roomCode, [field]: value })` with a 300 ms debounce to avoid spamming

**Checkpoint**: US2 fully functional — host sees edit controls, all clients receive live config updates.

---

## Phase 5: User Story 3 — Player Reconnects Mid-Game (Priority: P3)

**Goal**: A player who loses connection during a live game has a 15-second window to reconnect and resume without missing their block claims; after 15 seconds they are marked as departed but their blocks remain.

**Independent Test**: Start a game, go offline in one tab for ≤15 s — blocks and score remain. Go offline for >15 s — opponent tab receives `player_left`, but block claims are frozen on the board.

### Implementation for User Story 3

- [x] T013 [US3] Update `apps/backend/src/modules/gateway/game.gateway.ts`:
      (a) Add `private readonly disconnectTimers = new Map<string, NodeJS.Timeout>()` class field.
      (b) In `handleDisconnect`: after existing lobby cleanup, check `this.gameStateService.hasGame(roomId)` — if the game is PLAYING, schedule `setTimeout(() => { this.gameStateService.removePlayer(roomId, playerId); this.server.to(roomCode).emit(RoomEvents.PLAYER_LEFT, playerId); this.disconnectTimers.delete(playerId); }, 15_000)` and store it in `disconnectTimers.set(playerId, timer)`.
      (c) In `handleJoinRoom`: at the top of the handler, call `clearTimeout(this.disconnectTimers.get(user.id)); this.disconnectTimers.delete(user.id)` to cancel any pending grace timer before re-adding the player.
      (d) In the `onGameOver` callback inside `handleStartGame`: iterate over `lobbyPlayers` (before they were deleted) and clear all timers: `for (const pid of playerMap keys) { clearTimeout(this.disconnectTimers.get(pid)); this.disconnectTimers.delete(pid); }`.
      Note: `GameStateService` may need a `removePlayer(roomId, playerId)` method if it does not already exist — add it to `apps/backend/src/modules/game/services/game-state.service.ts` if missing.
- [x] T014 [P] [US3] Update `apps/frontend/src/pages/Game.tsx`: replace the inline `<span style={{color:'var(--fire-red)'}}>Reconnecting…</span>` (currently inside the HUD) with a full-screen absolutely-positioned overlay `<div>` rendered when `!socket.isConnected`; style it with `background: rgba(0,0,0,0.75)`, `z-index: 100`, centered text reading "RECONNECTING…" using `--font-display` and `--accent-yellow` color; the overlay disappears automatically when `socket.isConnected` becomes `true` again (no user action needed)

**Checkpoint**: US3 fully functional — reconnect overlay shows, state is restored on return, grace expiry triggers `player_left`.

---

## Phase 6: User Story 4 — Complete End-to-End Game Loop (Priority: P4)

**Goal**: Host can click "Play Again" from the Results screen to return the full room to the Lobby in a clean state; sequential games work without stale data from prior rounds.

**Independent Test**: Play 3 sequential games in the same room. After each, click "Play Again". Verify scores reset to 0 and the board is empty at the start of each game.

### Implementation for User Story 4

- [x] T015 [P] [US4] Add `async resetToLobby(code: string, hostUserId: string): Promise<void>` method to `apps/backend/src/modules/rooms/services/rooms.service.ts` — fetch the room row; throw `ForbiddenException` if `room.hostUserId !== hostUserId`; update `rooms` row: `status = 'LOBBY', startedAt = null, endedAt = null`; return void (no response envelope needed — called only from the gateway)
- [x] T016 [US4] Add `@SubscribeMessage(GameEvents.RESET_GAME)` handler `handleResetGame` to `apps/backend/src/modules/gateway/game.gateway.ts` — guard with `@UseGuards(WsJwtGuard)`; validate `room.hostUserId === user.id`; call `await this.roomsService.resetToLobby(roomCode, user.id)`; call `this.gameStateService.removeGame(room.id)` if the game exists; re-populate the lobby map from currently-connected sockets in room `roomCode`: for each socket in `this.server.sockets.adapter.rooms.get(roomCode)`, create a fresh `InternalLobbyPlayer` with `isReady = false`, `teamColor` assigned per the balance rule for TEAM mode (or `NONE` for SOLO); broadcast `this.server.to(roomCode).emit(RoomEvents.ROOM_STATE, this.buildRoomState(room, lobbyPlayers))` so all clients transition to the Lobby
- [x] T017 [P] [US4] Update `apps/frontend/src/pages/Results.tsx`: wire the "Play Again" button `onClick` to call `socket.emit(GameEvents.RESET_GAME, { roomCode: rc })` where `rc = useParams().code`; the existing `ROOM_STATE` listener (added in T018) handles navigation — the button just emits the event and disables itself while waiting
- [x] T018 [P] [US4] Update `apps/frontend/src/hooks/useGameState.ts`: add a `ROOM_STATE` event listener that fires when the game store's `status` is `FINISHED` (i.e., coming from a reset, not from initial lobby join); when fired, call `gameStore.clearGame()`, `roomStore.setPlayers(state.players)`, and `navigate('/lobby/' + state.roomCode)` to redirect all clients back to the lobby — import `useNavigate` and guard against running this listener during the initial lobby phase

**Checkpoint**: US4 fully functional — "Play Again" returns all players to a clean lobby; 3 sequential games complete without crash or stale state.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, lint cleanliness, and end-to-end validation.

- [x] T019 Run `pnpm type-check` from repo root; fix all TypeScript errors introduced in T001–T018 across `packages/shared`, `apps/backend`, and `apps/frontend`
- [x] T020 [P] Run `pnpm lint` from repo root; fix all ESLint errors and warnings in every file modified in T001–T018
- [ ] T021 Follow `specs/007-team-mode-polish/quickstart.md` step by step to smoke-test: (a) full TEAM mode game with draw scenario, (b) host config edit in lobby, (c) disconnect/reconnect within grace window, (d) disconnect past grace window, (e) three sequential Play Again rounds — all must pass without error

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2, T001–T004)**: No dependencies — start immediately. **BLOCKS all user stories.**
- **US1 (Phase 3, T005–T009)**: Depends on Phase 2 completion. T005 must precede T007 (gateway must pre-assign teams before frontend reads them). T006 must precede T007. T008 and T009 can run in parallel with T005–T007 (different files).
- **US2 (Phase 4, T010–T012)**: Depends on Phase 2. T010 must precede T011 (DTO before handler). T011 in `game.gateway.ts` must be sequenced **after T005** (same file). T012 (frontend) can run in parallel with T010–T011.
- **US3 (Phase 5, T013–T014)**: Depends on Phase 2. T013 in `game.gateway.ts` must be sequenced after T011 (same file). T014 (frontend) can run in parallel with T013.
- **US4 (Phase 6, T015–T018)**: Depends on Phase 2. T015 can run in parallel with T016 (different files). T016 in `game.gateway.ts` must be sequenced after T013 (same file). T017 and T018 can run in parallel (different files).
- **Polish (Phase 7, T019–T021)**: Depends on all prior phases complete.

### Gateway Task Order (Sequential — same file)

All backend gateway changes touch `apps/backend/src/modules/gateway/game.gateway.ts` and must be committed sequentially:

```
T005 (handleJoinRoom team assign) → T011 (handleUpdateRoom) → T013 (grace timers) → T016 (handleResetGame)
```

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on US2, US3, or US4.
- **US2 (P2)**: Starts after Phase 2. Gateway handler (T011) sequenced after T005 (same file); frontend (T012) is parallel.
- **US3 (P3)**: Starts after Phase 2. Gateway work (T013) sequenced after T011; frontend (T014) is parallel.
- **US4 (P4)**: Starts after Phase 2. Rooms service (T015) is parallel; gateway work (T016) sequenced after T013; frontend (T017, T018) parallel.

### Parallel Opportunities

- **Phase 2**: T001, T002, T003, T004 — all different files, run simultaneously.
- **US1**: T008 (results.service.ts) + T009 (Results.tsx) can run in parallel with T005 (gateway) + T006/T007 (store/hook).
- **US2**: T012 (Lobby.tsx) can run in parallel with T010 + T011 (backend).
- **US3**: T014 (Game.tsx) can run in parallel with T013 (gateway).
- **US4**: T015 (rooms.service.ts) + T017 (Results.tsx) + T018 (useGameState.ts) can all run in parallel with T016 (gateway).

---

## Parallel Example: Phase 2 (Foundation)

```bash
# All four can be started simultaneously:
Task T001: Add RESET_GAME to packages/shared/src/events/game-events.enum.ts
Task T002: Add UPDATE_ROOM to packages/shared/src/events/room-events.enum.ts
Task T003: Add isDraw? to packages/shared/src/types/results.type.ts
Task T004: Add UpdateRoomPayload to packages/shared/src/types/room-config.type.ts
```

## Parallel Example: US1 Backend + Frontend

```bash
# After T005 starts, these can run in parallel:
Task T006: Add setMyTeam to apps/frontend/src/store/room.store.ts
Task T008: Update ResultsService.calculate() in apps/backend/src/modules/game/services/results.service.ts
# After T006 completes:
Task T007: Update useGameState.ts GAME_STARTED handler
# After T008 completes:
Task T009: Update Results.tsx draw banner
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2 (T001–T004) — shared contract changes
2. Complete US1 (T005–T009) — team badges in lobby + draw result
3. **STOP and VALIDATE**: Lobby shows team colors; Results draws correctly
4. Deliver US1 as demonstrable milestone

### Incremental Delivery

1. Phase 2 (foundation) → verified type-check passes
2. US1 (T005–T009) → team gameplay complete → demo
3. US2 (T010–T012) → host can edit config live → demo
4. US3 (T013–T014) → disconnect handled gracefully → demo
5. US4 (T015–T018) → sequential games work → demo
6. Polish (T019–T021) → PR ready

### Single Developer Strategy

Follow the sequential gateway order strictly to avoid merge conflicts:

1. Phase 2 (T001–T004, any order)
2. T005 → T006 → T007 → T008 → T009 (US1 complete)
3. T010 → T011 → T012 (US2 complete)
4. T013 → T014 (US3 complete)
5. T015 → T016 → T017 → T018 (US4 complete)
6. T019 → T020 → T021 (polish)

---

## Notes

- **[P]** = different file from other concurrent tasks in the same phase; safe to parallelize
- **[USn]** = maps task to user story for traceability; no label = setup/polish
- All `game.gateway.ts` changes must be sequential (T005 → T011 → T013 → T016)
- `UpdateRoomPayload` added to `room-config.type.ts` is used only as the socket payload shape; `UpdateRoomDto` in the gateway's DTO folder is the class-validator class
- The reconnect overlay (T014) replaces the existing HUD text — do not leave both in place
- The `ROOM_STATE` listener in T018 must be gated on `status === FINISHED` to avoid interfering with the initial lobby join flow that also emits `ROOM_STATE`
