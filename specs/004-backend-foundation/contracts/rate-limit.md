# Contract: Rate Limiting Policy

**Status**: global + auth-tier override; in-memory store in Phase 2 (pluggable).

## Tiers

| Tier name | Env var pair | Default | Scope |
| --------- | ------------ | ------- | ----- |
| `global`  | `THROTTLE_GLOBAL_TTL` / `THROTTLE_GLOBAL_LIMIT` | 60 s / 100 req | every route (excluded: none) |
| `auth`    | `THROTTLE_AUTH_TTL` / `THROTTLE_AUTH_LIMIT`     | 60 s / 5 req   | `POST /auth/signup`, `POST /auth/login`, `POST /auth/send-otp`, `POST /auth/reset-password` |

**Invariant** (env parse-time): `THROTTLE_AUTH_LIMIT < THROTTLE_GLOBAL_LIMIT`. Zod's `.superRefine` enforces this at startup; violation exits non-zero.

## Key identity

- Unauthenticated requests: keyed by **client IP** (`req.ip`, which reflects the real IP thanks to `trust proxy`).
- Authenticated requests (access token present and valid): keyed by **user id**. This is stricter — a user cannot bypass the limit by rotating IPs.

## Rejection response

When a request exceeds a tier's limit:

- HTTP status **429 Too Many Requests**
- Headers: `Retry-After: <seconds>` (matches the remaining TTL window)
- Body: the shared error envelope with `error: "rate_limited"`, `message: "Too Many Requests"`, `data: { tier: "global" | "auth" }`

## Implementation notes

- Wire `ThrottlerModule.forRoot()` in `AppModule`, reading the global tier from env.
- Apply `ThrottlerGuard` as `APP_GUARD` so every route carries the global tier by default.
- Override per-handler on auth endpoints using `@Throttle({ auth: { ttl: env.THROTTLE_AUTH_TTL * 1000, limit: env.THROTTLE_AUTH_LIMIT } })` (or the equivalent `@nestjs/throttler@^6` syntax).
- Route the throttler's `ThrottlerException` through the global `AllExceptionsFilter` to guarantee envelope shape.

## Load sweep (SC-012 verification)

A one-off load script (not a recurring test) fires `THROTTLE_AUTH_LIMIT + 1` requests to `POST /auth/login` from a single IP within the TTL window and asserts:

1. The first `THROTTLE_AUTH_LIMIT` succeed or return 401 (credentials), not 429.
2. Request `THROTTLE_AUTH_LIMIT + 1` returns 429 with the envelope above.
3. After `THROTTLE_AUTH_TTL` seconds, a fresh request succeeds again.

The same script against `GET /api/health` trips the global tier's looser limit with identical envelope + `Retry-After`.
