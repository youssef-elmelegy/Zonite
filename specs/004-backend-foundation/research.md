# Phase 0 Research — Backend Foundation

**Feature**: 004-backend-foundation
**Date**: 2026-04-22

This document records the decisions made to convert the spec's Assumptions and Clarifications into concrete technology + pattern choices. Each entry follows the format **Decision / Rationale / Alternatives considered**.

---

## 1. ORM — Drizzle (mirror Sikka)

**Decision**: Drizzle ORM (`drizzle-orm@^0.44.7`) on PostgreSQL via `pg@^8` `Pool`, with `drizzle-kit@^0.31.7` for migrations. Schema under `src/db/schema/`, migrations under `src/db/migrations/`, connection provisioned by `src/db/index.ts` as `export const db = drizzle(pool, { schema })`.

**Rationale**: Constitution Principle II mandates Sikka Parity and the Sikka Platform Backend ships exactly this stack. PLAN.md's Appendix A hedges ("TypeORM/Prisma depending on project") but that was written before the Sikka stack was pinned. Drizzle's SQL-first API also fits Zonite's game-engine path (Phase 4 writes snapshots at game end, not per tick), where a thin SQL-shaped layer beats a heavy active-record stack.

**Alternatives considered**:

- **TypeORM** — closer to Nest's marketing materials, but Sikka doesn't use it. Picking it here creates drift with the platform's auth module (which imports `@/db` Drizzle types in its service).
- **Prisma** — compelling DX but introduces a separate schema language + generator step and doesn't mesh with Sikka's `src/db/schema/*.ts`-as-source model.
- **Raw `pg` queries** — too low-level; we'd re-implement row typing that Drizzle gives for free.

---

## 2. Vendoring strategy — copy patterns (confirmed Clarification 1 direction)

**Decision**: Sikka code lands in Zonite via **vendoring** — the relevant files (`src/env.ts`, `src/main.ts` spine, `src/db/index.ts`, `src/common/**`, `src/utils/response.handler.ts`, `src/modules/auth/**`) are copied into `apps/backend/src/` and become Zonite-owned. No npm dep on Sikka; no git submodule; no shared package extracted from Sikka.

**Rationale**:

- Sikka isn't published; carving out a shared package would require Sikka-side coordination Phase 2 doesn't have budget for.
- A live dep (submodule or npm-link) couples Zonite to Sikka's release cadence, which violates "Zonite is deployable on its own" from the spec's Assumptions.
- Principle II's intent is _pattern parity_, not _runtime coupling_. Vendoring satisfies the letter and spirit.

**Operational note**: the Spek "Claude Design handoff bundle — what it is and how to update" (Phase 1 Spekit) is analogous here — we'll add a sibling Spek "Sikka backend patterns — sourcing and upgrades" in Phase 2 that names a Sikka commit SHA and the diff process when Sikka updates.

**Alternatives considered**:

- **Git submodule of Sikka at `apps/backend/vendor/sikka`** — forces every clone to resolve a second repo, introduces permission questions (Sikka is a separate product), and leaks Sikka's `dist/`, `node_modules/`, tests, into Zonite's CI.
- **Extract a `@sikka/platform-core` npm package** — correct long-term move but Sikka would need to be refactored to export it. Phase 2 cannot block on that.
- **Reference by docs only, write Zonite's own** — violates Principle II.

---

## 3. Response envelope — Sikka's `{ code, success, message, data, timestamp, error? }`

**Decision**: Use Sikka's exact envelope shape. The Zonite spec's earlier wording (`{ data, meta, errors }`) was a paraphrase of Sikka's intent, not Sikka's literal shape. The real shape (from `src/utils/response.handler.ts` in the Sikka repo):

