---
description: 'Task list — Phase 2 Backend Foundation (Sikka-vendored, auth-suite-live)'
---

# Tasks: Backend Foundation (Phase 2 — NestJS, Sikka Parity)

**Input**: Design documents from `/specs/004-backend-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: ONE end-to-end suite (`test/auth.e2e-spec.ts`) is explicitly required by Spec SC-010. No other tests are in scope for Phase 2.

**Organization**: Tasks are grouped by user story (US1–US5) per spec.md. US1, US2, US3, US4 are P1; US5 is P2.

## Format: `[ID] [P?] [Story] Description`

- **[P]** = parallelizable (different files, no incomplete dependencies).
- **[Story]** = `US1`..`US5`, only on user-story-phase tasks. Setup/Foundational/Polish have no story tag.
- Every task carries explicit file paths. When "**copy from Sikka**" appears, the absolute source path is given and any Zonite edits are enumerated.

## Shorthand

- `SIKKA_SRC` = `/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend/src`
- `ZONITE_BE` = `/media/jo/store/youssef/projects/yal-gaming/zonite/apps/backend`
- `ZONITE_SH` = `/media/jo/store/youssef/projects/yal-gaming/zonite/packages/shared`
- When a task says "copy from Sikka verbatim, then adjust imports", it means: copy the file, then find-and-replace `@/db` / `@/env` / `@/common` / `@/utils` / `@/types` references as-is (the `@/*` alias still resolves; see T003). Replace any Sikka-domain import (e.g., `@/modules/profile`) with the Zonite equivalent **only if referenced** — most common primitives don't touch domain modules.
- Path aliases: `@/*` → `ZONITE_BE/src/*` (set in T003).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, set up TypeScript path aliases, expand env.example, scaffold directory skeleton so Phase 2 tasks have targets.

- [ ] T001 Add backend runtime deps — in `ZONITE_BE/package.json` `dependencies`, add the block below (exact versions from plan.md Technical Context). Keep `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@zonite/shared`, `class-transformer`, `class-validator`, `reflect-metadata`, `rxjs`, `zod`. Additions: `@nestjs/jwt@^11.0.1`, `@nestjs/passport@^11.0.5`, `@nestjs/throttler@^6.5.0`, `@nestjs/swagger@^11.2.3`, `@scalar/nestjs-api-reference@^1.0.8`, `passport@^0.7.0`, `passport-jwt@^4.0.1`, `bcrypt@^6.0.0`, `cookie-parser@^1.4.7`, `drizzle-orm@^0.44.7`, `pg@^8.13.0`, `nodemailer@^8.0.1`, `dotenv@^17.2.3`. Do **not** run `pnpm install` yet — T007 does.
- [ ] T002 [P] Add backend dev deps — in `ZONITE_BE/package.json` `devDependencies`, add: `drizzle-kit@^0.31.7`, `@types/bcrypt@^6.0.0`, `@types/cookie-parser@^1.4.10`, `@types/passport-jwt@^4.0.1`, `@types/pg@^8.11.0`, `@types/nodemailer@^6.4.15`, `@nestjs/testing@^11.1.9`, `jest@^30.0.0`, `ts-jest@^29.2.0`, `supertest@^7.0.0`, `@types/supertest@^6.0.2`, `tsconfig-paths@^4.2.0`.
- [ ] T003 Add `@/*` path alias to `ZONITE_BE/tsconfig.json`. Open the file and ensure `compilerOptions.paths` includes `{"@/*": ["src/*"]}` and `baseUrl: "."`. Also ensure `moduleResolution: "node"` and `target: "ES2022"` (match Sikka's `tsconfig.json`). No other edits.
- [ ] T004 Add backend package scripts — in `ZONITE_BE/package.json` `scripts`, add (keep existing `start`, `start:dev`, `build`, `type-check`): `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`, `"db:push": "drizzle-kit push"`, `"db:studio": "drizzle-kit studio"`, `"test": "jest"`, `"test:e2e": "jest --config ./test/jest-e2e.json"`, `"lint": "eslint \"src/**/*.ts\" --fix"`.
- [ ] T005 [P] Create `ZONITE_BE/drizzle.config.ts` with content mirroring Sikka's:
  ```ts
  import { defineConfig } from 'drizzle-kit';
  export default defineConfig({
    schema: './src/db/schema/index.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: { url: process.env.DATABASE_URL as string },
  });
  ```
- [ ] T006 [P] Create `ZONITE_BE/test/jest-e2e.json` — minimal Jest config for e2e:
  ```json
  {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testEnvironment": "node",
    "testRegex": ".e2e-spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "moduleNameMapper": { "^@/(.*)$": "<rootDir>/../src/$1" }
  }
  ```
- [ ] T007 Run `pnpm install` at the repo root. Verify `ZONITE_BE/node_modules/.bin/drizzle-kit` and `ZONITE_BE/node_modules/.bin/nest` exist. Commit the resulting `pnpm-lock.yaml` delta.
- [ ] T008 [P] Expand `.env.example` at repo root — append the block from `quickstart.md` §2 under a `# --- Phase 2 Backend (auth, db, throttler, mail) ---` section. Add: `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN=900`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN=604800`, `JWT_RESET_PASSWORD_EXPIRES_IN=3600`, `COOKIE_SECRET`, `BCRYPT_ROUNDS=12`, `THROTTLE_GLOBAL_TTL=60`, `THROTTLE_GLOBAL_LIMIT=100`, `THROTTLE_AUTH_TTL=60`, `THROTTLE_AUTH_LIMIT=5`, `MAIL_TRANSPORT=console`, `MAIL_FROM=noreply@zonite.local`, and commented-out `MAIL_HOST`/`MAIL_PORT`/`MAIL_USER`/`MAIL_PASS` (uncomment when `MAIL_TRANSPORT=smtp`). Inline-comment each var.
- [ ] T009 [P] Create the directory skeleton under `ZONITE_BE/src/`. Run:
  ```bash
  mkdir -p ZONITE_BE/src/{db/schema,db/migrations,db/seeds,common/{decorators,dto,filters,guards,interceptors,services,strategies},utils,types,constants,modules/auth/{controllers,services,dto,decorators}}
  touch ZONITE_BE/src/common/interceptors/.gitkeep
  ```
  (substitute the real `ZONITE_BE` path). Verify the tree matches plan.md's "Source Code" layout.
- [ ] T010 [P] Commit: `chore(backend): phase 2 setup — deps, aliases, skeleton`. Do not push yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared-package cross-wire types, Sikka-exact primitives (env/envelope/pagination/filter/db) that every user story consumes. **No user story can start until Phase 2 is done.**

### Shared package — cross-wire types (land in `@zonite/shared`)

