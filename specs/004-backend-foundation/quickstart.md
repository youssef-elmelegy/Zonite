# Quickstart — Backend Foundation (Phase 2)

**Target audience**: a backend engineer picking up Phase 2 from a clean clone, and a reviewer verifying Phase 2 exit criteria.

## 0. Prerequisites

- Node **22 LTS** (`nvm use` picks this up from `.nvmrc`).
- `pnpm` **≥ 9** on PATH.
- Docker + Docker Compose.
- PostgreSQL client (`psql`) for SC-011 verification.
- Access to the Sikka Platform Backend checkout at `/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend` — vendored code is cross-checked against it.

## 1. Bring up dependencies

```bash
# from repo root
pnpm install
cp .env.example .env         # edit as needed; see §2
docker compose up -d postgres
```

## 2. Required env (see data-model.md §3.1 for the authoritative list)

Minimum `.env` for local dev:

```dotenv
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

DATABASE_URL=postgres://zonite:zonite@localhost:5432/zonite

JWT_ACCESS_SECRET=dev-access-secret-change-me
JWT_ACCESS_EXPIRES_IN=900           # 15 min
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
JWT_REFRESH_EXPIRES_IN=604800       # 7 days
JWT_RESET_PASSWORD_EXPIRES_IN=3600  # 1 hour

COOKIE_SECRET=dev-cookie-secret-change-me
CORS_ORIGINS=http://localhost:5173

BCRYPT_ROUNDS=12

THROTTLE_GLOBAL_TTL=60
THROTTLE_GLOBAL_LIMIT=100
THROTTLE_AUTH_TTL=60
THROTTLE_AUTH_LIMIT=5

MAIL_TRANSPORT=console
MAIL_FROM=noreply@zonite.local
```

For SMTP in staging/prod set `MAIL_TRANSPORT=smtp` plus `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`.

## 3. Migrate the database

```bash
cd apps/backend
pnpm db:push     # dev — synchronous push of the schema
# or
pnpm db:generate && pnpm db:migrate    # staging/prod — versioned migrations
```

Verify (SC-011):

```bash
psql "$DATABASE_URL" -c '\d users'
```

Expected columns: `id`, `email`, `password_hash`, `role`, `refresh_token_nonce`, `reset_otp_hash`, `reset_otp_expires_at`, `created_at`, `updated_at`.

## 4. Run the backend

```bash
cd apps/backend
pnpm start:dev
```

You should see:

```text
[Nest] ... Application is running on: http://localhost:3000/api
[Nest] ... API Documentation: http://localhost:3000/api/docs
[Nest] ... Environment: development
[Nest] ... Log Level: debug
```

If you see a fail-fast exit like:

```text
[startup] database unreachable: host=localhost port=5432 database=zonite
```

— Postgres isn't up (revisit §1) or `DATABASE_URL` is wrong. There is no in-process retry; fix and re-run.

## 5. Verify the auth loop end-to-end (SC-010)

```bash
# 1. Signup
curl -sX POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"hunter2pass"}' | jq

# → { "code": 201, "success": true, "message": "...", "data": { "accessToken": "...", ... }, "timestamp": "..." }

# 2. Login (save access token + cookie)
curl -sX POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"alice@example.com","password":"hunter2pass"}' | tee /tmp/login.json | jq
ACCESS=$(jq -r .data.accessToken /tmp/login.json)

# 3. Call a protected route (use health's authenticated variant or any future protected route)
curl -sH "Authorization: Bearer $ACCESS" http://localhost:3000/api/health | jq

# 4. Refresh
curl -sX POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt -c cookies.txt | jq

# 5. Forgot password (watch the backend log for the reset email — MAIL_TRANSPORT=console prints it)
curl -sX POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com"}' | jq
# → the backend console prints: "[email] To: alice@example.com  OTP: 123456  expires 2026-04-22T11:00:00Z"

# 6. Reset password with the OTP from the log
curl -sX POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","otp":"123456","newPassword":"new-hunter2"}' | jq

# 7. Log in with the new password
curl -sX POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"new-hunter2"}' | jq
```

Every response body should match the envelope contract in [contracts/http-envelope.md](contracts/http-envelope.md).

## 6. Open the docs portal

Visit <http://localhost:3000/api/docs> — every endpoint listed under `auth` and `health` groups. "Authorize" button top-right accepts the bearer token from step 5.

## 7. Env-validation smoke (SC-004)

```bash
# rename a required var temporarily
unset JWT_ACCESS_SECRET
pnpm start:dev

# expected: the process exits within 2s with a message like
#   ZodError: JWT_ACCESS_SECRET: String must contain at least 8 character(s)
#   → exit code 1
```

## 8. Rate-limit smoke (SC-012)

```bash
# Fire 10 logins in 1 second from the same IP
for i in $(seq 1 10); do
  curl -sX POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@example.com","password":"x"}' -o /dev/null -w "%{http_code}\n"
done

# Expected: the first ~5 are 401 (bad creds), the rest are 429.
# 429 responses carry a Retry-After header and the envelope with error: "rate_limited".
```

## 9. Run the e2e suite

```bash
cd apps/backend
pnpm test:e2e
```

`test/auth.e2e-spec.ts` walks the §5 flow programmatically, asserting envelope conformance on every response.

## 10. Phase 2 exit checklist (map to Success Criteria)

- [ ] SC-001: `pnpm install && pnpm start:dev` ≤ 5 min from fresh clone; `/api/health` 200 within 10 s of process start.
- [ ] SC-002: `assertEnvelope` passes on every endpoint hit by the e2e.
- [ ] SC-003: Copy `modules/health` → `modules/_scratch`, register in `app.module.ts`, new endpoint appears in docs + returns envelope — under 15 min.
- [ ] SC-004: Each env var in `env.ts` schema, one-by-one blanked, exits ≤ 2 s with named cause.
- [ ] SC-005: All of §5's endpoints visible in `/api/docs`.
- [ ] SC-006: Synthetic error sweep (400, 401, 403, 404, 409, 422, 500) → no stack traces in body.
- [ ] SC-007: Frontend engineer preview dry-run passes.
- [ ] SC-008: `diff -r <(ls apps/backend/src) <(ls /media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend/src)` → zero structural divergence modulo the `common/filters/` deviation documented in plan.md's Complexity Tracking.
- [ ] SC-009: Five Phase 2 Speks live in the Zonite Dev Hub.
- [ ] SC-010: §5 curl sequence completes in ≤ 5 min with a real email captured (or streamed).
- [ ] SC-011: `\d users` lists the nine columns above.
- [ ] SC-012: §8 rate-limit smoke trips auth-tier 429 within 10 s; global tier trips on health route.
