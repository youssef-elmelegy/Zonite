# Feature Specification: Backend Foundation (Phase 2 — NestJS, Sikka Parity)

**Feature Branch**: `004-backend-foundation`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "the next phase 2 in the PLAN.md file — and make sure everything is clear"

---

## Overview _(context)_

Phase 0 already scaffolded the monorepo, Docker Compose, the `packages/shared` skeleton, a minimal `GET /api/health`, husky pre-commit, and a lint/type-check CI. Phase 1 adopted the design handoff on the frontend side only.

Phase 2 is the first **production-shaped** backend slice. Its north star is **Sikka Parity**: Zonite's backend must be visually and structurally indistinguishable from the Sikka Platform Backend to any developer who has worked in both. That means: same project layout, same env-validation story, same response envelope, same auth plumbing, same documentation portal, same error handling — no parallel systems.

This phase ships the plumbing that every later phase (rooms, game engine, websocket gateway, frontend integration) will ride on. It does **not** ship any game feature or user-visible capability of its own beyond "the backend runs, is documented, and is safely extensible" **plus the full Sikka auth suite reachable end-to-end** (register / login / refresh / forgot / reset), because Phase 7's frontend auth screens depend on those endpoints existing.

---

## Clarifications

### Session 2026-04-22

- Q: Which slice of Sikka's auth module goes live in Phase 2? → A: **Option B** — the full Sikka auth suite is live in Phase 2 (register / login / refresh / forgot / reset all reachable); the `users` table is migrated; the transactional email service is wired in Phase 2 (this lifts the earlier "email deferred" assumption).
- Q: On startup, when the database is unreachable, how should the backend behave? → A: **Option A** — fail fast with non-zero exit; orchestrator restart policy handles retries; `/api/health` stays binary (up / not-running), no "degraded" state.
- Q: Should Phase 2 wire rate limiting now that the auth endpoints are live? → A: **Option C** — global throttler enabled for **all modules / all routes** with modest env-driven defaults, plus a tighter override on the auth-sensitive endpoints (register, login, forgot-password, reset-password). This lifts rate limiting out of the "deferred" assumption.
- Q: What's the default exposure of `/api/docs` in production? → A: **Option A** — open in every environment, no gate. The docs portal reaches the public internet in production with the full API schema (including auth endpoint shapes) visible. The spec's mitigation is entirely upstream: endpoints must remain robust against hostile clients on their own (rate limits, input validation, no enumeration leaks), because the schema cannot be treated as secret.
- Q: What's the URL-layer versioning strategy? → A: **Option A** — unversioned `/api` prefix (matches Sikka's shipped layout). URLs: `/api/health`, `/api/auth/login`, `/api/rooms`, etc. No `/v1` segment in Phase 2. Future breaking changes can adopt NestJS URI versioning per-controller at that time without retrofitting existing routes.

---

## User Scenarios & Testing _(mandatory)_

All "users" of this phase are internal actors: backend engineers, frontend engineers consuming the API, and platform/ops engineers. Each story is independently demoable and delivers standalone value.

### User Story 1 — Bootstrap a production-shaped backend (Priority: P1)

A backend engineer clones the repo, runs the workspace install, runs the dev stack, and sees a Sikka-shaped NestJS application that boots, connects to the Postgres service from Phase 0's Docker Compose, exposes the base API under `/api`, answers a liveness check, and mounts an API documentation portal. Environment variables are validated at startup — missing or malformed values crash the process with an actionable error instead of a silent runtime failure.

**Why this priority**: Every later phase (rooms, game engine, gateway) is blocked on this. Without a running, Sikka-conformant skeleton, no feature work can begin. It is also the smallest slice that proves the architectural direction is correct.

**Independent Test**: A developer runs the documented dev command on a fresh machine, hits `GET /api/health` and gets the standard envelope, opens the docs portal and sees the health endpoint listed, deliberately deletes a required env variable, and confirms the backend refuses to start with a clear, human-readable error naming the missing variable.

**Acceptance Scenarios**:

