# Phase 1 Data Model — Backend Foundation

**Feature**: 004-backend-foundation
**Date**: 2026-04-22

This phase introduces **one** persistent entity (`users`) and several **cross-wire type** contracts (envelope, pagination, auth payloads) that live in `packages/shared`. In-memory shapes (Throttler storage, env) are documented here for completeness even though they are not persisted.

---

## 1. Persistent entity: `users`

Table name: `users` (lowercase-plural per constitution's Naming convention).

```text
users
├── id                        UUID   PK   default gen_random_uuid()
├── email                     TEXT   NOT NULL  UNIQUE (citext-like — app lowercases on insert)
├── password_hash             TEXT   NOT NULL  (bcrypt output; FR-011d)
├── role                      TEXT   NOT NULL  default 'user'    (enum at app: 'user' | 'admin')
├── refresh_token_nonce       TEXT   NULL                          (rotated on reset; see FR-011e)
├── reset_otp_hash            TEXT   NULL                          (bcrypt of the 6-digit OTP)
├── reset_otp_expires_at      TIMESTAMPTZ NULL
├── created_at                TIMESTAMPTZ NOT NULL default now()
└── updated_at                TIMESTAMPTZ NOT NULL default now()   (touched on any write)

INDEXES
├── UNIQUE (email)
└── (reset_otp_expires_at)   WHERE reset_otp_expires_at IS NOT NULL   — partial index for cleanup
```

### Drizzle schema (planned; lives at `apps/backend/src/db/schema/users.ts`)

```ts
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    refreshTokenNonce: text("refresh_token_nonce"),
    resetOtpHash: text("reset_otp_hash"),
    resetOtpExpiresAt: timestamp("reset_otp_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => ({
    resetOtpIdx: index("users_reset_otp_expires_at_idx").on(t.resetOtpExpiresAt),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Validation rules (enforced at controller DTOs + service layer)

| Field | Rule | Where enforced |
| ----- | ---- | -------------- |
| `email` | RFC 5321 shape, ≤ 254 chars, lowercased before insert | `SignupDto.email` class-validator `@IsEmail()` + service `.toLowerCase()` |
| `password` (plaintext, request-only) | 8 ≤ len ≤ 128, at least 1 letter + 1 digit | `SignupDto.password`, `ResetPasswordDto.newPassword` |
| `passwordHash` (stored) | bcrypt with `$2b$` prefix; never logged | `AuthService.hashPassword()` |
| `role` | `'user'` default on signup; admin role set out-of-band (not exposed via API in Phase 2) | DB default + DTO whitelist (no role in signup body) |
| `reset_otp_hash` | 6-digit numeric OTP bcrypt-hashed; never stored plaintext | `AuthService.requestPasswordReset()` |
| `reset_otp_expires_at` | `now() + JWT_RESET_PASSWORD_EXPIRES_IN` (default 1 h) | same service |

### Lifecycle / state transitions

```text
(none)  ──signup──▶  (active)
                       │
                       ├──login──▶  (active, issued tokens)
                       │
                       ├──request-password-reset──▶  (active, reset_otp_hash set, expiry set)
                       │                                       │
                       │                              (expiry passes or reset succeeds → cleared)
                       │
                       └──reset-password──▶  (active, refresh_token_nonce rotated, all prior tokens invalid)
```

There is **no** soft-delete or deactivate flow in Phase 2.

### Identity & uniqueness

- `id` uuid v4 is the stable identifier.
- `email` is the login credential. Case-insensitive match (app lowercases before query and on insert).

---

## 2. Cross-wire types (land in `packages/shared/src/http/`)

### 2.1 `envelope.ts` — response envelope (Sikka-exact)

```ts
export type SuccessResponse<T> = {
  code: number;          // HTTP status mirror (200, 201, etc.)
  success: true;
  message: string;
  data: T;
  timestamp: string;     // ISO-8601
};

export type ErrorResponse = {
  code: number;
  success: false;
  message: string;
  error?: string;        // category, e.g. "rate_limited", "validation_failed", "unauthorized"
  data?: Record<string, unknown>; // optional field-level errors or extra context
  timestamp: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

**Invariant**: every HTTP response — whether from a controller, the global exception filter, or the throttler — conforms to `ApiResponse<T>`. The reference check is a trivial type guard: if `body.success === true` it's success-shaped; otherwise error-shaped. Same `code` and `timestamp` keys present on both.

### 2.2 `pagination.ts` — pagination contract

```ts
export type PaginationQuery = {
  page?: number;     // 1-indexed; default 1
  pageSize?: number; // default 20, max 100
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedData<T> = {
  items: T[];
} & PaginationMeta;

export type PaginatedResponse<T> = SuccessResponse<PaginatedData<T>>;
```

**Note**: pagination meta lives **inside** `data` (not at the envelope top level). This matches Sikka's `responses.dto.ts` and keeps the envelope flat.

### 2.3 `auth/tokens.ts` — auth payload contracts

```ts
export type AuthTokens = {
  accessToken: string;
  refreshToken?: string; // present in body for non-browser clients; cookie-based clients receive it via Set-Cookie
  accessTokenExpiresIn: number;  // seconds
  refreshTokenExpiresIn: number; // seconds
};

export type AccessTokenPayload = {
  sub: string;   // user id
  email: string;
  role: "user" | "admin";
  iat: number;
  exp: number;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;   // matched against users.refresh_token_nonce
  iat: number;
  exp: number;
};
```

### 2.4 `auth/user.ts` — the `@CurrentUser()` projection

```ts
export type CurrentUser = {
  id: string;
  email: string;
  role: "user" | "admin";
};
```

This is the *safe* projection — never carries `passwordHash`, tokens, or OTP state.

---

## 3. In-memory shapes (not persisted)

### 3.1 `env` object (from Zod parse of `process.env`)

```ts
export type Env = {
  NODE_ENV: "development" | "production";
  PORT: number;
  LOG_LEVEL: "silent" | "error" | "warn" | "info" | "debug";

  DATABASE_URL: string;

  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: number;       // seconds
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: number;      // seconds
  JWT_RESET_PASSWORD_EXPIRES_IN: number;

  COOKIE_SECRET: string;
  CORS_ORIGINS: string[];              // comma-separated → parsed array

  BCRYPT_ROUNDS: number;               // default 12

  THROTTLE_GLOBAL_TTL: number;         // seconds, default 60
  THROTTLE_GLOBAL_LIMIT: number;       // default 100
  THROTTLE_AUTH_TTL: number;           // default 60
  THROTTLE_AUTH_LIMIT: number;         // default 5

  MAIL_TRANSPORT: "console" | "smtp" | "stream";
  MAIL_HOST?: string;
  MAIL_PORT?: number;
  MAIL_USER?: string;
  MAIL_PASS?: string;
  MAIL_FROM: string;
};
```

**Parse-time invariants**:

- Secrets ≥ 8 chars (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`).
- `MAIL_HOST`/`MAIL_PORT`/`MAIL_USER`/`MAIL_PASS` **required when** `MAIL_TRANSPORT === "smtp"` (Zod `.superRefine` guard).
- `THROTTLE_AUTH_LIMIT < THROTTLE_GLOBAL_LIMIT` (Zod `.superRefine` — auth tier is stricter by definition).

### 3.2 Throttler storage shape (in-memory default)

```text
Map<key, { totalHits: number, expiresAt: number }>
  where key = `${ipOrUserId}:${routeClass}`
  routeClass ∈ { "global", "auth" }
```

Storage is opaque to application code; surfaced only so the Spek can reason about it.

---

## 4. Relationships

Phase 2's only persisted entity is `users`. No foreign keys, no joins. Later phases add `rooms`, `matches`, etc.; those will reference `users.id`.

---

## 5. State transitions — summary table

| Source state | Event | Target state | Side effects |
| ------------ | ----- | ------------ | ------------ |
| (no user) | `POST /auth/signup` | row exists, active | bcrypt hash stored; `201` + access token + refresh cookie |
| active | `POST /auth/login` | active, tokens issued | no row change; tokens returned |
| active | `POST /auth/refresh` (with valid refresh + matching `jti`) | active, new access token | no DB write in plan's minimal path; `jti` stays valid until reset |
| active | `POST /auth/send-otp` (email exists) | active, OTP set | `reset_otp_hash` + `reset_otp_expires_at` populated; email dispatched |
| active | `POST /auth/send-otp` (email doesn't exist) | no change | no email; response identical (enumeration mitigation) |
| active, OTP set | `POST /auth/reset-password` | active, password rotated | `password_hash` updated; `refresh_token_nonce` rotated; `reset_otp_*` cleared; all outstanding refresh tokens invalidated |
| active | `POST /auth/change-password` (authenticated) | active, password rotated | same as reset but initiated by authenticated user |
| active | `POST /auth/logout` | active | `Set-Cookie: refresh_token=; Max-Age=0`; **no** DB write (see research §16 deferred Q) |

---

## 6. Migration plan

Single migration generated at Phase 2 time — `0000_initial_users.sql` — produced by `drizzle-kit generate`. Applied against Phase 0's Postgres service via `pnpm db:push` (dev) or `pnpm db:migrate` (staging/prod). SC-011's acceptance is a manual inspection of the live schema after migration: `\d users` in `psql` lists all columns above.
