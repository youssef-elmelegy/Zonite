# Quickstart — Phase 7: Game Screens & Account Screens

Assumes Phase 6 (Frontend Foundation) and Phase 4 (Backend Foundation) are complete and the dev environment is set up.

---

## Prerequisites

```bash
# From repo root
node --version   # must be 22.x (check .nvmrc)
pnpm --version   # must be >= 9

# .env file must include:
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/zonite
# JWT_ACCESS_SECRET=<any_secret>
# JWT_REFRESH_SECRET=<any_secret>
# JWT_ACCESS_EXPIRES_IN=15m
# JWT_REFRESH_EXPIRES_IN=7d
# BCRYPT_SALT_ROUNDS=10
# DEV_MAIL_LOG=true     # routes OTP to console instead of SMTP
# CORS_ORIGINS=http://localhost:5173
# NODE_ENV=development
```

---

## Start the full stack

```bash
# From repo root — starts Postgres + backend (hot reload) + frontend (Vite)
pnpm dev
```

Or run pieces individually:

```bash
# 1. Postgres only
docker compose up db -d

# 2. Backend
pnpm --filter @zonite/backend dev

# 3. Frontend
pnpm --filter @zonite/frontend dev
```

---

## Run DB migrations

After adding Phase 7 DB changes (fullName, xp, match_player_records):

```bash
cd apps/backend
pnpm drizzle-kit generate   # generates migration SQL from schema changes
pnpm drizzle-kit migrate    # applies migrations to local Postgres
```

---

## Test the full game loop manually

1. Open `http://localhost:5173` — should see Onboarding (first visit).
2. Complete the 3-step carousel → Signup form → create account.
3. From Home, click "Create Room" → configure settings → "Create Room".
4. Copy the 6-character room code from the Lobby screen.
5. Open a **second browser tab** (or incognito) at `http://localhost:5173/login`.
6. Log in with a second account (or create one) → enter the room code on Home → Join.
7. In Tab 2, click "Ready". In Tab 1 (host), "Start Game" should now be enabled.
8. Click "Start Game" → both tabs navigate to the Game screen.
9. Click blocks to claim them — observe real-time updates in both tabs.
10. Wait for the timer to expire → both tabs navigate to Results.
11. Navigate to Profile — stats and match history should reflect the completed game.

---

## Test password reset (dev)

1. From Login screen, click "Forgot password?".
2. Enter the email of an existing account → Submit.
3. **Watch the backend terminal log** for the line: `[OTP] <email> → <6-digit code>`.
4. Copy the OTP → enter it on the Reset Password screen along with a new password.
5. Submit → success toast → navigate to Login → sign in with new password.

---

## Type check + lint

```bash
# From repo root
pnpm type-check   # tsc --noEmit across all packages
pnpm lint         # ESLint across workspace
```

---

## Component showcase

```
http://localhost:5173/_showcase
```

Review `MiniGridArt` animation and `AuthLayout` composition here before integrating into screens.
