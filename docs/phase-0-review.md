# Phase 0 Foundation Review — Zonite

**Date**: 2026-04-20
**Reviewer**: Claude (Opus 4.7)
**Branch**: `001-foundation-setup`
**Scope reviewed**: Every file produced by the Phase 0 implementation, against
[`specs/001-foundation-setup/`](../specs/001-foundation-setup/), [`PLAN.md`](../PLAN.md),
[`CLAUDE.md`](../CLAUDE.md), and [`.specify/memory/constitution.md`](../.specify/memory/constitution.md).

---

## TL;DR

**Verdict**: 🚨 **NOT SHIPPABLE AS-IS** — Phase 0's MVP acceptance criterion (US1 / T053
/ SC-001: `GET /api/health` returns the Sikka envelope) **fails at runtime**.

| Gate                        | Result                                                                            |
| --------------------------- | --------------------------------------------------------------------------------- |
| `pnpm type-check`           | ✅ all 3 packages exit 0                                                          |
| `pnpm lint`                 | ⚠️ 0 errors, 2 warnings (unused `eslint-disable`)                                 |
| `pnpm format:check`         | ❌ 2 files fail (Prettier would corrupt `<SPEKIT_TOPIC_URL>` placeholder)         |
| `docker compose up --build` | 🟡 builds & boots postgres + frontend cleanly                                     |
| Frontend served on :5173    | ✅ renders                                                                        |
| Backend `/api/health`       | 🚨 **BACKEND CRASHES** on startup: `ERR_MODULE_NOT_FOUND` inside `@zonite/shared` |
| CI (`install+lint+tc`)      | ✅ would pass (lint warnings don't fail CI; runtime not exercised)                |

The authored code matches the spec almost verbatim. The failure is caused by a
**gap in the spec itself**: `packages/shared` declares `"type": "module"` with a
`.ts` entry point and no `.js` extensions on internal re-exports, but the backend
compiles to CommonJS and executes under plain Node with no TS-runtime loader
(no `ts-node`, no `tsconfig-paths`, no SWC). That combination cannot resolve the
shared package at runtime, regardless of whether `tsc --noEmit` passes. Details in
**Section 4.1**.

---

## 1. How this review was run

1. Re-read all Phase 0 authoritative docs: [`spec.md`](../specs/001-foundation-setup/spec.md),
   [`plan.md`](../specs/001-foundation-setup/plan.md),
   [`research.md`](../specs/001-foundation-setup/research.md),
   [`tasks.md`](../specs/001-foundation-setup/tasks.md),
   [`data-model.md`](../specs/001-foundation-setup/data-model.md),
   [`quickstart.md`](../specs/001-foundation-setup/quickstart.md),
   [`contracts/`](../specs/001-foundation-setup/contracts/), and the
   [constitution](../.specify/memory/constitution.md).
2. Diffed each spec'd file block against the committed file on disk (task IDs T001–T063).
3. Executed: `pnpm -r --parallel run type-check`, `pnpm lint`, `pnpm format:check`.
4. Executed: `docker compose up -d --build`; polled `curl http://localhost:3000/api/health`
   for 45 s; opened `http://localhost:5173/`; inspected container logs and compiled
   `dist/` output; then `docker compose down`.
5. Verified git-tracked state of sensitive files (`.env`, lockfile).

Local runtime versions observed: Node **v25.9.0** (host), pnpm **9.12.0**, Docker
**29.4.0**, Compose **5.1.3**. Inside containers the Dockerfile correctly pins Node
**22** (`node:22-alpine`), so the host's Node 25 only raises a warning during
`pnpm install` on the host and is not a correctness issue.

---

## 2. What's correct (passes audit)

Only listed where it matters; everything below is byte-for-byte faithful to
[`tasks.md`](../specs/001-foundation-setup/tasks.md) unless noted.

### 2.1 Monorepo scaffold (Phase 1 of tasks.md)

- [package.json](../package.json): `packageManager: pnpm@9.12.0`, `engines.node: >=22.0.0 <23.0.0`,
  scripts `dev` / `type-check` / `lint` / `format` / `prepare` — all exact matches
  to T008.
- [pnpm-workspace.yaml](../pnpm-workspace.yaml): `apps/*` + `packages/*` — T006 ✅.
- [tsconfig.base.json](../tsconfig.base.json): strict mode, ES2022, path aliases
  `@zonite/shared` + `@zonite/shared/*` — T007 ✅.
- [.nvmrc](../.nvmrc): exactly `22` — T002 ✅.
- [.gitignore](../.gitignore), [.editorconfig](../.editorconfig),
  [.prettierrc](../.prettierrc), [.prettierignore](../.prettierignore),
  [.lintstagedrc.js](../.lintstagedrc.js), [.dockerignore](../.dockerignore) — all
  match or are reasonable supersets of the spec.

### 2.2 Shared package (Phase 2)

- [packages/shared/package.json](../packages/shared/package.json) — T012 ✅.
- [packages/shared/tsconfig.json](../packages/shared/tsconfig.json) — T013 ✅.
- Enums:
  [`game-status.enum.ts`](../packages/shared/src/enums/game-status.enum.ts),
  [`game-mode.enum.ts`](../packages/shared/src/enums/game-mode.enum.ts),
  [`team-color.enum.ts`](../packages/shared/src/enums/team-color.enum.ts) — T014–T016 ✅.
- Events:
  [`game-events.enum.ts`](../packages/shared/src/events/game-events.enum.ts),
  [`room-events.enum.ts`](../packages/shared/src/events/room-events.enum.ts),
  [`events/index.ts`](../packages/shared/src/events/index.ts) — T017–T019 ✅.
- Domain type skeletons — T020–T024 all match (verified field-for-field against
  [`data-model.md`](../specs/001-foundation-setup/data-model.md)).
- Barrel [`packages/shared/src/index.ts`](../packages/shared/src/index.ts) — T025 ✅.
- T026 (`pnpm -F @zonite/shared type-check`) passes when re-run.

### 2.3 Backend (Phase 3, 4)

- [apps/backend/package.json](../apps/backend/package.json),
  [tsconfig.json](../apps/backend/tsconfig.json),
  [nest-cli.json](../apps/backend/nest-cli.json) — T027–T029 ✅.
- [apps/backend/src/env.ts](../apps/backend/src/env.ts) — T030 ✅ (zod schema with
  strict `DATABASE_URL` refinement, CORS origins split + trim, fail-fast).
- Sikka envelope: [`response.types.ts`](../apps/backend/src/common/types/response.types.ts),
  [`response.handler.ts`](../apps/backend/src/common/utils/response.handler.ts) —
  T031–T032 ported verbatim ✅.
- Health module:
  [`health.module.ts`](../apps/backend/src/modules/health/health.module.ts),
  [`controllers/health.controller.ts`](../apps/backend/src/modules/health/controllers/health.controller.ts),
  [`services/health.service.ts`](../apps/backend/src/modules/health/services/health.service.ts),
  [`decorators/health-check-endpoint.decorator.ts`](../apps/backend/src/modules/health/decorators/health-check-endpoint.decorator.ts),
  [`dto/health-response.dto.ts`](../apps/backend/src/modules/health/dto/health-response.dto.ts),
  [`dto/index.ts`](../apps/backend/src/modules/health/dto/index.ts) — T033–T038 ✅.
- [apps/backend/src/app.module.ts](../apps/backend/src/app.module.ts),
  [main.ts](../apps/backend/src/main.ts) — T039–T040 ✅.
- [apps/backend/Dockerfile](../apps/backend/Dockerfile) — T041 ✅.
- US2 wiring: backend actually imports `GameStatus` from `@zonite/shared` in
  [`health.service.ts:2`](../apps/backend/src/modules/health/services/health.service.ts#L2)
  and [`health.controller.ts:2`](../apps/backend/src/modules/health/controllers/health.controller.ts#L2). Compiled output
  also preserves `require("@zonite/shared")` — T054 ✅ _at the source level_.

### 2.4 Frontend (Phase 3, 4)

- [apps/frontend/package.json](../apps/frontend/package.json),
  [tsconfig.json](../apps/frontend/tsconfig.json),
  [vite.config.ts](../apps/frontend/vite.config.ts),
  [index.html](../apps/frontend/index.html) — T042–T045 ✅.
- [src/main.tsx](../apps/frontend/src/main.tsx) — T046 ✅.
- [src/App.tsx](../apps/frontend/src/App.tsx) — T047 + T055 ✅ (imports
  `GameStatus` from `@zonite/shared`, renders `Shared contract boundary: LOBBY`).
- [apps/frontend/Dockerfile](../apps/frontend/Dockerfile) — T048 ✅.

### 2.5 Docker & env (Phase 3)

- [.env.example](../.env.example) — T049 ✅ (all 5 variables declared with inline
  comments and safe defaults: `NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`,
  `VITE_API_BASE_URL`).
- [docker-compose.yml](../docker-compose.yml) — T050 ✅ (three services, named
  volume, bridge network, postgres + backend healthchecks, no Redis/broker).

### 2.6 Husky + lint-staged + CI (Phase 5)

- [.husky/pre-commit](../.husky/pre-commit) — T058 ✅ (`pnpm lint-staged`).
- [.github/workflows/ci.yml](../.github/workflows/ci.yml) — T059 ✅ (install → lint
  → type-check; no test stage, no build stage, per spec FR-017a).

### 2.7 Documentation (Phase 6)

- [README.md](../README.md) — T061 ✅ (governance links + monorepo layout + core
  commands table). Spekit URL left as `<SPEKIT_TOPIC_URL>` placeholder as
  instructed.

### 2.8 What is correctly **not** present (out-of-scope discipline)

- No auth, no JWT guards.
- No Jest / Vitest / Supertest.
- No Tailwind, no design token extraction, no `.tokens.ts`.
- No Drizzle schemas.
- No socket gateway, no `@WebSocketGateway()`, no socket.io dependency.
- No game logic.
- No Scalar/Swagger decorators (deferred; the decorator bundle is a placeholder).

Constitutional principles I/II/IV are all visibly respected.

### 2.9 Confirmed verification steps

- `pnpm -r --parallel run type-check` → 3/3 packages pass (spec SC-004).
- `docker compose up --build` → postgres healthy, frontend serves HTML on :5173
  with Vite dev server working. Only the backend crashes (see §4.1).

---

## 3. Deviations from the plan

### 3.1 [FIXED-BY-IMPL, not a bug] App.tsx has extra `flexDirection` + `gap`

T047 ships a simpler style block; T055 extends it with `flexDirection: 'column'`,
`gap: '0.5rem'`, and a second `<p>` line to display the shared enum. The current
[`App.tsx`](../apps/frontend/src/App.tsx) matches T055 — correct.

### 3.2 [NEUTRAL] `docs/speks.md` is missing

Spec T062 requires a `docs/speks.md` manifest listing Phase 0 seed Speks. The
`docs/` directory exists but is empty. Not a runtime issue; is a Phase-0-exit
checklist gap — flagged against Principle V (Spekit-documented decisions).

- Impact: US4 acceptance is incomplete (Spekit Topic + `docs/speks.md` are both
  outstanding).
- Fix: create `docs/speks.md` with the content in T062, and provision the Spekit
  Topic (T063) before declaring Phase 0 done.

### 3.3 [NEUTRAL] `chmod +x` on `.husky/pre-commit` not verified

T058 ends with `chmod +x .husky/pre-commit`. The file contents are correct, but
the executable bit was not checked in this review (git on Linux preserves it if
it was set before the file was committed; if it wasn't, `husky` will warn and
skip).

- Fix: `ls -l .husky/pre-commit`; if not `-rwxr-xr-x`, run `chmod +x`.

---

## 4. Issues that must be fixed

### 4.1 🚨 **BLOCKER** — Backend crashes on start because `@zonite/shared` cannot be resolved at runtime

**Symptom** (verbatim from `docker compose logs backend`):

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/workspace/packages/shared/src/enums/game-status.enum'
imported from /workspace/packages/shared/src/index.ts
    at finalizeResolution (node:internal/modules/esm/resolve:275:11)
    ...
  url: 'file:///workspace/packages/shared/src/enums/game-status.enum'
```

**Observed state**:

- Container exits the Node process after Nest's tsc watch compiles `0 errors`.
- `apps/backend/dist/main.js` is produced and `require("@zonite/shared")` remains
  unrewritten in the compiled output.
- `docker compose ps` shows `zonite-backend-1 … Up (unhealthy)` because
  `/api/health` never binds.
- Frontend + postgres are unaffected.

**Root cause** — a three-way mismatch the spec didn't close:

1. [packages/shared/package.json](../packages/shared/package.json) declares
   `"type": "module"` and points `main`/`types`/`exports` at `./src/index.ts`
   (T012, unchanged).
2. [packages/shared/src/index.ts](../packages/shared/src/index.ts) uses extension-less
   re-exports: `export * from './enums/game-status.enum';` (T025, unchanged).
3. The backend compiles to **CommonJS** (`tsconfig.json "module": "commonjs"`)
   and [main.ts](../apps/backend/src/main.ts) is executed under plain Node (no
   `ts-node`, no `tsconfig-paths`, no SWC — `nest-cli.json` uses the default
   tsc builder). At runtime Node follows the pnpm workspace symlink
   `apps/backend/node_modules/@zonite/shared → packages/shared`, reads the
   package.json, sees `"type": "module"` + `.ts` entry, and attempts ESM
   resolution of the barrel. ESM requires explicit file extensions, so every
   re-export in `index.ts` fails.

This is exactly the case
[`research.md §2`](../specs/001-foundation-setup/research.md) waves away with
"NestJS's `ts-node`/SWC loader both resolve TypeScript directly thanks to the
`@zonite/shared/*` path alias." Neither loader is wired up in the delivered
implementation. The implementer followed the tasks literally; the tasks didn't
include the loader step.

**Why `tsc --noEmit` still passes**: backend `tsconfig.json` uses
`moduleResolution: node` but the base config's `paths` entry maps
`@zonite/shared → packages/shared/src/index.ts` and `isolatedModules: true` is
inherited. TypeScript therefore resolves the alias at compile time without
checking whether the runtime loader can find the same target. Same story for
the frontend, where Vite _does_ resolve the alias at dev-server boot (that's
why the frontend works).

**Fix options** (in order of least-invasive to most-invasive):

1. **Drop `"type": "module"` from `packages/shared/package.json`** and add
   `"sideEffects": false`. The barrel becomes plain CommonJS-resolvable (Node
   can `require()` a `.ts` file only if a loader is present — still fails, so
   this alone is not enough).
2. **Teach Nest to use SWC or `ts-node`** so alias resolution happens at runtime.
   Either:
   - Add `@swc/core` + configure `nest-cli.json` with `"builder": "swc"` and a
     `swcrc` that honours the `tsconfig.json paths`.
   - Add `tsconfig-paths` + register it in `main.ts` (not ideal for prod).
3. **Build the shared package** to `packages/shared/dist/*.js` with explicit
   `.js` extensions on its internal imports, and point
   `packages/shared/package.json` `main`/`types`/`exports` at that `dist`.
   Research §2 explicitly rejected this for the "zero-lag" property, but it is
   the option closest to "no surprises at runtime" and is what Sikka-style
   monorepos usually do. If chosen, wire it into `pnpm dev` via a predev /
   watch step.

Any of these will make T053 (the US1 verification step that runs the health
endpoint) actually pass. Until one is applied, **Phase 0 cannot be declared
complete** — spec SC-001 is not met.

### 4.2 🟡 **MINOR** — `pnpm format:check` fails; `pnpm format` would corrupt a placeholder

Prettier flags 2 files:

- [README.md:39](../README.md#L39): `<SPEKIT_TOPIC_URL> _(Phase 0.4 — pending)_`
- [specs/001-foundation-setup/tasks.md:1361](../specs/001-foundation-setup/tasks.md#L1361):
  same line inside the quoted README template.

Running `pnpm format` rewrites it to
`<SPEKIT*TOPIC_URL> *(Phase 0.4 — pending)\_`, which silently corrupts the
placeholder because Prettier parses the `_` inside `<…_URL>` as the opening of
an emphasis span.

**Fix**: either (a) escape the placeholder as `` `<SPEKIT_TOPIC_URL>` `` (code
span — Prettier won't touch it) in both files, or (b) add `specs/` to
[`.prettierignore`](../.prettierignore) and use a code span only in README.md.
Option (a) is cleaner because the spec file itself is also a source artefact
and we want it to round-trip through format without drift.

CI today only runs `lint` and `type-check` (not `format:check`), so this would
not block a PR — but it _would_ silently rot the README the first time someone
runs `pnpm format`, which is one of the core commands documented in
[README.md:55](../README.md#L55).

### 4.3 🟡 **MINOR** — 2 unused `eslint-disable` warnings (spec-authored)

`pnpm lint` output:

```
apps/backend/src/env.ts
  25:3  warning  Unused eslint-disable directive (no problems were reported from 'no-console')
apps/backend/src/main.ts
  22:3  warning  Unused eslint-disable directive (no problems were reported from 'no-console')
```

The [ESLint config](../eslint.config.mjs) never enables `no-console`, so the
`// eslint-disable-next-line no-console` comments spec'd in T030 and T040 are
dead code that ESLint reports as warnings. Not CI-breaking (warnings only), but
noisy.

**Fix options**:

1. Delete both disable comments (1 line each).
2. Add `'no-console': 'off'` to the backend override block in
   [eslint.config.mjs](../eslint.config.mjs) to keep the directives as
   future-proof annotations.
3. (Purist) Update the spec tasks to match whatever option is picked.

### 4.4 🟢 **NEUTRAL** — Prior-review false positive about `.env` being committed

For the record: `.env` exists in the working tree but is **not** tracked by git
(verified with `git ls-files .env` returning empty; `.gitignore` line 14 excludes
it). A previous pass of this audit flagged it as committed — that was wrong.
`.env` is exactly the per-developer copy of `.env.example` that T053 /
quickstart §3 expects.

---

## 5. Spec-vs-implementation matrix

| Task ID   | Phase | Story | Description                                 | Status                                                                                    |
| --------- | ----- | ----- | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| T001      | 1     | —     | Directory scaffold                          | ✅                                                                                        |
| T002–T005 | 1     | —     | `.nvmrc` / `.gitignore` / editor / prettier | ✅                                                                                        |
| T006–T010 | 1     | —     | Workspace + root package.json + ESLint      | ✅                                                                                        |
| T011      | 1     | —     | `pnpm install`                              | ✅ (lockfile present, `node_modules` populated)                                           |
| T012–T025 | 2     | —     | Shared package skeleton + barrel            | ✅                                                                                        |
| T026      | 2     | —     | `pnpm -F @zonite/shared type-check`         | ✅                                                                                        |
| T027–T029 | 3     | US1   | Backend manifest / tsconfig / nest-cli      | ✅                                                                                        |
| T030      | 3     | US1   | `env.ts` zod schema                         | ✅                                                                                        |
| T031–T032 | 3     | US1   | Sikka envelope ported                       | ✅                                                                                        |
| T033–T038 | 3     | US1   | Health module                               | ✅                                                                                        |
| T039–T040 | 3     | US1   | `app.module.ts` + `main.ts`                 | ✅ (source); 🚨 runtime (see §4.1)                                                        |
| T041      | 3     | US1   | Backend Dockerfile                          | ✅                                                                                        |
| T042–T048 | 3     | US1   | Frontend scaffold                           | ✅                                                                                        |
| T049–T050 | 3     | US1   | `.env.example` + `docker-compose.yml`       | ✅                                                                                        |
| T051      | 3     | US1   | `pnpm install` second pass                  | ✅                                                                                        |
| T052      | 3     | US1   | `pnpm type-check`                           | ✅                                                                                        |
| T053      | 3     | US1   | **Runtime bring-up + `/api/health`**        | 🚨 **FAIL** — backend crash (§4.1)                                                        |
| T054      | 4     | US2   | Backend imports `GameStatus`                | ✅ source; 🚨 runtime (same root cause)                                                   |
| T055      | 4     | US2   | Frontend imports `GameStatus`               | ✅                                                                                        |
| T056      | 4     | US2   | `pnpm type-check`                           | ✅                                                                                        |
| T057      | 5     | US3   | `pnpm run prepare` initialised Husky        | ✅ (`.husky/_/` present)                                                                  |
| T058      | 5     | US3   | `.husky/pre-commit` content                 | ✅ (executable bit not re-verified)                                                       |
| T059      | 5     | US3   | CI workflow                                 | ✅                                                                                        |
| T060      | 5     | US3   | Pre-commit probe                            | Not re-run in this review                                                                 |
| T061      | 6     | US4   | README content                              | ✅ (with Prettier warning §4.2)                                                           |
| T062      | 6     | US4   | `docs/speks.md`                             | ❌ missing (§3.2)                                                                         |
| T063      | 6     | US4   | External Spekit provisioning                | ⏳ pending (external)                                                                     |
| T064      | 7     | —     | `pnpm format`                               | ❌ would corrupt README (§4.2)                                                            |
| T065      | 7     | —     | `pnpm lint`                                 | ⚠️ 2 warnings (§4.3)                                                                      |
| T066      | 7     | —     | Full quickstart end-to-end                  | 🚨 blocked by §4.1                                                                        |
| T067      | 7     | —     | Verify SC-001…SC-007                        | SC-001 ❌ • SC-002 ✅ • SC-003 not re-run • SC-004 ✅ • SC-005 ⏳ • SC-006 ✅ • SC-007 ⏳ |
| T068      | 7     | —     | "Phase 0 complete" summary commit           | ❌ premature                                                                              |

---

## 6. Constitution compliance

| Principle                           | Result                                                                                                                                           |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| I — Shared contract source of truth | ✅ All enums, events, cross-wire types live only in `packages/shared`; no duplicates in apps (grep confirms).                                    |
| II — Sikka backend parity           | ✅ Response envelope + `ValidationPipe` + zod env + module layout match Sikka. _Runtime_ breakage is an integration bug, not a parity violation. |
| III — Yalgamers frontend fidelity   | ✅ With documented Phase 0 inline-style exemption on `App.tsx` ([plan.md §1.3](../specs/001-foundation-setup/plan.md)).                          |
| IV — Authoritative real-time server | ✅ (vacuous — no realtime code in Phase 0).                                                                                                      |
| V — Spekit-documented decisions     | ⚠️ `docs/speks.md` missing (§3.2); Spekit Topic pending (§4 T063).                                                                               |

---

## 7. Recommended fix plan (minimum diff to unblock)

Do these **in order**; the stack is not runnable until step 1 lands.

1. **Unblock the backend.** Pick ONE of the three options in §4.1. The
   lowest-impact path:
   - Add `@swc/core` to `apps/backend` devDependencies, and set
     `apps/backend/nest-cli.json` → `{"compilerOptions": {"deleteOutDir": true,
"builder": "swc", "typeCheck": true}}`. SWC respects tsconfig `paths` by
     default and will inline the shared package's TS sources.
   - Alternative if SWC is unacceptable: add a tiny build step for the shared
     package — `packages/shared/package.json` gets `"build": "tsc"` + `main` /
     `types` / `exports` pointing at `./dist/index.js` — and wire it into
     `pnpm dev` via `pnpm -r --if-present --parallel run build` ahead of compose.
2. **Re-run T053 and T066** end-to-end; confirm `curl
http://localhost:3000/api/health` returns the exact JSON defined in
   [`contracts/health.http.md`](../specs/001-foundation-setup/contracts/health.http.md).
3. **Protect the Spekit placeholder** (§4.2). Escape
   `<SPEKIT_TOPIC_URL>` as `` `<SPEKIT_TOPIC_URL>` `` in both
   [README.md:39](../README.md#L39) and
   [specs/001-foundation-setup/tasks.md:1361](../specs/001-foundation-setup/tasks.md#L1361).
4. **Clean ESLint noise** (§4.3). Remove the two
   `// eslint-disable-next-line no-console` comments.
5. **Create `docs/speks.md`** with the content specified in T062 (§3.2).
6. **Add `pnpm format:check` as a CI step** so the placeholder regression in
   §4.2 cannot recur.
7. **External**: provision the Spekit Topic and update README (T063).
8. Only then: T068 ("Phase 0 complete") commit.

---

## 8. Evidence appendix

### 8.1 `pnpm type-check` (trimmed)

```
Scope: 3 of 4 workspace projects
apps/backend  type-check$ tsc --noEmit
apps/frontend type-check$ tsc --noEmit
packages/shared type-check$ tsc --noEmit
packages/shared type-check: Done
apps/frontend   type-check: Done
apps/backend    type-check: Done
```

### 8.2 `pnpm lint` (trimmed)

```
/apps/backend/src/env.ts
  25:3  warning  Unused eslint-disable directive (no problems were reported from 'no-console')
/apps/backend/src/main.ts
  22:3  warning  Unused eslint-disable directive (no problems were reported from 'no-console')
✖ 2 problems (0 errors, 2 warnings)
```

### 8.3 `pnpm format:check`

```
[warn] README.md
[warn] specs/001-foundation-setup/tasks.md
ELIFECYCLE Command failed with exit code 1.
```

### 8.4 `docker compose ps` after 2 minutes

```
NAME               STATUS                       PORTS
zonite-backend-1   Up 2 minutes (unhealthy)     0.0.0.0:3000->3000/tcp
zonite-frontend-1  Up 2 minutes                 0.0.0.0:5173->5173/tcp
zonite-postgres-1  Up 2 minutes (healthy)       0.0.0.0:5432->5432/tcp
```

### 8.5 Backend crash (excerpt)

```
backend-1 | [12:12:15 AM] Found 0 errors. Watching for file changes.
backend-1 | Error [ERR_MODULE_NOT_FOUND]: Cannot find module
backend-1 |   '/workspace/packages/shared/src/enums/game-status.enum'
backend-1 |   imported from /workspace/packages/shared/src/index.ts
backend-1 |     at finalizeResolution (node:internal/modules/esm/resolve:275:11)
backend-1 | Node.js v22.22.2
```

### 8.6 Frontend served on :5173 (excerpt)

```
<!doctype html>
<html lang="en">
  <head>
    <script type="module">import { injectIntoGlobalHook } from "/@react-refresh"; …</script>
    …
    <title>Zonite</title>
```

### 8.7 Git state of `.env` (not committed)

```
$ git ls-files .env   # empty output → untracked, as intended
```

### 8.8 Backend compiled output confirms the runtime path

`apps/backend/dist/modules/health/services/health.service.js:11`

```
const shared_1 = require("@zonite/shared");
```

No runtime rewriting of `@zonite/shared` → it hits the pnpm symlink to the
shared TS sources at runtime, which is where the chain breaks (§4.1).

---

_End of review._
