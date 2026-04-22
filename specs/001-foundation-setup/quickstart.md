# Quickstart — Zonite Phase 0 Local Dev

**Feature**: Foundation & Project Setup (Phase 0)
**Audience**: New or returning contributors running Zonite locally for the first time.
**Verifies**: Spec User Story 1 (cold-clone bring-up) and User Story 2 (shared
contract compiles against both apps).

This document is the exact script a contributor follows the first time they touch
Zonite. If a step here fails on a clean checkout, it is a Phase 0 bug.

---

## 0. Prerequisites

Install once per machine:

- **Git**
- **Node.js 22 LTS** — matches `.nvmrc` at repo root. Recommended: use
  `nvm`/`fnm`/`volta` so `nvm use` (or equivalent) auto-selects the right version
  when entering the repo.
- **pnpm 9.x** — `npm install -g pnpm` or `corepack enable && corepack prepare
pnpm@9 --activate`.
- **Docker Engine + Compose v2** — Docker Desktop (macOS/Windows), OrbStack (macOS),
  or native Docker (Linux). Windows contributors must run all commands from inside
  WSL2.

Verify:

```bash
node --version      # v22.x.x
pnpm --version      # 9.x.x
docker compose version  # v2.x.x
```

---

## 1. Clone and install

```bash
git clone <repo-url> zonite
cd zonite
pnpm install
```

`pnpm install` resolves dependencies for all three workspace packages from a single
`pnpm-lock.yaml`. Expected time on a warm cache: under 30 seconds. First-ever run on
a cold machine: 1–2 minutes.

**Verify**: `node_modules/` exists at the repo root and inside each of `apps/backend`,
`apps/frontend`, `packages/shared`.

---

## 2. Copy environment template

```bash
cp .env.example .env
```

No edits required. `.env.example` is authoritative — every variable the project
reads is declared there with a safe local default (spec FR-013, FR-014).

**Verify**: `.env` exists at repo root and is listed in `.gitignore`.

---

## 3. Bring up the stack

```bash
docker compose up --build
```

On first run this builds the backend and frontend dev images (~2 minutes combined)
and pulls `postgres:16-alpine` (~30 seconds). Subsequent runs reuse cached layers
and start in under 15 seconds.

You can pass `-d` to detach; omit for live log tailing, which is recommended for the
first run so any startup error is immediately visible.

---

## 4. Verify the stack is healthy

Open three terminals (or use `docker compose ps`):

### Backend

```bash
curl -s http://localhost:3000/api/health | jq
```

Expected output (`timestamp` will differ):

```json
{
  "code": 200,
  "success": true,
  "message": "Zonite backend is healthy",
  "data": { "status": "ok" },
  "timestamp": "2026-04-17T10:15:30.123Z"
}
```

If the envelope shape differs from the contract
([contracts/health.http.md](./contracts/health.http.md)), Phase 0 is broken — file it
as a blocker, do not work around it.

### Frontend

Open <http://localhost:5173/> in a browser. You should see a placeholder page that
reads **"Zonite — Phase 0 OK"**. No routing, no game UI — that is correct for Phase 0.

### Database

```bash
docker compose exec postgres pg_isready -U zonite
# postgres:5432 - accepting connections
```

---

## 5. Verify hot reload

### Backend hot reload

With `docker compose up` still running in a terminal, edit
`apps/backend/src/modules/health/services/health.service.ts` and change the
`message` string in `getStatus()`. Save the file.

Expected: the compose logs for `backend` show `nest start --watch` recompiling, and
the next `curl http://localhost:3000/api/health` returns your new message.

### Frontend hot reload

Edit `apps/frontend/src/App.tsx` — change the placeholder text. Save.

Expected: the browser tab updates without a full reload (Vite HMR). If the tab
silently does a hard refresh, that is still within spec — HMR-where-applicable is
the promise (spec User Story 1 Acceptance Scenario 3).

---

## 6. Verify the shared contract

```bash
pnpm type-check
```

This runs `tsc --noEmit` across all three packages. Expected result: exits with code
0 in under 60 seconds (spec SC-004).

To verify User Story 2, open `packages/shared/src/enums/game-status.enum.ts` and
rename one of the enum members (e.g., `LOBBY` → `LOBBY_RENAMED`). Re-run
`pnpm type-check`. Expected: multiple errors in both `apps/backend` and
`apps/frontend` referencing the old name — proving both apps consume the shared
package by reference, not by copy.

Revert the rename before committing.

---

## 7. Verify pre-commit enforcement

```bash
# Deliberately introduce a lint violation
echo "const x = 1;const y = 2;" >> apps/backend/src/main.ts
git add apps/backend/src/main.ts
git commit -m "test: deliberate lint violation"
```

Expected: commit is blocked by Husky + lint-staged with an ESLint/Prettier message
naming `apps/backend/src/main.ts`. Run `git reset HEAD apps/backend/src/main.ts &&
git checkout -- apps/backend/src/main.ts` to restore.

---

## 8. Stop the stack

```bash
docker compose down
```

Postgres data persists in the `postgres-data` named volume. To nuke everything
(including data) for a truly clean re-run:

```bash
docker compose down -v
```

---

## Troubleshooting

| Symptom                                                 | Likely cause                                | Fix                                                                                                                                                        |
| ------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install` fails with `ERR_PNPM_UNSUPPORTED_ENGINE` | Node version mismatch                       | `nvm use` (or fnm/volta equivalent); `.nvmrc` pins Node 22                                                                                                 |
| Backend logs `ECONNREFUSED` at `postgres:5432`          | Backend started before Postgres was healthy | `docker compose restart backend`; or wait longer — `depends_on.condition: service_healthy` should handle this, so file as a bug if it recurs               |
| Frontend dev server unreachable at `localhost:5173`     | Vite bound to 127.0.0.1 inside container    | Check `vite.config.ts` sets `server.host: true`; re-run `docker compose up --build frontend`                                                               |
| `curl /api/health` returns 404                          | Missing `/api` global prefix                | Check `apps/backend/src/main.ts` has `app.setGlobalPrefix('api')` — this is a Sikka-parity violation (Constitution Principle II), not a quickstart problem |
| Pre-commit hook does not run                            | Husky not installed                         | `pnpm run prepare` (runs `husky install`)                                                                                                                  |
| `pnpm type-check` takes >60s                            | First run, cache cold                       | Second run is fast. If steady-state remains >60s, surface it as an SC-004 regression                                                                       |

---

## Where to go next

- **Project ruleset**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- **This phase's spec**: [spec.md](./spec.md)
- **Design decisions**: [research.md](./research.md)
- **Shared contract surface**: [data-model.md](./data-model.md) and
  [contracts/shared-package.md](./contracts/shared-package.md)
- **Spekit "Zonite Dev Hub"**: linked from the repo README (provisioned in Phase 0.4)
- **Next phase**: Phase 1 (Style Extraction — Yalgamers Design System)
