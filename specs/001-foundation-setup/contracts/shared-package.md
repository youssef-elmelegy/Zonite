# Contract: `@zonite/shared` package export surface

**Feature**: Foundation & Project Setup (Phase 0)
**Owner**: `packages/shared/`
**Stability**: The **names and categories** of exports are stable from Phase 0
forward. Field-level additions are non-breaking and expected in later phases; field
**removals** or **renames** are breaking and require a coordinated PR updating both
consumers (per Constitution Principle I).

## Purpose

Define the public import surface of the shared contract package so every later phase
knows exactly what to import, and reviewers know exactly what to block when a new
cross-wire type appears outside this package.

## Package identity

| Field          | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| `name`         | `@zonite/shared`                                             |
| `version`      | `0.0.0` (private; never published)                           |
| `private`      | `true`                                                       |
| `main`         | `./src/index.ts`                                             |
| `types`        | `./src/index.ts`                                             |
| `exports["."]` | `{ "types": "./src/index.ts", "default": "./src/index.ts" }` |

Consumers import **only** via the root specifier:

```ts
import { GameStatus, GameEvents, RoomConfig } from '@zonite/shared';
```

Deep imports (`@zonite/shared/enums/game-status.enum`) MUST NOT be used by
consumers. The barrel is the public surface; any internal reorganization is
invisible.

## Exported symbols (Phase 0 baseline)

Grouped by category. Every symbol below is re-exported from `src/index.ts`.

### Enums

- `GameStatus` — `'LOBBY' | 'PLAYING' | 'FINISHED'`
- `GameMode` — `'SOLO' | 'TEAM'`
- `TeamColor` — `'RED' | 'BLUE' | 'NONE'`

### Event-name constants and types

- `GameEvents` — `const` object, values listed in [data-model.md §1.2](../data-model.md#12-event-name-constants)
- `GameEventName` — `typeof GameEvents[keyof typeof GameEvents]`
- `RoomEvents` — `const` object, values listed in [data-model.md §1.2](../data-model.md#12-event-name-constants)
- `RoomEventName` — `typeof RoomEvents[keyof typeof RoomEvents]`

### Domain types (skeletons extended in later phases)

- `RoomConfig`
- `Player`
- `Block`
- `Team`
- `GameState`

Full field lists in [data-model.md §1.3](../data-model.md#13-type-skeletons).

## Compatibility rules

1. **Additive changes are safe**: adding a new optional field, a new enum member, a
   new event constant, or a new exported type is a MINOR bump. No consumer action
   required beyond re-running `pnpm install && pnpm type-check`.
2. **Renames and removals are breaking**: require a single PR that updates
   `packages/shared`, `apps/backend`, and `apps/frontend` in one commit so the
   monorepo-wide type-check passes at every point in history.
3. **Event-name string values are frozen once shipped**: a name is a wire-level
   identifier. Adding is fine; renaming means the gateway emits something a
   deployed client does not listen for. Consider the string value as if it were
   already in production.
4. **Enum string values are also frozen**: same reasoning — persisted or transmitted
   values cannot silently change shape.
5. **No runtime code in `packages/shared`**: types, enums, and `const` objects only.
   No classes with behaviour, no framework imports, no Node-only APIs. If a later
   phase needs a runtime helper that lives on the wire (e.g., a Zod schema shared by
   backend validation and frontend form validation), it is introduced via a new
   sub-module under `packages/shared/src/schemas/` — discussed in Phase 3.

## Consumption contract

### Backend

```ts
// apps/backend/src/modules/game/game.gateway.ts (Phase 5)
import { GameEvents, type Block } from '@zonite/shared';

@SubscribeMessage(GameEvents.CLAIM_BLOCK)
handleClaim(@MessageBody() body: { x: number; y: number }): void { ... }
```

### Frontend

```ts
// apps/frontend/src/hooks/useGameState.ts (Phase 6)
import { GameEvents, type GameState } from '@zonite/shared';

socket.on(GameEvents.GAME_TICK, ({ remaining }) => { ... });
```

Both consumers import via the same specifier and receive the same type declarations.
Removing the field from one usage site fails the monorepo-wide type-check (spec User
Story 2 Acceptance Scenario 3).

## Enforcement

- Review-level: any PR adding a cross-wire type **outside** `packages/shared` is
  blocked by the reviewer citing Constitution Principle I.
- Tool-level (Phase 0): the `pnpm type-check` command runs `tsc --noEmit` across all
  three packages. Any duplicate declaration of a shared type in an app surfaces as
  a type conflict on import.
- Lint-level (optional, deferred): a custom ESLint rule banning string literals that
  match `/^(claim_block|game_tick|…)$/` outside `@zonite/shared` would mechanize
  enforcement for event names. Out of scope for Phase 0; tracked as a Phase 5
  follow-up in the "Zonite Dev Hub" Spek list.

## Traceability

- Spec FR-005..FR-008, FR-018 → this contract.
- Spec User Story 2 (all four Acceptance Scenarios) → this contract.
- Research.md §1–§2 → consumption mechanism (TS path aliases, no build step).
- Constitution Principle I → authoritative ruleset.
