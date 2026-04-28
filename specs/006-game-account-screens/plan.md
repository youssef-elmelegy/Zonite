# Implementation Plan: Game Screens & Account Screens (Phase 7)

**Branch**: `006-game-account-screens` | **Date**: 2026-04-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/006-game-account-screens/spec.md`

---

## Summary

Phase 7 delivers every visible screen with full functional wiring and design-handoff fidelity. The phase splits into two tracks running in parallel:

**Backend track**: Implement the missing HTTP layer — auth endpoints (register/login/refresh/logout/forgot-password/reset-password) and profile endpoints (GET profile, GET match history). Add two DB migrations: extend `users` with `fullName` + `xp`, and create `match_player_records`. Wire match-history persistence into the existing game-over callback.

**Frontend track**: Replace the Phase 6 functional scaffolding with design-handoff visual fidelity on every auth screen (two-column glass-card `AuthLayout`), add the `MiniGridArt` hero animation, wire real profile stats to Home and Profile, and complete the Lobby config summary row and team-mode block colour distinction in the Game screen.

After Phase 7, a new user can open the app, create an account, play a complete game, and see a results screen with real scores — using the live backend.

---

## Technical Context

**Language/Version**: TypeScript ^5.7 (strict), Node.js 22 LTS
**Primary Dependencies**:

- Backend: NestJS 11, Drizzle ORM, bcrypt, passport-jwt, nodemailer, Zod env
- Frontend: Vite + React 18, Zustand, TanStack Query v5, Axios, socket.io-client, react-router-dom v7

**Storage**: PostgreSQL. Drizzle migrations under `apps/backend/src/db/migrations/`. Two new migrations:

- `0002_add_display_name_xp.sql` — extends `users` table
- `0003_match_player_records.sql` — creates `match_player_records` table

**Testing**: Manual smoke test with two browser sessions (see `quickstart.md`). Type-check via `pnpm type-check`.

**Target Platform**: Browser (desktop + mobile); backend is a Linux Docker container.

**Performance Goals**:

- Block claims appear on all clients within 500 ms (SC-002) — unchanged from gateway implementation.
- Profile page load (stats + first 10 matches) < 500 ms (aggregate query at query time).

**Constraints**:

- No email SMTP in Phase 7 dev; OTP is logged to backend console (`DEV_MAIL_LOG=true`).
- `game.store` is populated ONLY from socket events (constitution Principle IV); profile stats use TanStack Query REST calls only.
- No Redis, no external message broker.

**Scale/Scope**: Up to 10 players per room. Profile history paginated at 10 per page. Streak computed over last 100 matches.

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

### Principle I — Shared Contract Source of Truth ✅

All socket event names remain in `GameEvents`/`RoomEvents` enums in `@zonite/shared`. No new socket events. One shared type change: `CurrentUser` gains `fullName: string` — this is a shared type update that accompanies both the backend (JWT payload, gateway) and frontend (auth store, hooks). Updated in `packages/shared`, minor version bump to `0.2.0`.

### Principle II — Sikka Backend Parity ✅

- Auth endpoints follow Sikka module structure: `controllers/`, `services/`, `dto/` with barrel.
- All HTTP responses use `successResponse()` / `errorResponse()` from Sikka's pattern.
- `RefreshTokenGuard` and `JwtAuthGuard` are Sikka-inherited; no new auth infrastructure.
- Profile endpoints use Sikka pagination helpers.
- All env access via `import { env } from "@/env"`.

**Deviation noted**: Zonite uses a `refreshTokenNonce` column on `users` instead of a full `auth_sessions` table. This was an explicit earlier choice in the Zonite backend schema; it is not a new Phase 7 deviation. The nonce approach is simpler and adequate for Phase 7. Recorded in Complexity Tracking below.

### Principle III — Yalgamers Design Fidelity ✅

- Auth screens adopt `AuthLayout` (two-column glass-card + fire-gradient hero), matching the design handoff layout.
- All layout primitives (`Shell`, `CornerBlobs`, `GridBg`) and UI tokens (`tokens.css`) remain the source. No hard-coded hex or font values.
- `MiniGridArt` uses existing `claimPulse` / `gridDrift` keyframes from `animations.css`.

### Principle IV — Authoritative Real-Time Server ✅

- `game.store` is populated exclusively from socket events (`game_started`, `block_claimed`, `game_tick`, `game_over`).
- Profile stats use TanStack Query REST calls — no overlap with game state.
- Match history is written by the backend in `onGameOver`; the client never self-reports scores.

### Principle V — Spekit-Documented Decisions ✅ (at PR time)

Phase 7 PR must link Speks covering: auth endpoint design, OTP delivery approach, nonce-based refresh, match history schema, `CurrentUser.fullName` addition. These do not block the plan but are a required gate before merge.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-game-account-screens/
├── plan.md              ← this file
├── spec.md
├── research.md          ← Phase 0 output (completed)
├── data-model.md        ← Phase 1 output (this run)
├── quickstart.md        ← Phase 1 output (this run)
├── contracts/
│   ├── rest-api.md      ← Phase 1 output (this run)
│   └── socket-events.md ← Phase 1 output (this run)
└── tasks.md             ← Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
apps/backend/src/
├── db/
│   ├── migrations/
│   │   ├── 0001_initial.sql          (existing — rooms + users base schema)
│   │   ├── 0002_add_display_name_xp.sql  ← NEW Phase 7
│   │   └── 0003_match_player_records.sql        ← NEW Phase 7
│   └── schema/
│       ├── users.ts          (extended — fullName, xp)
│       ├── rooms.ts          (unchanged)
│       └── match-history.ts  ← NEW Phase 7
├── modules/
│   ├── auth/               ← EXTENDED Phase 7
│   │   ├── controllers/
│   │   │   └── auth.controller.ts   ← NEW
│   │   ├── services/
│   │   │   └── auth.service.ts      ← NEW
│   │   ├── dto/
│   │   │   ├── register.dto.ts      ← NEW
│   │   │   ├── login.dto.ts         ← NEW
│   │   │   ├── forgot-password.dto.ts  ← NEW
│   │   │   ├── reset-password.dto.ts   ← NEW
│   │   │   └── index.ts             ← NEW (barrel)
│   │   └── auth.module.ts           (extended)
│   ├── profile/            ← NEW Phase 7
│   │   ├── controllers/
│   │   │   └── profile.controller.ts
│   │   ├── services/
│   │   │   └── profile.service.ts
│   │   ├── dto/
│   │   │   ├── profile-response.dto.ts
│   │   │   ├── match-history-response.dto.ts
│   │   │   └── index.ts
│   │   └── profile.module.ts
│   └── gateway/
│       └── game.gateway.ts  (extended — call profileService.recordMatchResults in onGameOver)
└── common/
    └── strategies/
        └── refresh-token.strategy.ts  ← NEW Phase 7

packages/shared/src/
└── auth/
    └── user.ts   ← extended (fullName field)

apps/frontend/src/
├── components/
│   ├── layout/
│   │   └── AuthLayout.tsx    ← NEW Phase 7
│   └── common/
│       └── MiniGridArt.tsx   ← NEW Phase 7
├── pages/
│   ├── auth/
│   │   ├── Onboarding.tsx    (design fidelity pass — add AuthLayout + MiniGridArt)
│   │   ├── Login.tsx         (design fidelity pass — adopt AuthLayout)
│   │   ├── Signup.tsx        (design fidelity pass + wire fullName field)
│   │   ├── ForgotPassword.tsx (design fidelity pass)
│   │   └── ResetPassword.tsx  (design fidelity pass)
│   ├── Home.tsx              (wire profile stats via useQuery)
│   ├── Lobby.tsx             (add config summary row + team badges)
│   ├── Game.tsx              (team mode block colour distinction)
│   └── Results.tsx           (solo mode: add ranked list below podium)
└── services/
    └── auth.service.ts       (add forgotPassword + resetPassword — already done)
```

**Structure Decision**: Monorepo (pnpm workspaces) with three packages — `apps/backend`, `apps/frontend`, `packages/shared`. New backend work lives in two modules: `AuthModule` (completion) and `ProfileModule` (new). All new frontend components follow established paths.

---

## Complexity Tracking

| Concern                                                          | Decision                                                      | Simpler Alternative Rejected Because                                                                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh token storage: nonce on `users` vs `auth_sessions` table | Nonce column on `users` (existing schema choice from Phase 4) | `auth_sessions` table would require a new migration and more complex joins; the nonce approach already in the schema is adequate for Phase 7 single-device sessions |
| OTP delivery: console log vs real SMTP                           | Console log in dev (`DEV_MAIL_LOG=true`)                      | External SMTP adds a third-party dependency and mailbox setup requirement that blocks local dev; Phase 8 can introduce a production email transport                 |
| Profile stats: compute at query time vs materialized stats table | Compute via SQL aggregates                                    | A stats table requires cache invalidation on every game end; for Phase 7 load volumes, the aggregate query is fast enough                                           |