```ts
type SuccessResponse<T> = {
  code: number;
  success: true;
  message: string;
  data: T;
  timestamp: string; // ISO
};

type ErrorResponse = {
  code: number;
  success: false;
  message: string;
  error?: string; // error category/name
  data?: object; // optional extra (e.g., field-level errors)
  timestamp: string;
};

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

**Rationale**: Principle II's response-envelope clause is literal — "every HTTP response MUST flow through `successResponse()` / `errorResponse()`". Paraphrasing introduces drift.

**Mapping for paginated payloads**: the pagination shape lives _inside_ `data`, not at top-level `meta`. Sikka's `PaginationQueryDto` is the request half; the response wraps a `{ items: T[]; page, pageSize, total, totalPages }` object inside the envelope's `data`. The Zonite shared package declares this as `PaginatedData<T>` and `type PaginatedResponse<T> = SuccessResponse<PaginatedData<T>>`.

**Alternatives considered**:

- **JSON:API style (`{ data, errors, meta }`)** — standardized but not what Sikka ships.
- **Bare payloads + HTTP status** — too loose; breaks the frontend's ability to distinguish domain errors from 500s.

---

## 4. API documentation — Scalar over NestJS Swagger

**Decision**: Mount `@scalar/nestjs-api-reference` at `/api/docs`, fed by a `SwaggerModule.createDocument()` call in `main.ts`. Title "Zonite API", tag groups, `addBearerAuth()` for protected endpoints.

**Rationale**: Exactly Sikka's setup. Scalar's UI is the team's existing convention.

**Alternatives considered**:

- **Redoc** — prettier static output but harder to drop in as middleware.
- **Raw Swagger UI** — still available under the hood (the Scalar block consumes the Swagger document). No reason to surface both.

---

## 5. Env validation — Zod schema (mirror Sikka's `src/env.ts`)

**Decision**: A single `src/env.ts` that imports `zod`, calls `dotenv.config()`, declares `envSchema = z.object({...})`, parses `process.env`, and exports the resulting typed `env` object. Schema includes: `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DATABASE_URL` (and/or discrete `DB_HOST/PORT/USERNAME/PASSWORD/DATABASE/SSL`), `JWT_*` (access/refresh/reset secrets and lifetimes), `CORS_ORIGINS` (array-parsed), `COOKIE_SECRET`, `MAIL_*` (host, port, user, pass, from), `THROTTLE_*` (global limits + auth-tier override).

**Rationale**: Principle II literally names this: "All environment access MUST go through Sikka's Zod-validated `env` object. `process.env.*` at call sites is forbidden."

**Startup behavior**: if `envSchema.parse()` throws, catch at boot, log the issue name + path, `process.exit(1)`. This gives FR-002 and SC-004 their teeth (the env-missing case exits ≤ 2 s, non-zero, with a named cause).

**Alternatives considered**:

- **`@nestjs/config` + `ConfigModule`** — PLAN.md mentions it, but Sikka doesn't use it (it uses the standalone Zod module instead). Picking it violates Parity.
- **`class-validator` on a config class** — heavier, not Sikka's choice.

---

## 6. Database unreachable at startup — fail fast (Clarification 2)

**Decision**: Boot sequence acquires the Drizzle pool and issues a single `SELECT 1` probe at the end of `bootstrap()`, before `app.listen()`. On failure: log `[startup] database unreachable: host=<...> port=<...> database=<...>` (never the password), `process.exit(1)`. No `try/retry`, no in-process backoff.

**Rationale**: Clarification 2 (Option A). Matches Sikka's implicit behavior. Pushes retry policy to the orchestrator, where it belongs.

**Operational consequence**: Docker Compose (`depends_on: { postgres: { condition: service_healthy } }`) and Kubernetes (`initContainers` or the deployment's `restartPolicy`) handle the retry. The backend's `/api/health` returns 200 or the process is dead — no third state.

**Alternatives considered**: covered in the Clarification question (retry-with-degraded, bounded-retry-then-fail). Rejected.

---

## 7. Global rate limiting — `@nestjs/throttler` (Clarification 3)

**Decision**: Register `ThrottlerModule.forRoot()` in `AppModule` with the global limits from env (e.g., `THROTTLE_TTL=60`, `THROTTLE_LIMIT=100`). Apply `ThrottlerGuard` as an `APP_GUARD`. Stricter per-route override on auth-sensitive endpoints using `@Throttle({ default: { limit: N_AUTH, ttl: TTL_AUTH } })` on the `signup`, `login`, `send-otp` (forgot-password), `reset-password` controllers. Rate-limit rejections pass through the global exception filter so the response is the Sikka envelope with `message: "Too Many Requests"`, `error: "rate_limited"`, plus a `Retry-After` header set by Throttler.

**Proposed default limits** (all env-driven; these are the plan's defaults, not hard-coded):

| Tier   | Env var                          | Default        | Applies to                              |
| ------ | -------------------------------- | -------------- | --------------------------------------- |
| Global | `THROTTLE_GLOBAL_TTL` / `_LIMIT` | 60 s / 100 req | all routes                              |
| Auth   | `THROTTLE_AUTH_TTL` / `_LIMIT`   | 60 s / 5 req   | signup, login, send-otp, reset-password |

**Rationale**: Clarification 3 (Option C user-modified to "all modules"). Aligned with Sikka's `@nestjs/throttler` dep.

**Storage**: in-memory default. Design stays pluggable — `ThrottlerModule` accepts a custom storage adapter; swapping to Redis in a later phase requires no controller edit.

**Alternatives considered**: covered in the Clarification.

---

## 8. Transactional email — nodemailer with pluggable transport (Clarification 1 / Option B follow-through)

**Decision**: A single `EmailService` in `src/common/services/email.service.ts` wraps `nodemailer.createTransport(...)`. Transport is constructed from env:

- `MAIL_TRANSPORT=console` → log-to-console adapter (dev default)
- `MAIL_TRANSPORT=smtp` → real SMTP using `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- `MAIL_TRANSPORT=stream` → capture-to-outbox for tests (the `auth.e2e-spec.ts` suite reads from this)