1. **Given** a fresh checkout with a correct `.env`, **When** the dev runs the documented dev command, **Then** the backend boots within 10 seconds, logs its bound port, logs its resolved environment (dev/prod), logs the chosen log level, and logs the URL of the API documentation portal.
2. **Given** the backend is running, **When** a client sends `GET /api/health`, **Then** the response uses the project-wide success envelope (structured `data`/`meta`/`errors` shape) and reports at minimum `{ status: 'ok' }` plus an uptime/timestamp field.
3. **Given** a required environment variable is missing (for example, the database password), **When** the backend starts, **Then** it exits before accepting any traffic, prints the name of the missing variable and the validation rule it failed, and the exit code is non-zero.
4. **Given** a client sends an unsupported header or malformed JSON, **When** the request reaches the global validation layer, **Then** it is rejected with a `400`-class response that uses the same error envelope as the rest of the API — no NestJS default shape leaks through.

---

### User Story 2 — Add a new endpoint without inventing patterns (Priority: P1)

A backend engineer needs to add a new feature module (for example, a future `rooms` module). They copy an existing module as a template, register it with the root module, and their new endpoint automatically inherits: the response envelope, request validation, authentication guards (opt-in per route), API docs registration, and the global exception filter. No custom response formatter, no custom error handler, no separate Swagger bootstrap, no re-implementation of pagination for list endpoints.

**Why this priority**: This is how Sikka Parity compounds. If it is cheap and obvious to add an endpoint the Sikka way, drift never starts. If it is expensive or ambiguous, drift is guaranteed.

**Independent Test**: A developer adds a throwaway `GET /api/_scratch` endpoint by copying the health module, with no edits to any shared/common code. The endpoint appears in the docs portal without extra configuration, returns the standard envelope, validates its query parameters, and — when decorated to require auth — rejects unauthenticated requests through the shared guard.

**Acceptance Scenarios**:

1. **Given** the health module as a reference template, **When** a developer copies it to a new feature folder and registers it in the root module, **Then** the new endpoint appears in the API docs portal automatically (no additional registration step).
2. **Given** a new list-style endpoint that needs paging, **When** the developer wires it up with the standard pagination query shape, **Then** the response envelope's `meta` carries the shared pagination fields (page, pageSize, total, totalPages) in the exact shape Sikka uses.
3. **Given** a new endpoint decorated as authenticated, **When** a client calls it without a valid bearer token, **Then** the shared auth guard rejects the call and the response uses the same error envelope — no separate auth error shape.
4. **Given** a new endpoint's controller or DTO throws a validation error, **When** the error reaches the framework, **Then** the global exception filter formats it into the shared error envelope with no stack trace leaked in any environment.

---

### User Story 3 — Frontend consumes a predictable, documented API (Priority: P1)

A frontend engineer (working in Phase 6/7) opens the API documentation portal, reads the endpoint contracts, understands the response envelope without needing to ask, and writes the HTTP client against it with confidence. Every successful response looks the same; every error looks the same; every paginated endpoint pages the same way. The docs are generated from the source so they never drift.

**Why this priority**: The frontend phases are blocked on a stable, documented contract. The shared package carries types, but the HTTP semantics (envelope, paging, auth header, error codes) must be equally predictable at runtime.

**Independent Test**: A frontend engineer opens the docs portal, picks any endpoint, reads its schema, issues the call from the browser or a tool, and the actual response matches the documented schema — including the envelope shape.

**Acceptance Scenarios**:

1. **Given** the backend is running, **When** a user opens the API docs URL, **Then** the portal renders with a Zonite title, groups endpoints by tag, and exposes a bearer-token auth affordance for trying authenticated calls.
2. **Given** any two successful endpoints, **When** their responses are compared, **Then** they share the identical top-level envelope keys in the identical order.
3. **Given** any two error responses (400, 401, 404, 500), **When** compared, **Then** they share the identical error envelope — only the inner `errors`/`message` content differs.
4. **Given** an endpoint's DTO changes in source, **When** the backend restarts, **Then** the docs portal reflects the change on next reload with no manual doc edit.

---

### User Story 4 — Full Sikka auth suite live end-to-end (Priority: P1)

The backend carries the full Sikka authentication plumbing **and** exposes the full Sikka auth endpoint surface at Zonite URLs. A new user can register with email and password, log in, receive an access token plus a refresh-token cookie, refresh a stale access token, initiate a forgot-password flow (which sends a real reset email via the wired transactional email service), and complete a password reset with the OTP or token from that email. The `users` table is migrated at phase exit. Phases 3 and later can additionally gate any controller or websocket handler with a single decorator import — no later-phase engineer writes auth code.

