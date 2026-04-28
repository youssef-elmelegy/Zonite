# HTTP API Contracts — Phase 8 (New & Modified)

**Feature**: 007-team-mode-polish
**Date**: 2026-04-25
**Base path**: `/api`
**Auth**: Bearer JWT (access token) on all routes below

---

## Modified Endpoints

### `PATCH /api/rooms/:code`

**No contract change** — endpoint already exists and validates `status === LOBBY` and host ownership. Phase 8 does not change the HTTP contract; room config updates during an active lobby are handled via the `update_room` socket event instead (see `socket-events.md`).

The REST endpoint remains valid for programmatic room management (e.g., updating config before any players have joined), but the Lobby UI uses the socket path.

---

## New Endpoints

### `POST /api/rooms/:code/reset` — **NOT ADDED**

The "Play Again" reset flow is implemented entirely via the `reset_game` socket event (`GameEvents.RESET_GAME`). No REST endpoint is introduced for this operation (see research R-004 for rationale). The REST layer does not expose a reset route.

---

## Unchanged Endpoints (reference)

| Method | Path                         | Description                                       |
| ------ | ---------------------------- | ------------------------------------------------- |
| POST   | `/api/rooms`                 | Create room                                       |
| GET    | `/api/rooms/:code`           | Get room by code                                  |
| PATCH  | `/api/rooms/:code`           | Update room config (host only, LOBBY status only) |
| DELETE | `/api/rooms/:code`           | Close room                                        |
| GET    | `/api/rooms`                 | List public LOBBY rooms (paginated)               |
| POST   | `/api/auth/register`         | Register                                          |
| POST   | `/api/auth/login`            | Login                                             |
| POST   | `/api/auth/refresh`          | Refresh access token                              |
| POST   | `/api/auth/logout`           | Logout (invalidate nonce)                         |
| POST   | `/api/auth/forgot-password`  | Request OTP                                       |
| POST   | `/api/auth/reset-password`   | Submit OTP + new password                         |
| GET    | `/api/profile`               | Get own profile                                   |
| GET    | `/api/profile/match-history` | Get paginated match history                       |
| GET    | `/api/health`                | Health check                                      |

All responses follow the Sikka `successResponse()` / `errorResponse()` envelope. Pagination on list endpoints uses Sikka pagination helpers.