One template method per email Phase 2 needs: `sendPasswordResetOtp(to, otp, ttl)`. Template is plain-text + minimal HTML; branding is Phase 7's problem.

**Rationale**: Clarification 1 (Option B) mandates email is wired in Phase 2. Sikka ships `nodemailer` as a dep, so we mirror. The `console`/`stream` transports let the e2e suite assert delivery without external infra.

**Alternatives considered**:

- **Provider SDK (SendGrid / Postmark / SES directly)** — provider lock-in. A nodemailer transport abstracts this; swap later if needed.
- **Deferred email** — rejected by Clarification 1.

---

## 9. Password hashing — bcrypt (mirror Sikka)

**Decision**: `bcrypt@^6.0.0`, salt rounds **12** (env-overridable via `BCRYPT_ROUNDS`). Passwords are hashed in `AuthService.signup()` and compared in `AuthService.login()`. Never logged. Never persisted in plaintext anywhere (not in logs, not in error responses).

**Rationale**: Sikka's choice, carried over. 12 rounds is the 2026 industry midpoint for `Math.pow(2, rounds)` work factor on server-class CPUs (~250 ms hash) — enough to be brute-resistant, not enough to slow real signups past the 200 ms p95 auth budget we set (we take 150 ms of that on the register path).

**FR-011d** ("one-way hash with per-user salt") is satisfied — bcrypt stores its per-record salt inside the hash string.

**Alternatives considered**:

- **Argon2** — stronger memory-hardness; Sikka doesn't use it. Revisit post-Phase-2.
- **scrypt** — OK but bcrypt has the broader library + ops track record.

---

## 10. JWT strategy — access (Authorization header) + refresh (cookie + body)

**Decision**: Three Passport strategies, all vendored from Sikka:

- `AccessTokenStrategy` — `passport-jwt` with `fromAuthHeaderAsBearerToken()`, secret `JWT_ACCESS_SECRET`, lifetime `JWT_ACCESS_EXPIRES_IN`.
- `RefreshTokenStrategy` — `passport-jwt` with `fromBodyField('refreshToken')` for non-browser clients (mobile, tests), secret `JWT_REFRESH_SECRET`.
- `RefreshTokenCookieStrategy` — same but `fromExtractors([req => req.signedCookies?.refresh_token ?? req.cookies?.refresh_token])` for browser clients.