**Why this priority**: Phase 7.6 (Auth Screens) states: "every call MUST go through the existing Sikka auth endpoints — no parallel auth system." Those endpoints must exist by Phase 7. Landing them in Phase 2 — where the plumbing already lives — is the only way to unblock Phase 6 frontend setup and Phase 7 auth UX without a last-mile backend sprint. Upgraded from P2 to P1 per the Session 2026-04-22 clarification.

**Independent Test**: End-to-end CLI/HTTP walkthrough: (1) POST to register creates a new user; (2) POST to login returns an access token + sets the refresh cookie; (3) GET on a protected sample route with the access token succeeds and exposes the user via `@CurrentUser()`; (4) POST to refresh returns a new access token; (5) POST to forgot-password triggers a real email (visible in the configured email transport's inbox/log); (6) POST to reset-password with the emailed token completes and logs the user in.

**Acceptance Scenarios**:

1. **Given** the backend is running with a reachable email transport, **When** a new email registers via the register endpoint, **Then** a row lands in `users` with a hashed password, and the response carries the standard envelope.
2. **Given** a registered user, **When** they log in with valid credentials, **Then** the response carries an access token in the body envelope and a refresh-token cookie with Sikka's cookie settings (HttpOnly, Secure in prod, SameSite as configured).
3. **Given** a valid access token, **When** the client calls a protected sample endpoint, **Then** the handler receives the authenticated user through `@CurrentUser()` and returns the standard success envelope.
4. **Given** a route annotated as public, **When** an unauthenticated client calls it, **Then** it returns success (the global guard does not shadow the public decorator).
5. **Given** a stale access token and a valid refresh-token cookie, **When** the client calls the refresh endpoint, **Then** a new access token is returned and the refresh cookie is rotated per Sikka's policy.
6. **Given** a registered user who has forgotten their password, **When** they POST to the forgot-password endpoint with their email, **Then** the response is 2xx in the standard envelope **and** a real reset email is dispatched via the configured email transport (observable in the dev transport's outbox or the production provider's logs).
7. **Given** the reset token/OTP delivered by that email, **When** the user POSTs a new password to the reset endpoint with the token, **Then** the password is updated, prior refresh tokens for that user are revoked, and the next login with the new password succeeds.
8. **Given** the auth module's token lifetimes are set via env, **When** tokens are issued, **Then** they honor the configured access and refresh lifetimes (not hard-coded values).

---

### User Story 5 — Architecture is documented for the team (Priority: P2)

The Spekit "Zonite Dev Hub" workspace is updated with the architectural decisions made in Phase 2, so an engineer joining next week doesn't have to rediscover them by reading diffs. At minimum: how the Sikka patterns are sourced into Zonite, how to add a new module safely, where env variables are declared, where response/pagination/error envelopes live, and how to register a new endpoint with the docs portal.

**Why this priority**: Constitution Principle V. Undocumented architecture is drift waiting to happen. This is P2 only because it follows the code landing, but it must be done in this phase.

**Independent Test**: A new engineer is pointed at the "Zonite Dev Hub" Topic, reads the Phase 2 Speks, and successfully adds a "hello world" module without asking a human for help.

**Acceptance Scenarios**:

1. **Given** the Zonite Dev Hub Topic, **When** the reader filters by Phase 2 tag, **Then** at minimum these Speks exist: "Sikka backend architecture rules", "How to extend a module safely", "Environment variables reference", "Response envelope and error shape", "API documentation portal — how to add a new endpoint".
2. **Given** each Spek, **When** read in isolation, **Then** it contains a concrete recipe (not just prose) — file path, code skeleton, or checklist.

---

### Edge Cases

- **Missing or invalid env at startup** — process exits non-zero with a named cause; no partial boot.
- **Database unreachable at startup** — process fails fast: logs a clear database-connectivity error (host, port, database name — never the password) and exits non-zero within the same startup budget as the env-variable case. The HTTP server does NOT bind. Orchestrator (Docker Compose / Kubernetes) restart policy is responsible for retries. `/api/health` stays binary — there is no "degraded" state.
- **Conflicting global settings** — global prefix `/api`, CORS origins, cookie handling, request logging must be declared exactly once in the bootstrap file; a lint or code-review gate prevents duplicate registrations.
- **Unknown request fields** — the global validation layer strips or rejects (project-default strip-and-reject) and returns the standard error envelope.
- **Docs portal in production** — mounted at the same path (`/api/docs`) and openly reachable in every environment including production (per Session 2026-04-22 clarification, Option A). The full API schema — including auth endpoint payload shapes — is public. Security relies on upstream defenses (rate limiting, input validation, account-enumeration mitigations), NOT on schema secrecy.
- **Log level surprises** — log-level setting honors the configured environment; "silent" in production must not drop error-class logs.
- **Trusted-proxy handling** — when deployed behind a reverse proxy, the real client IP is surfaced (not the proxy IP), matching Sikka behavior.
- **Clock-skew / token expiry** — expired tokens return 401 in the standard envelope; never a 500.
- **Cold start vs. warm start** — no endpoint should depend on a lazy-initialized singleton whose first call can slow a cold request beyond the liveness budget.
- **Rate-limit rejection** — when the throttler trips, the response uses the shared error envelope with a machine-readable code (e.g., `rate_limited`) and a `Retry-After` header. Clients receive no stack trace and no framework-default shape.
- **Repeated forgot-password against an unknown email** — the endpoint MUST respond identically (envelope + status) whether or not the email exists, to avoid account-enumeration. The rate limit on this route MUST also be sized to defend against enumeration at volume.

---

## Requirements _(mandatory)_

### Functional Requirements

**Bootstrap & Runtime**

- **FR-001**: The backend MUST boot from a single documented dev command, expose all endpoints under the `/api` global prefix (no version segment — see FR-001a), and log (at startup) the bound port, resolved environment, log level, and docs URL.
- **FR-001a**: The URL layout MUST be unversioned in Phase 2: all routes sit directly under `/api` (e.g., `/api/health`, `/api/auth/login`, `/api/auth/refresh`). No `/v1` segment is introduced. When a future breaking change lands, versioning MAY be opted into per-controller using NestJS URI versioning; Phase 2 MUST NOT pre-enable that machinery.
- **FR-002**: The backend MUST validate every environment variable against a declared schema at startup and exit non-zero with a human-readable message naming the failing variable when validation fails.
- **FR-003**: The backend MUST read CORS origins, log level, database connection details, and auth-token secrets/lifetimes from environment variables — never from hard-coded values.
- **FR-004**: The backend MUST trust reverse-proxy headers so downstream logic sees the real client IP when deployed behind a proxy.
- **FR-005**: The backend MUST parse cookies on incoming requests to support refresh-token cookies from the vendored Sikka auth plumbing.

**Response Envelope & Error Handling**

- **FR-006**: Every successful HTTP response from every controller MUST be wrapped in the same envelope shape (a structured `data`/`meta`/`errors` container matching Sikka's `responses.dto` contract). No controller may return a raw object to the wire.
- **FR-007**: Every error response (thrown exception, validation failure, auth failure, not-found, 500) MUST be normalized into the same error envelope by a single global exception filter. Raw stack traces MUST NEVER reach a client in any environment.
- **FR-008**: The pagination contract (request query shape and response `meta` shape) MUST match Sikka's pagination helpers exactly, so future list endpoints (rooms, match history, leaderboards) do not reinvent paging.

**Validation**

- **FR-009**: A global request-validation layer MUST be installed with: unknown fields stripped/rejected, DTO transformation enabled, and validation failures formatted through the shared error envelope.
- **FR-010**: Every DTO MUST be declaratively validated (decorator-driven) — no ad-hoc runtime validation inside controllers or services.

**Authentication Plumbing**

- **FR-011**: The backend MUST carry Sikka's authentication infrastructure: access-token strategy, refresh-token strategy (header and cookie variants as Sikka provides), a JWT guard, a refresh-token guard, a `@CurrentUser()` decorator, a `@Public()` decorator, and a role guard with a `@Roles()` decorator.
- **FR-012**: A route decorated as public MUST be reachable without a bearer token even when a global JWT guard is applied; the public decorator takes precedence.
- **FR-013**: Auth-token lifetimes, secrets, and cookie settings MUST all be env-driven (no magic numbers).

**Authentication Endpoints (live in Phase 2 per Session 2026-04-22 clarification)**

- **FR-011a**: The backend MUST expose the full Sikka auth endpoint surface at Zonite URLs (controller paths matching Sikka's): **register**, **login**, **refresh**, **forgot-password**, **reset-password**, and **logout**. Each endpoint MUST return the shared response envelope and use Sikka's DTO shapes.
- **FR-011b**: The `users` table MUST be migrated at phase exit with at minimum the columns the Sikka auth module queries (id, email, password hash, role, created-at, updated-at); richer profile columns are Phase 7's concern and do not block Phase 2 exit.
- **FR-011c**: A transactional email service MUST be wired and reachable from the auth module so forgot-password dispatches a real reset email. In development the transport MAY be a log-to-console or capture-to-outbox adapter; in production it MUST be a real provider selected via env configuration. The selection mechanism and provider credentials MUST be env-driven (no hard-coded provider config).
- **FR-011d**: Password storage MUST use a one-way hash with a per-user salt (matching Sikka's chosen hashing primitive). Plain-text passwords MUST NEVER be persisted or logged.
- **FR-011e**: A successful password reset MUST revoke all prior refresh tokens for that user so stolen sessions cannot outlive the reset.

**Rate Limiting (global, with auth override)**

- **FR-011f**: A global rate limiter MUST be applied to **every** route (including the health endpoint, with a permissive limit there). The limiter's per-route, per-IP, and per-user windows MUST be env-driven — no hard-coded numbers in source.
- **FR-011g**: The auth-sensitive endpoints — register, login, forgot-password, reset-password — MUST carry a tighter override than the global default, sized to block credential-stuffing, password-spraying, and reset-email-abuse at single-IP volumes while not tripping on legitimate retry behavior.
- **FR-011h**: Rate-limit rejection responses MUST use the shared error envelope (never a raw framework default) and MUST include a `Retry-After` header reflecting the configured window.
- **FR-011i**: Phase 2 MAY use an in-memory throttler store; the design MUST keep the throttler's storage pluggable so a later phase can swap to a distributed store (Redis) without touching controller code.

**Database Layer**

- **FR-014**: A database connection MUST be provisioned at bootstrap using the Sikka database-layer pattern (same ORM, same schema folder convention, same migration tool, same connection-provider shape).
- **FR-015**: Migration commands (generate, apply/push, studio) MUST be runnable from the backend package via documented scripts that match Sikka's script names.
- **FR-016**: Schema definitions MUST live under `apps/backend/src/db/schema/` mirroring Sikka's layout.
- **FR-016a**: When the database is unreachable at startup, the backend MUST fail fast — log a clear connectivity error (including host, port, database name; never the password), exit non-zero, and NOT bind the HTTP server. The backend MUST NOT implement in-process connection-retry loops; orchestrator restart policy handles retries. `/api/health` MUST NOT expose a "degraded" state.

**API Documentation Portal**

- **FR-017**: The backend MUST mount an interactive API documentation portal at `/api/docs` that lists every registered endpoint, its request schema, its response schema, and a bearer-token affordance for authenticated trials.
- **FR-018**: Documentation MUST be generated from source annotations — adding or changing an endpoint MUST NOT require hand-editing the docs.
- **FR-019**: The docs title, description, and version MUST identify Zonite (not the template project).
- **FR-019a**: The docs portal MUST be reachable in every environment (dev, staging, production) with no env flag, no auth gate, and no internal-network restriction — the API schema is explicitly considered public per the Session 2026-04-22 clarification.

**Module Ergonomics**

- **FR-020**: The repository MUST contain a reference module (reusing or extending the existing `health` module from Phase 0) that demonstrates the full conventions in one place: envelope, validation, docs tagging, and an example of an authenticated variant.
- **FR-021**: Adding a new module MUST require only: creating the module folder, registering it in the root module, and decorating the controller — no shared/common code edits.

**Shared Contract**

- **FR-022**: Any type, enum, or constant that crosses the wire (e.g., pagination shape, envelope shape, auth payload shape) MUST be declared in `packages/shared` and consumed by the backend via import — never redeclared in `apps/backend`.

**Documentation (Spekit)**

- **FR-023**: The "Zonite Dev Hub" Topic MUST receive, before Phase 2 exit, Speks covering: the Sikka integration approach, how to extend a module safely, the environment variable reference, the response/error envelope, and the API docs portal workflow.

**Scope Exclusions (explicit non-goals of Phase 2)**

- **FR-024**: Phase 2 MUST NOT include room endpoints, game-engine logic, websocket gateways, or any game-feature endpoint — those are Phases 3/4/5.
- **FR-025**: Phase 2 MUST NOT introduce a parallel response wrapper, a custom pagination implementation, an independent Swagger bootstrap (when the shared docs pipeline is available), or a parallel auth system.

---

### Key Entities _(infrastructure, not business data)_

- **Environment Configuration**: The validated, typed env object consumed across the backend. Attributes: runtime (dev/prod), port, log level, CORS origins, database connection details, auth-token secrets and lifetimes, cookie-signing settings.
- **Response Envelope**: The cross-wire success/error container. Attributes: `data` (payload), `meta` (paging, cursors, or empty), `errors` (null on success; structured on failure). Exported from `packages/shared`.
- **Pagination Contract**: The cross-wire paging request/response shape. Attributes on request: page, pageSize (or cursor). Attributes on response `meta`: page, pageSize, total, totalPages (or next cursor).
- **Auth Context**: The authenticated user handed to a handler via `@CurrentUser()`. Attributes: userId, roles, token-type (access vs. refresh), issued-at, expires-at.
- **Reference Module (Health)**: The living template for all future modules. Demonstrates: controller + service separation, envelope usage, DTO-driven validation, docs tagging, and the authenticated-variant toggle.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A clean-clone engineer boots the backend for the first time (install + dev command) in **under 5 minutes** on a reference machine, and the backend reaches a passing liveness check within **10 seconds** of process start.
- **SC-002**: **100 %** of registered endpoints (including `/api/health`) return the shared success envelope on a 2xx response and the shared error envelope on any non-2xx response, verified by a response-shape check across the full route table.
- **SC-003**: Adding a new feature module from the reference template to a working, documented, envelope-conformant endpoint takes **under 15 minutes** and requires **zero edits** to shared/common code.
- **SC-004**: Starting the backend with a missing required env variable exits within **2 seconds** with a non-zero code and an error message naming the variable — in **100 %** of cases, verified for every variable declared in the schema.
- **SC-005**: The API docs portal enumerates **every** registered endpoint automatically; adding a new endpoint makes it appear on the next restart with **no** doc-specific code change.
- **SC-006**: Stack traces appear in client responses in **0 %** of error cases across a synthetic sweep of 400/401/403/404/409/422/500-class errors.
- **SC-007**: A frontend engineer (Phase 6/7 preview) can write a typed HTTP client against the API using only the docs portal and `packages/shared` types, with no Slack questions needed to understand the envelope, paging, or auth header — validated by a 1-hour dry-run with an engineer outside the backend workstream.
- **SC-008**: Zonite's backend directory layout side-by-sided against Sikka's shows **zero structural divergences** (same top-level folders, same `common/` subfolder names, same `db/` layout, same bootstrap file shape) — verified by a manual diff at phase exit.
- **SC-009**: The five mandatory Phase 2 Speks exist in the Zonite Dev Hub and each contains a concrete recipe (file path, skeleton, or checklist), verified by a Spek-by-Spek review.
- **SC-010**: A fresh user can complete the full auth loop — register → login → call a protected route → refresh → forgot-password → receive the reset email → reset-password → log in with the new password — in **under 5 minutes** from a curl/Postman session, with **100 %** of calls returning the shared envelope and the reset email observably delivered via the configured email transport.
- **SC-011**: The `users` table migration is generated, applied to the Phase-0 Postgres service, and a DB inspection confirms the Sikka-required columns exist before Phase 2 exit.
- **SC-012**: A synthetic burst against the login endpoint from a single IP reaches the configured auth-endpoint limit within **10 seconds** and receives rate-limited responses in the shared error envelope carrying a `Retry-After` header — verified by a one-off load sweep. The same burst against a non-auth endpoint trips the global (looser) limit and behaves identically.

---

## Assumptions

- **Sikka source is locally readable**: The Sikka Platform Backend at `/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend` is available as reference source during Phase 2. Zonite engineers can read its code to mirror conventions.
- **Sikka's actual stack supersedes PLAN.md's hedge**: PLAN.md's Appendix A says "TypeORM/Prisma depending on project"; Sikka's current stack is **Drizzle ORM + drizzle-kit on PostgreSQL**, with **Scalar** (`@scalar/nestjs-api-reference`) layered on **NestJS Swagger** for docs, **Zod**-validated env, **Passport JWT** for auth, and **cookie-parser** for refresh-token cookies. Zonite adopts what Sikka actually ships, not PLAN.md's hedged wording — this is an application of Constitution Principle II (Sikka Parity).
- **Vendoring is the integration model**: Sikka patterns land in Zonite by **copying** (vendoring) the relevant `common/`, `db/` scaffolding, `env.ts`, bootstrap, and auth module into `apps/backend/src/` — **not** via a live npm dependency, git submodule, or shared package. The Constitution's "no parallel systems" rule is satisfied by mirroring the _shape_ of Sikka's code, not by runtime coupling to a separate service. This keeps Zonite deployable on its own and decoupled from Sikka's release cadence.
- **Full Sikka auth suite is live in Phase 2** _(Session 2026-04-22 clarification — supersedes the earlier "plumbing only" assumption)_: Phase 2 lands the auth _infrastructure_ (strategies, guards, decorators, env-driven secrets, cookie handling) **and** the full Sikka auth controller surface (register / login / refresh / forgot-password / reset-password / logout). The `users` table is migrated at phase exit with the minimum columns the auth module requires; Phase 7 adds richer profile columns later. A protected sample route proves end-to-end usage; the auth endpoints themselves prove the broader surface.
- **Transactional email is in scope for Phase 2** _(Session 2026-04-22 clarification)_: Because forgot-password is live, a transactional email service is wired. Dev environments MAY use a capture-to-outbox or log-to-console transport; production uses a real provider selected via env. This lifts the prior "email deferred" assumption.
- **Rate limiting is in scope for Phase 2** _(Session 2026-04-22 clarification — supersedes the earlier "throttler deferred" assumption)_: A global rate limiter is installed for all modules / all routes using Sikka's `@nestjs/throttler` dependency, with modest env-driven defaults. Auth-sensitive endpoints (register, login, forgot-password, reset-password) get a tighter, stricter override. Backing storage is in-memory in Phase 2 (Redis is still deferred — when it lands in a later phase, the throttler can be repointed at a distributed store without contract change).
- **Remaining ancillary Sikka features stay deferred**: Uploads (Cloudinary), Redis caching, and background jobs are **not** required by Phase 2 and are still deferred. They are only added when a later phase demands them, and when added, they reuse Sikka's pattern.
- **Docs portal accessibility** _(Session 2026-04-22 clarification)_: The docs portal is openly reachable in **every** environment — development, staging, and production — at `/api/docs`. No env flag, no auth gate, no internal-network restriction. The full API schema is considered public. This is a deliberate tradeoff: Phase 2 relies on rate limiting (FR-011f–i), account-enumeration mitigations (forgot-password identical response, see Edge Cases), input validation (FR-009/FR-010), and envelope-normalized errors (FR-007) rather than schema secrecy for hostile-client resilience.
- **Users schema minimum**: Because the vendored auth module references a `users` table, Phase 2 includes the **minimum** users schema needed to satisfy the auth module's queries (id, email, password hash, role, timestamps). Richer profile fields (XP, avatar, stats) are Phase 7's concern.
- **Docker Compose from Phase 0 is the dev stack**: Phase 2 runs against the Postgres service that Phase 0's Docker Compose already provisions; no new service is added.
- **Single tsconfig inheritance**: Backend extends the root `tsconfig.base.json` pinned to TypeScript ^5.7 (strict). No backend-local TS version drift.
- **No tests in Phase 2 beyond the examples in the reference module**: Full test suites are deferred to the phases that land features; Phase 2 ships the wiring needed for future tests (Jest + `@nestjs/testing` + supertest listed in Appendix A) without blocking on coverage.

---

## Out of Scope _(explicit, for clarity)_

- Room model, room endpoints, room lifecycle (→ Phase 3)
- Game engine, in-memory game state, block-claim logic (→ Phase 4)
- Socket.io gateway, real-time events (→ Phase 5)
- Frontend application, auth screens, game screens (→ Phases 6/7)
- Team mode logic, disconnect handling, polish (→ Phase 8)
- Uploads (Cloudinary), Redis caching, and background jobs are deferred until demanded by a later phase. **Note per Session 2026-04-22 clarifications**: transactional email and global rate limiting are **both in scope** for Phase 2 — email because forgot/reset-password is live; rate limiting because all auth endpoints are live and must be hardened against brute force.
- Production deployment pipeline (→ Phase 8.6 deployment Spek)

---

## Dependencies

- **Phase 0**: Monorepo, Docker Compose Postgres service, `packages/shared` skeleton, root `tsconfig.base.json`, lint/format tooling, husky.
- **Constitution v1.0.0**: Especially Principle I (Shared Contract), Principle II (Sikka Parity), and Principle V (Spekit Docs).
- **Sikka Platform Backend source**: Read-only reference at the documented local path.
- **Spekit "Zonite Dev Hub" Topic**: Must exist (created in Phase 0.4) so Phase 2 Speks have a home.