- [ ] T011 [P] Create `ZONITE_SH/src/http/envelope.ts` with the exact shape from `data-model.md` §2.1:
  ```ts
  export type SuccessResponse<T> = {
    code: number;
    success: true;
    message: string;
    data: T;
    timestamp: string;
  };
  export type ErrorResponse = {
    code: number;
    success: false;
    message: string;
    error?: string;
    data?: Record<string, unknown>;
    timestamp: string;
  };
  export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
  ```
- [ ] T012 [P] Create `ZONITE_SH/src/http/pagination.ts` with the shape from `data-model.md` §2.2:
  ```ts
  import type { SuccessResponse } from './envelope';
  export type PaginationQuery = { page?: number; pageSize?: number };
  export type PaginationMeta = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  export type PaginatedData<T> = { items: T[] } & PaginationMeta;
  export type PaginatedResponse<T> = SuccessResponse<PaginatedData<T>>;
  ```
- [ ] T013 [P] Create `ZONITE_SH/src/http/index.ts` that re-exports both: `export * from "./envelope"; export * from "./pagination";`
- [ ] T014 [P] Create `ZONITE_SH/src/auth/tokens.ts` with types from `data-model.md` §2.3:
  ```ts
  export type AuthTokens = {
    accessToken: string;
    refreshToken?: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
  };
  export type AccessTokenPayload = {
    sub: string;
    email: string;
    role: 'user' | 'admin';
    iat: number;
    exp: number;
  };
  export type RefreshTokenPayload = { sub: string; jti: string; iat: number; exp: number };
  ```
- [ ] T015 [P] Create `ZONITE_SH/src/auth/user.ts`:
  ```ts
  export type CurrentUser = { id: string; email: string; role: 'user' | 'admin' };
  ```
- [ ] T016 [P] Create `ZONITE_SH/src/auth/index.ts`: `export * from "./tokens"; export * from "./user";`
- [ ] T017 Update `ZONITE_SH/src/index.ts` barrel — add `export * from "./http"; export * from "./auth";` alongside the existing `enums`/`events`/`types` exports. Do not remove anything.
- [ ] T018 Run `pnpm --filter @zonite/shared build` (if the shared package has a build step) or just `pnpm type-check` at repo root. Fix any type errors before proceeding. Expected: clean.

### Backend env, utils, types, constants

- [ ] T019 Replace `ZONITE_BE/src/env.ts` with the full Zod schema from `data-model.md` §3.1. Preserve the existing vars (`NODE_ENV`, `PORT`, `DATABASE_URL`, `CORS_ORIGINS`) but extend with all JWT/COOKIE/BCRYPT/THROTTLE/MAIL fields. Use `dotenv.config()` at the top. Add a `superRefine` enforcing `THROTTLE_AUTH_LIMIT < THROTTLE_GLOBAL_LIMIT` and requiring MAIL_HOST/PORT/USER/PASS when `MAIL_TRANSPORT === "smtp"`. On parse failure: `console.error("[startup] env validation failed:", parsed.error.flatten().fieldErrors); process.exit(1);`. Export `export const env = Object.freeze(parsed.data); export type Env = typeof env;`. Reference Sikka's `SIKKA_SRC/env.ts` for the general structure.
- [ ] T020 [P] Create `ZONITE_BE/src/types/http.ts` that re-exports from the shared package:
  ```ts
  export type {
    SuccessResponse,
    ErrorResponse,
    ApiResponse,
    PaginationQuery,
    PaginationMeta,
    PaginatedData,
    PaginatedResponse,
  } from '@zonite/shared';
  ```
- [ ] T021 [P] Create `ZONITE_BE/src/types/index.ts`: `export * from "./http";`
- [ ] T022 [P] Copy `SIKKA_SRC/utils/response.handler.ts` to `ZONITE_BE/src/utils/response.handler.ts` **verbatim**. Only change: its `import { SuccessResponse, ErrorResponse } from "."` still resolves because of T023 — keep it.
- [ ] T023 [P] Create `ZONITE_BE/src/utils/index.ts`:
  ```ts
  export type { SuccessResponse, ErrorResponse, ApiResponse } from '@/types';
  export { successResponse, errorResponse } from './response.handler';
  ```
- [ ] T024 [P] Create `ZONITE_BE/src/constants/index.ts` with auth + throttler tier constants:
  ```ts
  export const AUTH_THROTTLE_KEY = 'auth' as const;
  export const ACCESS_TOKEN_COOKIE = 'access_token' as const;
  export const REFRESH_TOKEN_COOKIE = 'refresh_token' as const;
  ```

### Backend common primitives — filter, DTOs, decorators, guards-strategies scaffolds (skeletons now; logic wired in US4)

- [ ] T025 Create `ZONITE_BE/src/common/filters/all-exceptions.filter.ts`. The filter catches every thrown error in HTTP context and formats it via `errorResponse()`. Reference Sikka's exception-handling shape (from `SIKKA_SRC/main.ts` behavior + `utils/response.handler.ts`). Skeleton:

  ```ts
  import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { HttpAdapterHost } from '@nestjs/core';
  import { ThrottlerException } from '@nestjs/throttler';
  import { errorResponse } from '@/utils';

  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost) {
      const { httpAdapter } = this.httpAdapterHost;
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();

      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let errorKey: string | undefined = 'server_error';
      let data: Record<string, unknown> | undefined;

      if (exception instanceof ThrottlerException) {
        status = HttpStatus.TOO_MANY_REQUESTS;
        message = 'Too Many Requests';
        errorKey = 'rate_limited';
      } else if (exception instanceof HttpException) {
        status = exception.getStatus();
        const resp = exception.getResponse() as string | Record<string, unknown>;
        if (typeof resp === 'string') {
          message = resp;
        } else {
          message = (resp.message as string) ?? exception.message;
          if (Array.isArray(resp.message)) {
            data = { fieldErrors: resp.message };
            errorKey = 'validation_failed';
          } else if (typeof resp.error === 'string') {
            errorKey = (resp.error as string).toLowerCase().replace(/\s+/g, '_');
          }
        }
      } else if (exception instanceof Error) {
        this.logger.error(exception.stack);
        message = exception.message;
      }

      httpAdapter.reply(response, errorResponse(message, status, errorKey, data), status);
    }
  }
  ```