Guards wire to those strategies: `JwtAuthGuard`, `RefreshTokenGuard`, `RefreshTokenCookieGuard`. A `@Public()` decorator short-circuits `JwtAuthGuard`.

**Refresh-token revocation**: per FR-011e, a successful password reset rotates the `users.refreshTokenHash` nonce, invalidating outstanding refresh tokens. Implementation: the refresh token's JWT payload includes `jti` (token id); `AuthService.refresh()` verifies `jti` matches the user's current `refreshTokenHash`. Reset sets a new nonce, orphaning all prior `jti`s.

**Cookie settings**: `HttpOnly=true`, `Secure={NODE_ENV === "production"}`, `SameSite=lax` in dev / `strict` in prod, `Path=/api/auth`, signed via `COOKIE_SECRET`. All overridable via env where operationally needed.

**Rationale**: exact Sikka shape. The dual refresh strategy (cookie + body) lets Phase 7's React frontend rely on cookies while Phase 2's e2e test uses the body variant.

**Alternatives considered**: single-strategy (body-only or cookie-only) — rejected because Phase 7's Axios client is cookie-based but supertest-based e2e wants body for test isolation.

---

## 11. URL versioning — unversioned (Clarification 5)

**Decision**: Global prefix `/api`. No `/v1`. No NestJS URI versioning. Opt into URI versioning in a future phase on a per-controller basis when the first breaking change lands.

**Rationale**: Clarification 5 (Option A). Matches Sikka.

---

## 12. API docs portal exposure — open everywhere (Clarification 4)

**Decision**: `app.use("/api/docs", apiReference({...}))` runs in every environment. No env gate. No auth middleware in front of it. The document is generated via `SwaggerModule.createDocument(app, config)` on boot.

**Rationale**: Clarification 4 (Option A). Tradeoff explicitly accepted: security depends on rate limits (§7), input validation (FR-009), and account-enumeration mitigations (forgot-password identical response) — not on schema secrecy.

**Alternatives considered**: env-flag, basic-auth, internal-only — covered and rejected in the Clarification.

---

## 13. Account-enumeration mitigation on forgot-password

