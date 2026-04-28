# WebSocket Event Contracts — Phase 7

**No new socket events in Phase 7.**

All socket events were defined and implemented in Phase 6 (Frontend Foundation) and Phase 4 (Backend Foundation / Gateway). Refer to:

- `specs/005-frontend-foundation/contracts/socket-events.md` — complete event table, payload types, and connection lifecycle.

---

## Phase 7 socket changes (non-breaking)

The following server-side behaviours change in Phase 7 but the event names and payload shapes are unchanged:

### `GAME_OVER` payload — no change

The `Results` payload emitted on `game_over` is computed by `ResultsService.calculate()` (already implemented). Phase 7 adds a **side effect only**: `ProfileService.recordMatchResults()` is called inside `onGameOver` before the `game_over` event is emitted. This is invisible to the client.

### `JOIN_ROOM` — host auto-ready

When the joining player is the room host, the gateway now sets `isReady = true` on their `InternalLobbyPlayer` entry before broadcasting the `ROOM_STATE` snapshot. This ensures the `readyCount` computed in the Lobby frontend is correct when the host joins.

**`ROOM_STATE` payload**: unchanged shape (`RoomState` from `@zonite/shared`). The host entry will now have `isReady: true` where previously it was `false`.

---

## Shared type update: `CurrentUser`

`packages/shared/src/auth/user.ts` gains a `fullName` field:

```typescript
export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  fullName: string; // ← new in Phase 7
}
```

This is technically a backward-incompatible addition to a shared type and requires:

1. Update the shared package, bump version to `0.2.0`.
2. Update the gateway to read `user.fullName` (from the JWT payload) instead of computing `email.split('@')[0]`.
3. Update frontend `useAuth` hook's `user.fullName` usage in `PlayerChip`, `Lobby`, `Game` HUD components.