- [ ] T026 [P] Create `ZONITE_BE/src/common/filters/index.ts`: `export * from "./all-exceptions.filter";`
- [ ] T027 [P] Copy `SIKKA_SRC/common/dto/pagination-query.dto.ts` to `ZONITE_BE/src/common/dto/pagination-query.dto.ts` verbatim. Imports should remain intact (`class-validator`, `class-transformer`). No edits.
- [ ] T028 [P] Create `ZONITE_BE/src/common/dto/responses.dto.ts`:
  ```ts
  export type { SuccessResponse, ErrorResponse, ApiResponse } from '@/types';
  ```
  (Sikka's file is the type definition itself; Zonite re-exports from shared via `@/types`.)
- [ ] T029 [P] Create `ZONITE_BE/src/common/dto/index.ts`:
  ```ts
  export * from './pagination-query.dto';
  export * from './responses.dto';
  ```
- [ ] T030 [P] Copy `SIKKA_SRC/common/decorators/current-user.decorator.ts` to `ZONITE_BE/src/common/decorators/current-user.decorator.ts` verbatim. If it imports a Sikka-specific `CurrentUser` type, replace with `import type { CurrentUser } from "@zonite/shared";`. The runtime extraction logic from `request.user` stays unchanged.
- [ ] T031 [P] Copy `SIKKA_SRC/common/decorators/public.decorator.ts` to `ZONITE_BE/src/common/decorators/public.decorator.ts` verbatim (no edits — it's just `SetMetadata("isPublic", true)`).
- [ ] T032 [P] Copy `SIKKA_SRC/common/decorators/roles.decorator.ts` to `ZONITE_BE/src/common/decorators/roles.decorator.ts` verbatim.
- [ ] T033 [P] Create `ZONITE_BE/src/common/decorators/index.ts`:
  ```ts
  export * from './current-user.decorator';
  export * from './public.decorator';
  export * from './roles.decorator';
  ```
- [ ] T034 [P] Copy the five guards from `SIKKA_SRC/common/guards/` to `ZONITE_BE/src/common/guards/` — `jwt-auth.guard.ts`, `flexible-jwt.guard.ts`, `refresh-token.guard.ts`, `refresh-token-cookie.guard.ts`, `roles.guard.ts`. **Edits per file**: (a) if any guard imports a Sikka-specific user schema type (e.g., `@/db/schema/users` as a _type import_), replace with `import type { CurrentUser } from "@zonite/shared";`. (b) Leave Passport/strategy-name imports as-is.
- [ ] T035 [P] Create `ZONITE_BE/src/common/guards/index.ts`:
  ```ts
  export * from './jwt-auth.guard';
  export * from './flexible-jwt.guard';
  export * from './refresh-token.guard';
  export * from './refresh-token-cookie.guard';
  export * from './roles.guard';
  ```
- [ ] T036 [P] Copy the three strategies from `SIKKA_SRC/common/strategies/` to `ZONITE_BE/src/common/strategies/` — `access-token.strategy.ts`, `refresh-token.strategy.ts`, `refresh-token-cookie.strategy.ts`. **Edits per file**: every `env.JWT_*_SECRET` reference stays (it now resolves through Zonite's env). If the strategy queries the DB for the user (to attach to `request.user`), ensure it imports `db` from `@/db` (T041) and `users` schema from `@/db/schema` (T039). The `validate()` return shape must match `CurrentUser` from `@zonite/shared`.
- [ ] T037 [P] Create `ZONITE_BE/src/common/strategies/index.ts`:
  ```ts
  export * from './access-token.strategy';
  export * from './refresh-token.strategy';
  export * from './refresh-token-cookie.strategy';
  ```
- [ ] T038 [P] Create `ZONITE_BE/src/common/index.ts`:
  ```ts
  export * from './decorators';
  export * from './dto';
  export * from './filters';
  export * from './guards';
  export * from './strategies';
  ```

### DB layer — connection, schema, migration

- [ ] T039 Create `ZONITE_BE/src/db/schema/users.ts` **verbatim from data-model.md §1's Drizzle block** (do not copy from Sikka — Sikka's users table has fields Zonite doesn't need). Columns: `id uuid pk`, `email text unique not null`, `password_hash text not null`, `role text not null default 'user'`, `refresh_token_nonce text`, `reset_otp_hash text`, `reset_otp_expires_at timestamptz`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`. Index: `users_reset_otp_expires_at_idx` on `reset_otp_expires_at`. Export `User` and `NewUser` inferred types.
- [ ] T040 [P] Create `ZONITE_BE/src/db/schema/index.ts`: `export * from "./users";`
- [ ] T041 Create `ZONITE_BE/src/db/index.ts` mirroring Sikka's:

  ```ts
  /* eslint-disable @typescript-eslint/no-unsafe-argument */
  import { drizzle } from 'drizzle-orm/node-postgres';
  import { Pool } from 'pg';
  import { env } from '@/env';
  import * as schema from './schema';

  export const pool = new Pool({ connectionString: env.DATABASE_URL });
  export const db = drizzle(pool, { schema });
  ```

- [ ] T042 Generate the initial migration. From `ZONITE_BE/`, run `pnpm db:generate`. Verify a file like `src/db/migrations/0000_xxxx.sql` appears with `CREATE TABLE users (...)` and the index. Commit both the SQL and the `meta/` journal files produced by drizzle-kit.
- [ ] T043 Apply the migration to the Phase-0 Postgres. From repo root: `docker compose up -d postgres` then from `ZONITE_BE/` run `pnpm db:push`. Verify via `psql "$DATABASE_URL" -c '\d users'` that all nine columns exist with the correct types (matches data-model.md §1 table). If this is the exit check for SC-011, screenshot the `psql` output for the PR.

**Checkpoint**: Foundation ready. Every user-story phase can now start.

---

## Phase 3: User Story 1 — Bootstrap a production-shaped backend (Priority: P1) 🎯 MVP

**Goal**: Backend boots, `/api/health` returns the shared envelope, docs portal mounts at `/api/docs`, env validation fails fast on missing vars, DB unreachable fails fast, all logs identify Zonite.

**Independent Test**: Run `pnpm start:dev` with a valid `.env` and the Postgres service up. `curl /api/health` returns `{"code":200,"success":true,"data":{"status":"ok", ...},"timestamp":"..."}`. Delete `JWT_ACCESS_SECRET` → process exits non-zero within 2 s with a named cause. Stop Postgres → process exits non-zero with a named cause.

### Implementation for User Story 1

- [ ] T044 [US1] Rewrite `ZONITE_BE/src/main.ts` end-to-end. Model after `SIKKA_SRC/main.ts`. Exact steps the bootstrap must perform in this order:
  1. `import "reflect-metadata";` at the top.
  2. Create app: `const app = await NestFactory.create<NestExpressApplication>(AppModule);`.
  3. Map `env.LOG_LEVEL` → Nest log levels with the `logLevelMap` from Sikka's `main.ts`; `app.useLogger(logLevelMap[env.LOG_LEVEL]);`.
  4. `app.set("trust proxy", true);` (reverse-proxy support, FR-004).
  5. `app.setGlobalPrefix("api");`.
  6. `app.use(cookieParser(env.COOKIE_SECRET));` — reads `COOKIE_SECRET` from env (FR-005).
  7. `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));` (FR-009).
  8. `app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));` (FR-007).
  9. CORS: `app.enableCors({ origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : "*", credentials: true, methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"], allowedHeaders: ["Content-Type","Authorization","X-Device-Info"] });`.
  10. Scalar docs: build a Swagger document with `new DocumentBuilder().setTitle("Zonite API").setDescription("Zonite backend — real-time block-claiming game").setVersion("0.1.0").addBearerAuth().build();`, then `app.use("/api/docs", apiReference({ theme: "kepler", defaultHttpClient: { targetKey: "js", clientKey: "axios" }, spec: { content: document } }));`. No env gate per Clarification 4.
  11. DB startup probe (FR-016a, research §6): `await pool.query("SELECT 1").catch(err => { console.error(\`[startup] database unreachable: host=${hostFromUrl(env.DATABASE_URL)} database=${dbFromUrl(env.DATABASE_URL)}\`); process.exit(1); });` — helper regex inside the file, not a new module.
  12. `await app.listen(env.PORT, "0.0.0.0");`.
  13. Startup log lines (FR-001): port, resolved environment, log level, docs URL — mirror Sikka's four `console.log` statements.
      Wrap everything in a `bootstrap()` async function; call `void bootstrap();` at EOF.
- [ ] T045 [US1] Rewrite `ZONITE_BE/src/app.module.ts`. Imports in order: `ConfigModule` (from `@nestjs/config`, optional — can skip since env.ts handles parsing; prefer skipping), `ThrottlerModule.forRoot([{ ttl: env.THROTTLE_GLOBAL_TTL * 1000, limit: env.THROTTLE_GLOBAL_LIMIT }])`, a DB module (see T046), `HealthModule`, `AuthModule` (wired in US4 — import is kept commented for now: `// import { AuthModule } from "./modules/auth/auth.module";`). Providers: `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. Do NOT yet register a global `JwtAuthGuard` — US4 will add it.
- [ ] T046 [US1] Create `ZONITE_BE/src/db/db.module.ts` — a minimal `@Global()` Nest module that exposes the `db` and `pool` from `@/db` as providers so modules can `@Inject("DB")` them. Skeleton:
  ```ts
  import { Global, Module } from '@nestjs/common';
  import { db, pool } from '.';
  @Global()
  @Module({
    providers: [
      { provide: 'DB', useValue: db },
      { provide: 'DB_POOL', useValue: pool },
    ],
    exports: ['DB', 'DB_POOL'],
  })
  export class DbModule {}
  ```
  Then add `DbModule` to `AppModule.imports` (update T045).
- [ ] T047 [US1] Refactor `ZONITE_BE/src/modules/health/services/health.service.ts` to compute `{ status: "ok", uptime: process.uptime(), environment: env.NODE_ENV }` (FR-020, matches `contracts/health.openapi.yaml`). Import `env` from `@/env`.
- [ ] T048 [US1] Refactor `ZONITE_BE/src/modules/health/controllers/health.controller.ts` to wrap the service result in `successResponse(data, "Health OK")` from `@/utils`. Controller must be annotated with `@ApiTags("health")` from `@nestjs/swagger` and the existing `@HealthCheckEndpoint()` decorator (preserve). The return type must be `SuccessResponse<HealthCheckResult>` where `HealthCheckResult` is defined in `dto/health-response.dto.ts`.
- [ ] T049 [US1] Update `ZONITE_BE/src/modules/health/dto/health-response.dto.ts` so the exported type is `{ status: "ok"; uptime: number; environment: "development" | "production" }`. Preserve the existing barrel in `dto/index.ts`.
- [ ] T050 [US1] Update `ZONITE_BE/src/modules/health/decorators/health-check-endpoint.decorator.ts` so `@ApiOkResponse({ schema: { $ref: "#/components/schemas/EnvelopeHealth" } })` (or equivalent inline schema) documents the wrapped envelope shape — so the docs portal reflects the real body shape.
- [ ] T051 [US1] Smoke-test locally. From repo root: `docker compose up -d postgres`. From `ZONITE_BE/`: `pnpm start:dev`. Verify:
  - Startup logs print port/env/log-level/docs URL (FR-001).
  - `curl http://localhost:3000/api/health` returns 200 with envelope (`code`, `success: true`, `message`, `data: { status, uptime, environment }`, `timestamp`).
  - Visit `http://localhost:3000/api/docs` — Scalar portal renders with the "health" tag.
- [ ] T052 [US1] Fail-fast smoke tests (SC-004, Clarification 2):
  - `unset JWT_ACCESS_SECRET && pnpm start:dev` → exits ≤ 2 s with a zod-field-errors log that names `JWT_ACCESS_SECRET`. Restore the env.
  - `docker compose stop postgres && pnpm start:dev` → exits with `[startup] database unreachable: host=... database=...`. Restart Postgres.
- [ ] T053 [US1] Commit: `feat(backend): US1 — Sikka-shaped bootstrap, envelope on /api/health, Scalar docs at /api/docs`.

**Checkpoint**: US1 independently functional.

---

## Phase 4: User Story 2 — Add a new endpoint without inventing patterns (Priority: P1)

**Goal**: The health module is the living reference template. Copying it to a new folder + registering in `AppModule` produces a working, envelope-conformant, docs-registered endpoint in <15 minutes with zero edits to shared/common code.

**Independent Test**: Copy `modules/health` to `modules/_scratch`, rename class symbols, register in `AppModule`, restart — new endpoint appears in docs + returns envelope.

### Implementation for User Story 2

- [ ] T054 [US2] Write `docs/speks/sikka-backend-architecture.md` (the Spekit source-of-truth will import this when Topic URL is known). Structure:
  - Overview: vendoring model, Sikka commit SHA pin (TODO: add SHA when available).
  - Folder structure diagram (copy from `plan.md`'s "Project Structure — apps/backend").
  - Recipe "add a new feature module" — 5 numbered steps with exact file skeletons for controller + service + dto + module + decorator (copied from health module with placeholder names `<Module>`/`<Operation>`).
  - Mention: no edits to `common/`, `utils/`, `types/`, `constants/` needed.
- [ ] T055 [US2] Dry-run the recipe from T054. Create `ZONITE_BE/src/modules/_scratch/` with `_scratch.module.ts`, `controllers/_scratch.controller.ts`, `services/_scratch.service.ts`, `dto/_scratch-response.dto.ts`, `decorators/_scratch-get-endpoint.decorator.ts` — all copied from the health module with `Health`→`Scratch` renames. Controller exposes `GET /api/_scratch` returning `successResponse({ hello: "world" })`.
- [ ] T056 [US2] Register `_scratch` in `AppModule.imports` alongside `HealthModule`. Restart `pnpm start:dev`. Verify `curl /api/_scratch` returns the envelope AND the endpoint appears in `/api/docs`. Time the round-trip from `cp -r` to curl-passing — must be ≤ 15 min (SC-003).
- [ ] T057 [US2] Delete `ZONITE_BE/src/modules/_scratch/` and remove its import from `AppModule` — the verification is complete; the Spek is the permanent artifact.
- [ ] T058 [US2] Commit: `docs(backend): US2 — Sikka module recipe spek (docs/speks/sikka-backend-architecture.md)`.

**Checkpoint**: US2 verified; reference template documented.

---

## Phase 5: User Story 3 — Frontend consumes a predictable, documented API (Priority: P1)

**Goal**: Every endpoint's docs schema matches its runtime response. Bearer-auth affordance works in the docs portal. Every success envelope is identical in key order and shape.

**Independent Test**: Frontend engineer opens `/api/docs`, picks any endpoint, tries it via the "Authorize → Execute" flow, and the response matches the schema.

### Implementation for User Story 3

- [ ] T059 [US3] In `ZONITE_BE/src/main.ts`'s `DocumentBuilder` (T044 step 10), ensure `.addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "bearerAuth")` is called so the docs portal offers the "Authorize" dialog.
- [ ] T060 [US3] Add an `ApiExtraModels` decorator and/or `@ApiResponse` blocks on the health controller so the generated OpenAPI embeds the `SuccessResponse<HealthCheckResult>` shape (not just the inner data). This is the pattern future modules follow.
- [ ] T061 [US3] Create `ZONITE_BE/test/envelope.assert.ts` — the helper from `contracts/http-envelope.md` "Tests" section. This is imported by the e2e (T084) but lives at test/ root so non-e2e smoke scripts can use it too.
- [ ] T062 [US3] Write a one-shot verification script at `ZONITE_BE/scripts/verify-envelope.ts` that:
  1. Parses the Swagger JSON from `http://localhost:3000/api-json` (NestJS Swagger default) or from the Scalar endpoint.
  2. Lists every registered route.
  3. Hits each public route (health) and runs `assertEnvelope` on the response.
     Register it in `ZONITE_BE/package.json` scripts as `"verify:envelope": "ts-node scripts/verify-envelope.ts"`. Run once; expected: 1 route (health) passes. SC-002 gate.
- [ ] T063 [US3] Commit: `feat(backend): US3 — docs portal Bearer-auth, envelope verifier script`.

**Checkpoint**: US3 demonstrated; verifier ready to re-run after US4 lands the auth endpoints.

---

## Phase 6: User Story 4 — Full Sikka auth suite live end-to-end (Priority: P1)

**Goal**: Register → login → call a protected route → refresh → forgot-password (real email) → reset-password works end-to-end against Zonite URLs. `users` table lives. Rate-limiter trips on repeated login/forgot attempts. All responses envelope-conformant.

**Independent Test**: Run the curl sequence from `quickstart.md` §5 against a fresh DB. Every response passes `assertEnvelope`. The `MAIL_TRANSPORT=console` backend log prints the reset OTP.

### Email service (foundational for US4)

- [ ] T064 [US4] Create `ZONITE_BE/src/common/services/email.service.ts`. Exposes an `EmailService` class with the `sendPasswordResetOtp(to: string, otp: string, ttlSeconds: number)` method. Transport is selected at constructor time from `env.MAIL_TRANSPORT`:
  - `"console"` → `nodemailer.createTransport({ streamTransport: true, newline: "unix", buffer: true })` and on send, log `[email] To: ${to}  OTP: ${otp}  TTL: ${ttlSeconds}s` via Nest Logger.
  - `"stream"` → same as console but pushes into an exported `capturedEmails: Array<{to, body}>` buffer (for e2e test access, see T084).
  - `"smtp"` → `nodemailer.createTransport({ host, port, auth: { user, pass } })` from env.
    The service is registered in its own `CommonServicesModule` (create `ZONITE_BE/src/common/services/common-services.module.ts`) and exported, then imported by `AuthModule`.
- [ ] T065 [US4] Create `ZONITE_BE/src/common/services/index.ts`: `export * from "./email.service"; export * from "./common-services.module";`.

### Auth module — types & DTOs (copy from Sikka, trim)

- [ ] T066 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/signup.dto.ts` to `ZONITE_BE/src/modules/auth/dto/signup.dto.ts`. Trim to the Zonite-required fields: `email: string` + `password: string` with validators `@IsEmail()`, `@MinLength(8)`, `@MaxLength(128)`, `Matches(/[A-Za-z]/)`, `Matches(/[0-9]/)`. Drop any Sikka-specific profile fields.
- [ ] T067 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/login.dto.ts` to `ZONITE_BE/src/modules/auth/dto/login.dto.ts` verbatim (email + password).
- [ ] T068 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/refresh-token.dto.ts` verbatim — optional `refreshToken?: string` field.
- [ ] T069 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/logout.dto.ts` and `logout-cookie.dto.ts` verbatim.
- [ ] T070 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/send-otp.dto.ts` verbatim — `email: string`.
- [ ] T071 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/verify-otp.dto.ts` verbatim — `email + otp (6-digit)`.
- [ ] T072 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/reset-password.dto.ts` verbatim — `email + otp + newPassword`.
- [ ] T073 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/change-password.dto.ts` verbatim.
- [ ] T074 [P] [US4] Copy `SIKKA_SRC/modules/auth/dto/auth-response.dto.ts` and `auth-response.interface.ts`. **Replace** the response shape with `AuthTokens` from `@zonite/shared`: `export class AuthResponseDto implements AuthTokens { ... }`. Drop Sikka's richer profile fields.
- [ ] T075 [P] [US4] Create `ZONITE_BE/src/modules/auth/dto/index.ts` barrel — one `export *` per dto file. Skip Sikka's `admin-*`, `setup-profile`, `resend-otp`, `sessions`, `response-wrapper` files (out of scope per plan.md Scale/Scope section).

### Auth module — endpoint decorators

- [ ] T076 [P] [US4] Copy these Sikka auth endpoint decorators verbatim to `ZONITE_BE/src/modules/auth/decorators/`:
  - `signup-endpoint.decorator.ts`
  - `login-endpoint.decorator.ts`
  - `logout-endpoint.decorator.ts`
  - `refresh-token-endpoint.decorator.ts`
  - `send-otp-endpoint.decorator.ts`
  - `verify-otp-endpoint.decorator.ts`
  - `reset-password-endpoint.decorator.ts`
  - `change-password-endpoint.decorator.ts`
    If any decorator references a response DTO renamed in T074 (`AuthResponseDto`), update the `@ApiOkResponse({ type: ... })` reference accordingly.
- [ ] T077 [P] [US4] Create `ZONITE_BE/src/modules/auth/decorators/index.ts` — barrel re-exporting all 8 decorators.

### Auth module — service (Zonite-adjusted)

- [ ] T078 [US4] Copy `SIKKA_SRC/modules/auth/services/auth.service.ts` to `ZONITE_BE/src/modules/auth/services/auth.service.ts`. **Adjustments** (apply in order, do not merge):
  1. Imports: keep `@/db`, `@/env`, `bcrypt`, `@nestjs/jwt`, `JwtService`. Replace imports of any Sikka-specific schema other than `users` — if the file references `@/db/schema/userProfile` or `@/db/schema/authSessions`, strip those code paths (Zonite doesn't ship those tables).
  2. Password hashing: use `env.BCRYPT_ROUNDS`.
  3. `signup({ email, password })`:
     - Lowercase email.
     - Check uniqueness: `db.select().from(users).where(eq(users.email, email))` — if row exists, throw `ConflictException`.
     - Insert `{ email, passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS), role: "user" }`.
     - Call `issueTokens(user)` (helper below) and return `AuthTokens`.
  4. `login({ email, password })`: lookup, `bcrypt.compare`, `UnauthorizedException` on mismatch, issue tokens.
  5. `refresh({ refreshToken })`: verify JWT, look up user, check `payload.jti === user.refreshTokenNonce`. If mismatched → `UnauthorizedException`. Issue new access token (keep same refresh or rotate — Phase 2 keeps same).
  6. `logout()`: no DB write; caller clears the cookie.
  7. `requestPasswordReset({ email })`: look up user. **If not found**, return `{ accepted: true }` silently (enumeration mitigation, research §13). If found: generate a 6-digit OTP (`Math.floor(100000 + Math.random() * 900000).toString()` — use `crypto.randomInt(100000, 1000000)` for cryptographic grade), `bcrypt.hash` it, store in `reset_otp_hash`, set `reset_otp_expires_at = now() + env.JWT_RESET_PASSWORD_EXPIRES_IN sec`, then call `emailService.sendPasswordResetOtp(email, otp, env.JWT_RESET_PASSWORD_EXPIRES_IN)`. Return `{ accepted: true }` either way.
  8. `verifyOtp({ email, otp })`: look up user, check `bcrypt.compare(otp, user.resetOtpHash)` AND `otpExpiresAt > now()`. Throw `BadRequestException` otherwise.
  9. `resetPassword({ email, otp, newPassword })`: verify OTP (reuse step 8 logic), then update `passwordHash = bcrypt.hash(newPassword)`, **rotate** `refreshTokenNonce = crypto.randomUUID()` (FR-011e), clear `resetOtpHash` + `otpExpiresAt`. Commit in a single Drizzle transaction.
  10. `changePassword(userId, { currentPassword, newPassword })`: verify `currentPassword` via `bcrypt.compare`, then same rotation + update as step 9.
  11. `issueTokens(user)`: sign access token with `{ sub, email, role }`, sign refresh token with `{ sub, jti: user.refreshTokenNonce ?? (await rotateNonce()) }`. Return `AuthTokens`.
  12. All throwing paths produce `HttpException` subclasses so the global filter formats them into envelopes.
- [ ] T079 [US4] Create `ZONITE_BE/src/modules/auth/services/index.ts`: `export * from "./auth.service";`.

### Auth module — controller

- [ ] T080 [US4] Copy `SIKKA_SRC/modules/auth/controllers/auth.controller.ts` to `ZONITE_BE/src/modules/auth/controllers/auth.controller.ts`. **Adjustments**:
  1. Route prefix: `@Controller("auth")` — under `/api` global, this yields `/api/auth/*`.
  2. Keep only these endpoints (drop admin + session + setup-profile + resend-otp):
     - `POST signup` (`@SignupEndpoint()`, body `SignupDto`): calls `authService.signup`, sets refresh cookie, returns `successResponse(tokens, "Signed up", 201)`.
     - `POST login` (`@LoginEndpoint()`, body `LoginDto`): calls `login`, sets cookie, `successResponse(tokens, "Logged in")`.
     - `POST refresh` (`@RefreshTokenEndpoint()`, body `RefreshTokenDto`): accepts either cookie (via `@Req()`) or body token; calls `refresh`; rotates cookie; `successResponse(tokens, "Refreshed")`.
     - `POST logout` (`@LogoutEndpoint()`): clears the cookie via `res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/auth" })`; `successResponse(null, "Logged out")`.
     - `POST send-otp` (`@SendOtpEndpoint()`, body `SendOtpDto`): `authService.requestPasswordReset`; `successResponse(null, "If the email exists, a reset OTP was sent")`.
     - `POST verify-otp` (`@VerifyOtpEndpoint()`, body `VerifyOtpDto`): `verifyOtp`; `successResponse(null, "OTP valid")`.
     - `POST reset-password` (`@ResetPasswordEndpoint()`, body `ResetPasswordDto`): `resetPassword`; `successResponse(null, "Password updated")`.
     - `POST change-password` (`@ChangePasswordEndpoint()`, authenticated via `@CurrentUser()`, body `ChangePasswordDto`): `changePassword`; `successResponse(null, "Password updated")`.
  3. Rate-limit: add `@Throttle({ auth: { limit: env.THROTTLE_AUTH_LIMIT, ttl: env.THROTTLE_AUTH_TTL * 1000 } })` to `signup`, `login`, `send-otp`, `reset-password` handlers (research §7, contracts/rate-limit.md).
- [ ] T081 [US4] Create `ZONITE_BE/src/modules/auth/controllers/index.ts`: `export * from "./auth.controller";`.

### Auth module — module definition

- [ ] T082 [US4] Copy `SIKKA_SRC/modules/auth/auth.module.ts` to `ZONITE_BE/src/modules/auth/auth.module.ts`. **Adjust**:
  - Imports: `JwtModule.register({})` (secrets are passed per-sign-call), `PassportModule`, `DbModule`, `CommonServicesModule` (T064).
  - Providers: `AuthService`, `AccessTokenStrategy`, `RefreshTokenStrategy`, `RefreshTokenCookieStrategy`, and register a `{ provide: APP_GUARD, useClass: JwtAuthGuard }` **here** (not in AppModule) so the guard is applied globally and respects `@Public()`. The `AllExceptionsFilter` already lives globally from T044.
  - Controllers: `AuthController`.
- [ ] T083 [US4] Wire `AuthModule` into `AppModule.imports` — uncomment the import added in T045.

### Auth e2e test (SC-010)

- [ ] T084 [US4] Create `ZONITE_BE/test/auth.e2e-spec.ts` per quickstart.md §5. The test suite MUST:
  1. Use `@nestjs/testing` to build the app with the real `AppModule`, override `MAIL_TRANSPORT` to `"stream"` via a `ConfigService` mock or direct env mutation, start the HTTP server via `supertest`.
  2. Import the `assertEnvelope` helper from `test/envelope.assert.ts` (T061).
  3. Run these steps in a single `describe("Auth loop", () => { it("completes the full flow", ...) })`:
     - POST `/api/auth/signup` with `{email: "alice@example.com", password: "hunter2pass"}`. Expect 201. `assertEnvelope(res)`. `expect(res.body.data.accessToken).toBeTruthy()`.
     - POST `/api/auth/login` with the same creds. Expect 200. Capture `accessToken` + `Set-Cookie` header.
     - GET `/api/health` with `Authorization: Bearer ${accessToken}` — currently health is public, so this is just a smoke; once US4 lands the global JwtAuthGuard, `@Public()` on health controller keeps it reachable — verify that still works.
     - (Add a temporary protected test route OR reuse `GET /api/auth/me` if Sikka ships one; if neither, skip this sub-step with a TODO).
     - POST `/api/auth/refresh` with the captured cookie. Expect 200, new access token differs.
     - POST `/api/auth/send-otp` with `{email: "alice@example.com"}`. Expect 200. Pull OTP from `EmailService.capturedEmails[0].body` (the stream transport's outbox).
     - POST `/api/auth/reset-password` with `{email, otp, newPassword: "new-hunter2"}`. Expect 200.
     - POST `/api/auth/login` with the new password. Expect 200. POST with the OLD password — expect 401 with envelope.
  4. Every `expect`-style assertion is paired with `assertEnvelope(res)`.
  5. `beforeAll`: run `db:push` against a _test_ DATABASE_URL (document in comment: export `DATABASE_URL=postgres://zonite:zonite@localhost:5432/zonite_test` before the test run). `afterAll`: `TRUNCATE users` or drop the row.
- [ ] T085 [US4] Run `pnpm test:e2e` from `ZONITE_BE/`. Expected: 1 test file, 1 test, pass. Fix any failure before T087.

### Rate-limit verification

- [ ] T086 [US4] Manual rate-limit sweep (SC-012). With the backend running and a valid user in `users`:
  - Fire 10 logins with wrong password in <5 s (bash loop from quickstart §8). Verify: first ~5 return 401 (envelope, `error: "unauthorized"`); remainder return 429 (envelope, `error: "rate_limited"`, `Retry-After` header present).
  - Fire 150 health requests in <60 s. Verify: first 100 succeed, then 429. Reset after 60 s.
- [ ] T087 [US4] Commit: `feat(backend): US4 — full Sikka auth suite live (signup/login/refresh/logout/otp/reset/change), email wired, auth-tier throttle, e2e passing`.

**Checkpoint**: US4 complete — the full auth loop runs end-to-end with envelope conformance and rate-limiting.

---

## Phase 7: User Story 5 — Architecture documented in Spekit (Priority: P2)

**Goal**: Five Speks written and linked from the repo. A new engineer can onboard from these alone.

**Independent Test**: Hand a new engineer the 5 markdown files (they're stubbed in `docs/speks/` until the Spekit Topic URL is provisioned). They successfully add a new module without asking a human.

### Implementation for User Story 5

- [ ] T088 [P] [US5] Write `docs/speks/sikka-backend-architecture.md` if not already landed in T054. This is the canonical "Sikka backend architecture rules (Zonite variant)" Spek — include vendoring policy, Sikka commit SHA (TODO placeholder), folder map, the `common/filters/` deviation from plan.md Complexity Tracking, and a link to the source Sikka repo path.
- [ ] T089 [P] [US5] Write `docs/speks/extend-a-module-safely.md` — the "How to extend a module safely" Spek. 5-step recipe with copy-paste skeletons; a checklist of files to edit; an explicit list of files **not** to edit (`common/`, `utils/`, `types/`, `constants/` unless adding a new cross-cutting primitive — which itself requires a new Spek).
- [ ] T090 [P] [US5] Write `docs/speks/env-reference.md` — the "Environment variables reference (Zonite)" Spek. One row per env var: name, required?, default, description, produced-by (Phase), consumed-by (modules). Generate by scanning `ZONITE_BE/src/env.ts` (T019). Keep `.env.example` and this Spek in lockstep — add a comment at the top of both noting the other.
- [ ] T091 [P] [US5] Write `docs/speks/response-envelope.md` — the "Response envelope and error shape" Spek. Full envelope reference from `contracts/http-envelope.md`, the enumeration of `error` category values, the `assertEnvelope` helper, and the "never return a raw object" rule.
- [ ] T092 [P] [US5] Write `docs/speks/api-docs-portal.md` — the "API documentation portal — how to add a new endpoint" Spek. Shows the `@ApiTags`, `@ApiResponse`, `@ApiBearerAuth` decorators on the reference health and auth controllers; explains the Scalar config; links to the live `/api/docs` URL.
- [ ] T093 [US5] Update the root `README.md` — under a "Docs" section, add links to all 5 files under `docs/speks/`. Also link to `specs/004-backend-foundation/` so engineers can trace back to the plan.
- [ ] T094 [US5] Commit: `docs: US5 — five Phase-2 Speks in docs/speks/, linked from README`.

**Checkpoint**: US5 complete. All 5 user stories done.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story verifications, CI integration, structural diff, phase-exit sign-off.

- [ ] T095 [P] Run the full quickstart §10 exit checklist. Mark each SC as ✅ or ❌ in a PR comment; fix the ❌s before sign-off.
- [ ] T096 [P] Run the structural diff against Sikka (SC-008):
  ```bash
  diff -qr <(cd ZONITE_BE/src && find . -type d | sort) \
          <(cd SIKKA_SRC && find . -type d -not -path "./modules/trips*" -not -path "./modules/upload*" -not -path "./modules/profile*" -not -path "./db/schema*" -not -path "./db/seeds" -not -path "./db/migrations" | sort)
  ```
  (Adjust excludes to Sikka-domain folders Zonite doesn't vendor). Expected output: the only reported diff is the `common/filters/` addition (documented in plan.md Complexity Tracking) plus Zonite-specific modules. Save the output as `specs/004-backend-foundation/artifacts/sikka-structure-diff.txt`.
- [ ] T097 [P] Add CI integration — augment `.github/workflows/ci.yml` (or the existing workflow) to run, after existing steps: `pnpm --filter @zonite/backend type-check`, `pnpm --filter @zonite/backend lint`, `pnpm --filter @zonite/backend build`, `pnpm --filter @zonite/backend test:e2e` (behind a service container for Postgres — GitHub Actions `services: postgres: ...`). Gate PR merge on all four.
- [ ] T098 [P] Synthetic error sweep (SC-006). Write `ZONITE_BE/scripts/error-sweep.ts` that triggers a 400 (POST /auth/signup with `{}`), 401 (GET /api/auth/change-password without token), 404 (GET /api/does-not-exist), 409 (double-signup same email), 422 (POST /auth/signup with `{"email":"bad","password":"x"}`), 500 (temporarily throw inside a handler — revert after). For each response, assert: `success === false`, envelope keys present, no `stack` anywhere in body, `error` category matches the list in `contracts/http-envelope.md`.
- [ ] T099 Update `CLAUDE.md` at repo root — the agent-context script already added the DB/language rows in T040. Manually add under "Recent Changes" a line summarizing Phase 2: `004-backend-foundation: full Sikka parity backend — Drizzle+pg users schema, Zod env, global envelope, Scalar docs, full auth suite (signup/login/refresh/logout/otp/reset), global throttler + auth-tier override, AllExceptionsFilter, EmailService (console/stream/smtp).`
- [ ] T100 Run `pnpm type-check && pnpm lint` at repo root. Zero errors/warnings. Fix before phase exit.
- [ ] T101 Final PR. Title: `Phase 2: Backend foundation (Sikka parity + live auth)`. Body: link each SC from `spec.md` to its verification artifact (screenshot, test output, script output). Request review citing Constitution Principles I, II, V.
- [ ] T102 After merge, tag the commit `phase-2-backend-foundation` so Phase 3 can reference a stable base.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. **BLOCKS every user story.**
- **Phase 3 (US1 Bootstrap)**: Depends on Phase 2.
- **Phase 4 (US2 Ergonomics)**: Depends on Phase 3 (needs a live reference module).
- **Phase 5 (US3 Frontend predictability)**: Depends on Phase 3 (docs portal must be mounted).
- **Phase 6 (US4 Auth suite)**: Depends on Phase 3 (needs bootstrap wiring) + Phase 2 (needs users schema, DB, env, common primitives).
- **Phase 7 (US5 Speks)**: Depends on Phase 3–6 content existing (the Speks describe them).
- **Phase 8 (Polish)**: Depends on everything.

### User Story Dependencies

- **US1** (P1): Phase 2 complete.
- **US2** (P1): US1 complete (needs a live module to copy from).
- **US3** (P1): US1 complete (needs docs portal).
- **US4** (P1): Phase 2 complete. Can run **in parallel** with US2/US3 once US1 is done.
- **US5** (P2): All implementation complete (the Speks document reality, not aspiration).

### Parallel Opportunities

- Phase 1: T002, T005, T006, T008, T009 all [P] — run simultaneously.
- Phase 2 shared package (T011–T016) all [P] — five files, no dependencies.
- Phase 2 common primitives: T027, T030–T032, T034, T036 all [P] — independent file copies.
- Phase 6 auth DTOs (T066–T074) all [P] — nine independent file copies.
- Phase 6 endpoint decorators (T076) can be split — each decorator is an independent file.
- Phase 7 Speks (T088–T092) all [P] — five independent markdown files.
- Phase 8 verifications (T095–T098) all [P] — all run in isolation.

---

## Parallel Example: User Story 4 DTO copy batch

```bash
# All nine DTO copies can be farmed out to parallel workers:
Task: T066 — signup.dto.ts
Task: T067 — login.dto.ts
Task: T068 — refresh-token.dto.ts
Task: T069 — logout.dto.ts + logout-cookie.dto.ts
Task: T070 — send-otp.dto.ts
Task: T071 — verify-otp.dto.ts
Task: T072 — reset-password.dto.ts
Task: T073 — change-password.dto.ts
Task: T074 — auth-response.dto.ts + auth-response.interface.ts
# Then T075 (barrel) after all nine are done.
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1: Setup (T001–T010).
2. Phase 2: Foundational (T011–T043).
3. Phase 3: US1 (T044–T053).
4. **STOP and VALIDATE**: `/api/health` envelope-conformant; Scalar docs visible; env/DB fail-fast verified. This is already enough to demo "Sikka-shaped backend running" internally.

### Incremental Delivery

1. MVP (US1) → demo.
2. US2 (Spek + dry-run) → developer ergonomics proven. Demo = 15-min module-add recording.
3. US3 (Scalar bearer + envelope verifier) → demo = frontend teammate navigating docs portal.
4. US4 (auth suite) → **the big one**. Demo = curl walkthrough from quickstart §5.
5. US5 (Speks) → demo = pasting the 5 markdown files into Spekit Topic when URL is provisioned.
6. Polish (CI, diff, exit checklist) → PR ready.

### Parallel Team Strategy

With two developers, after Phase 2 completes:

- **Dev A**: US1 → US3 (bootstrap + docs polish; tight coupling, same developer).
- **Dev B**: US4 (auth suite; large self-contained block once foundational primitives land).
- Merge points: `AppModule` is touched by both (T045 + T083) — coordinate by having Dev A finish T045 before Dev B starts T083.
- US2 + US5 are docs-heavy; either developer picks them up between merges.

### Where a cheaper model should struggle — escalate to a senior

- T025 (`AllExceptionsFilter`) — branching logic on exception types; review the output carefully.
- T044 (`main.ts` rewrite) — the step ordering matters; deviations break cookie/CORS/docs wiring.
- T078 (`auth.service.ts` adjustments) — the 12 numbered sub-steps are the service's correctness contract; a cheap model may skip step 7 (enumeration mitigation) or step 9 (nonce rotation). Review both diffs specifically.
- T084 (auth e2e) — test setup and teardown are subtle; a cheap model should run it until green with visible logs, not mark it done on "compiles".

---

## Notes

- Every task has an exact file path. A task without a path is a bug in this file — report it.
- `[P]` is a permission to parallelize, not an obligation. A cheap model running serially is fine.
- Commit after each phase boundary at minimum (T010, T043, T053, T058, T063, T087, T094, T102).
- `-no-verify` on commits is forbidden (constitution Workflow gate). If pre-commit fails, fix the code, not the hook.
- When in doubt about a Sikka file detail not documented here, **read the Sikka file directly** — that repo is the source of truth for parity decisions.

---

## Task count summary

- Phase 1 (Setup): 10 tasks
- Phase 2 (Foundational): 33 tasks (T011–T043)
- Phase 3 (US1 Bootstrap): 10 tasks (T044–T053)
- Phase 4 (US2 Ergonomics): 5 tasks (T054–T058)
- Phase 5 (US3 Frontend-ready): 5 tasks (T059–T063)
- Phase 6 (US4 Auth suite): 24 tasks (T064–T087)
- Phase 7 (US5 Speks): 7 tasks (T088–T094)
- Phase 8 (Polish): 8 tasks (T095–T102)

**Total: 102 tasks**

Each task is scoped for ≤30 min of focused work by a cheaper model; the four flagged-as-tricky tasks (T025, T044, T078, T084) may need ~60 min plus a review round.