**Decision**: `POST /api/auth/send-otp` (Sikka's name for forgot-password) returns **200 with the same envelope** regardless of whether the submitted email belongs to a registered user. The email transport is only actually called if the user exists; to the outside observer the behavior is identical. The per-route rate limit (§7) prevents enumerating at volume.

**Rationale**: OWASP account-enumeration guidance; an obvious attack vector opened up by making the endpoint public (which we must, since the frontend calls it un-authenticated).

**Trade-off acknowledged**: legit users who mistype their email get a success response even though no email is sent. The frontend UX (Phase 7) handles this with a "we sent an email if that address is registered — check spam" message.

---

## 14. Users schema — minimum columns for the vendored auth module

**Decision**: The `users` table columns required by Sikka's `AuthService` + sufficient for Phase 2:

| Column                 | Type          | Constraints                            | Notes                                                        |
| ---------------------- | ------------- | -------------------------------------- | ------------------------------------------------------------ |
| `id`                   | `uuid`        | PK, default `gen_random_uuid()`        |                                                              |
| `email`                | `text`        | NOT NULL, UNIQUE, lowercased on insert |                                                              |
| `password_hash`        | `text`        | NOT NULL                               | bcrypt output; never NULL even for OAuth later (placeholder) |
| `role`                 | `text`        | NOT NULL, default `'user'`             | Enum at app layer: `'user' \| 'admin'`                       |
| `refresh_token_nonce`  | `text`        | NULLABLE                               | Rotated on password reset; participates in `jti` comparison  |
| `reset_otp_hash`       | `text`        | NULLABLE                               | Hashed OTP for password reset                                |
| `reset_otp_expires_at` | `timestamptz` | NULLABLE                               |                                                              |
| `created_at`           | `timestamptz` | NOT NULL, default `now()`              |                                                              |
| `updated_at`           | `timestamptz` | NOT NULL, default `now()`              | Updated via trigger or app-layer                             |

**Rationale**: Matches Sikka's query surface. Richer profile columns (display name, avatar, XP, rank) are Phase 7's scope (FR-011b); adding them in Phase 2 would be a speculative addition forbidden by the task-scope rule.

**Alternatives considered**:

- **Mirror Sikka's entire `users` table** — Sikka's table has cols Zonite doesn't need in Phase 2 (onboarding flags, phone, etc). Pulling them all in adds migration surface for no value. Rejected.
- **Store OTPs in a separate `password_reset_tokens` table** — cleaner but not what Sikka ships. Revisit if Phase 2+ auth work demands it.

---

## 15. Testing — one e2e walkthrough in Phase 2

**Decision**: Ship exactly one meaningful test file in Phase 2: `test/auth.e2e-spec.ts`. It:

1. Boots the app in a jest global setup (using `@nestjs/testing` + supertest)
2. Configures `MAIL_TRANSPORT=stream` so emails are captured in-memory
3. Walks: POST `/auth/signup` → 201 envelope, POST `/auth/login` → access token + refresh cookie, GET a protected route with the token → 200 envelope with `@CurrentUser()` data, POST `/auth/refresh` → new access token, POST `/auth/send-otp` → 200 envelope + captured email contains OTP, POST `/auth/reset-password` with OTP → 200, POST `/auth/login` with new password → 200.
4. Asserts envelope shape (`success`, `code`, `message`, `data`, `timestamp`) on every response.

No unit tests in Phase 2 beyond what Sikka ships for the vendored code (mirrored alongside). Full coverage is per-feature-phase.

**Rationale**: SC-010 ("fresh user can complete the full auth loop in under 5 minutes, 100% envelope-conformant") is best verified by one end-to-end test that runs in CI on every PR.

**Alternatives considered**:

- **Full unit test suite in Phase 2** — violates "no tests beyond the reference-module examples" assumption. Too wide a scope for a plumbing phase.
- **Manual verification via quickstart only** — skips the CI regression signal.

---

## 16. Logging — Nest's default logger with env-mapped level

**Decision**: Use Nest's built-in logger with `app.useLogger(logLevelMap[env.LOG_LEVEL])` per Sikka's `main.ts` pattern. No structured-log library in Phase 2.

**Rationale**: Sikka Parity. Observability (metrics/tracing/structured logs) is Phase 8's scope.

**Alternatives considered**: pino/winston — deferred.

---

## Consolidated dependency diff against current `apps/backend/package.json`

Current `apps/backend/package.json` ships:

```text
@nestjs/common, @nestjs/core, @nestjs/platform-express, @zonite/shared,
class-transformer, class-validator, reflect-metadata, rxjs, zod
```

Additions this plan requires:

```text
@nestjs/jwt, @nestjs/passport, @nestjs/throttler, @nestjs/swagger,
@scalar/nestjs-api-reference, passport, passport-jwt,
bcrypt, cookie-parser, drizzle-orm, pg, nodemailer, dotenv

devDeps: drizzle-kit, @types/bcrypt, @types/cookie-parser, @types/passport-jwt,
         @types/pg, @types/nodemailer, @nestjs/testing, jest, supertest, ts-jest
```

Versions pinned to the Sikka-compatible range in the Technical Context section of the plan.

---

## Open questions that are explicitly deferred to planning-of-next-phase

- Concrete email provider for production SMTP (the env plug is generic; ops will pick Postmark/SendGrid/SES when Phase 2 hits prod). Does not block Phase 2 build.
- Whether `logout` should also revoke the refresh nonce or merely clear the cookie. Plan's current answer: clear cookie only; full revocation on explicit logout can be added in an 8.x hardening pass.
- Redis as throttler storage — explicitly Phase 4/5+ when real-time load lands.
