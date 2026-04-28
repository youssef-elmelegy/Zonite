---
description: 'Task list for Phase 0 — Foundation & Project Setup'
---

# Tasks: Foundation & Project Setup (Phase 0)

**Input**: Design documents from `/specs/001-foundation-setup/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Out of scope for Phase 0 per spec Clarification #4 — no test tasks are
generated. The first later phase that writes a test installs Jest/Vitest/Supertest.

**Organization**: Tasks are grouped by the four user stories from `spec.md` so each
story stays independently completable and testable.

---

## How to use this file (instructions for the implementing agent)

You are implementing Zonite Phase 0 — a pnpm monorepo scaffold. **Every decision in
this file is already locked** by the spec, plan, research, and constitution. Do NOT
invent structure, rename files, pick different tools, or "improve" designs. When a
task says "write file X with content Y," copy Y verbatim.

**Ground rules**:

1. **Work from the repo root**: `/media/jo/store/youssef/projects/yal-gaming/zonite`.
   All file paths below are relative to that root.
2. **Follow tasks in order** within a phase. Tasks marked `[P]` may be done in
   parallel because they touch different files and have no dependencies on unfinished
   work in the same phase.
3. **Do not skip a task** because it looks trivial. The scaffolding tasks are what
   make the whole thing bootable.
4. **Check each task off** (`- [x]`) immediately after completing it, and commit in
   small groups. A reasonable cadence is: one commit per completed sub-section
   (e.g., all of "Root workspace config", all of "Backend scaffolding").
5. **If a command fails**, do not improvise a fix. Read the error, re-check the task,
   and if still stuck, stop and flag the issue — do NOT silently change the design.
6. **Authoritative references** when a task is unclear:
   - Spec: [`spec.md`](./spec.md)
   - Plan: [`plan.md`](./plan.md)
   - Research: [`research.md`](./research.md)
   - Data model: [`data-model.md`](./data-model.md)
   - Contracts: [`contracts/`](./contracts/)
   - Quickstart (acceptance script): [`quickstart.md`](./quickstart.md)
   - Constitution: [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md)
7. **File content blocks** in this document are the exact contents to write. When a
   block is missing and a task says "port from Sikka," the Sikka source file path is
   given — copy it verbatim.
8. **Never commit secrets**. `.env` must be in `.gitignore` before any commit.

**Target**: On completion, the acceptance script in [`quickstart.md`](./quickstart.md)
passes end-to-end from a clean clone.

---

## Format: `[ID] [P?] [Story] Description`

- `[P]`: Can run in parallel with other `[P]` tasks in the same phase
- `[US1]..[US4]`: Which user story this task belongs to (Setup/Foundational/Polish
  have no story label)
- File paths are absolute-from-repo-root

---

## Phase 1: Setup (Shared Infrastructure)

**Goal**: Create the empty repo skeleton, root-level config, and install dependencies.
After this phase, `pnpm install` succeeds but nothing runs yet.

- [ ] T001 Create the top-level directory layout by running from the repo root:

  ```bash
  mkdir -p apps/backend/src apps/frontend/src packages/shared/src \
           .github/workflows .husky
  ```

- [ ] T002 [P] Create `.nvmrc` at the repo root containing exactly:

  ```text
  22
  ```

- [ ] T003 [P] Create `.gitignore` at the repo root with this content:

  ```gitignore
  # dependencies
  node_modules/
  .pnpm-store/

  # builds
  dist/
  build/
  .next/
  .vite/
  .turbo/
  coverage/

  # env
  .env
  .env.*
  !.env.example

  # editor / os
  .DS_Store
  Thumbs.db
  .idea/
  .vscode/*
  !.vscode/extensions.json

  # logs
  npm-debug.log*
  yarn-debug.log*
  yarn-error.log*
  pnpm-debug.log*
  ```

- [ ] T004 [P] Create `.editorconfig` at the repo root with this content:

  ```editorconfig
  root = true

  [*]
  end_of_line = lf
  insert_final_newline = true
  charset = utf-8
  indent_style = space
  indent_size = 2
  trim_trailing_whitespace = true

  [*.md]
  trim_trailing_whitespace = false
  ```

- [ ] T005 [P] Create `.prettierrc` at the repo root with this content:

  ```json
  {
    "semi": true,
    "trailingComma": "all",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "arrowParens": "always",
    "endOfLine": "lf"
  }
  ```

- [ ] T006 Create `pnpm-workspace.yaml` at the repo root with this content:

  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```

- [ ] T007 Create `tsconfig.base.json` at the repo root with this content:

  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "lib": ["ES2022", "DOM", "DOM.Iterable"],
      "strict": true,
      "noImplicitAny": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "skipLibCheck": true,
      "resolveJsonModule": true,
      "isolatedModules": true,
      "baseUrl": ".",
      "paths": {
        "@zonite/shared": ["packages/shared/src/index.ts"],
        "@zonite/shared/*": ["packages/shared/src/*"]
      }
    }
  }
  ```

- [ ] T008 Create the root `package.json` with workspace scripts. File path:
      `package.json`. Content:

  ```json
  {
    "name": "zonite",
    "version": "0.0.0",
    "private": true,
    "packageManager": "pnpm@9.12.0",
    "engines": {
      "node": ">=22.0.0 <23.0.0",
      "pnpm": ">=9.0.0"
    },
    "scripts": {
      "dev": "docker compose up --build",
      "dev:down": "docker compose down",
      "type-check": "pnpm -r --parallel run type-check",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",
      "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",
      "prepare": "husky"
    },
    "devDependencies": {
      "@eslint/js": "^9.18.0",
      "@types/node": "^22.10.7",
      "eslint": "^9.18.0",
      "eslint-config-prettier": "^10.0.1",
      "eslint-plugin-prettier": "^5.2.2",
      "eslint-plugin-react": "^7.37.4",
      "eslint-plugin-react-hooks": "^5.1.0",
      "globals": "^16.0.0",
      "husky": "^9.1.7",
      "lint-staged": "^15.4.0",
      "prettier": "^3.4.2",
      "typescript": "~5.7.3",
      "typescript-eslint": "^8.21.0"
    }
  }
  ```

- [ ] T009 Create `eslint.config.mjs` at the repo root with this content (ESLint v9
      flat config with layered overrides for backend + frontend):

  ```js
  import js from '@eslint/js';
  import tseslint from 'typescript-eslint';
  import prettierPlugin from 'eslint-plugin-prettier';
  import prettierConfig from 'eslint-config-prettier';
  import reactPlugin from 'eslint-plugin-react';
  import reactHooksPlugin from 'eslint-plugin-react-hooks';
  import globals from 'globals';

  export default tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.turbo/**',
        '**/coverage/**',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.{ts,tsx}'],
      plugins: { prettier: prettierPlugin },
      rules: {
        ...prettierConfig.rules,
        'prettier/prettier': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
      },
    },
    {
      files: ['apps/backend/**/*.ts'],
      languageOptions: { globals: { ...globals.node } },
    },
    {
      files: ['apps/frontend/**/*.{ts,tsx}'],
      plugins: { react: reactPlugin, 'react-hooks': reactHooksPlugin },
      languageOptions: {
        globals: { ...globals.browser },
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
      settings: { react: { version: 'detect' } },
      rules: {
        ...reactPlugin.configs.recommended.rules,
        ...reactHooksPlugin.configs.recommended.rules,
        'react/react-in-jsx-scope': 'off',
      },
    },
    {
      files: ['packages/shared/**/*.ts'],
      languageOptions: { globals: {} },
    },
  );
  ```

- [ ] T010 Create `.lintstagedrc.js` at the repo root with this content:

  ```js
  export default {
    '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
    '*.{json,md,yml,yaml}': ['prettier --write'],
  };
  ```

- [ ] T011 From the repo root, run `pnpm install`. This creates `pnpm-lock.yaml` and
      the root `node_modules/`. Expected exit code: 0. If it fails with
      `ERR_PNPM_UNSUPPORTED_ENGINE`, your local Node is not 22.x — run `nvm use` (the
      `.nvmrc` pins Node 22) and retry.

---

**Checkpoint**: Setup complete. `pnpm install` works, but no workspace package has
source yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Goal**: Stand up `packages/shared` so both apps can consume it. This phase blocks
every user story: no backend or frontend code can import shared types until this
phase is done.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### 2.1 `packages/shared` package manifest + tsconfig

- [ ] T012 Create `packages/shared/package.json` with this content:

  ```json
  {
    "name": "@zonite/shared",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": {
      ".": {
        "types": "./src/index.ts",
        "default": "./src/index.ts"
      }
    },
    "scripts": {
      "type-check": "tsc --noEmit"
    }
  }
  ```

- [ ] T013 Create `packages/shared/tsconfig.json` with this content:
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "rootDir": "./src",
      "outDir": "./dist",
      "noEmit": true
    },
    "include": ["src/**/*.ts"]
  }
  ```

### 2.2 Shared enums (each in its own file — `[P]`)

- [ ] T014 [P] Create `packages/shared/src/enums/game-status.enum.ts`:

  ```ts
  export enum GameStatus {
    LOBBY = 'LOBBY',
    PLAYING = 'PLAYING',
    FINISHED = 'FINISHED',
  }
  ```

- [ ] T015 [P] Create `packages/shared/src/enums/game-mode.enum.ts`:

  ```ts
  export enum GameMode {
    SOLO = 'SOLO',
    TEAM = 'TEAM',
  }
  ```

- [ ] T016 [P] Create `packages/shared/src/enums/team-color.enum.ts`:
  ```ts
  export enum TeamColor {
    RED = 'RED',
    BLUE = 'BLUE',
    NONE = 'NONE',
  }
  ```

### 2.3 Shared event name constants (each in its own file — `[P]`)

- [ ] T017 [P] Create `packages/shared/src/events/game-events.enum.ts`:

  ```ts
  export const GameEvents = {
    GAME_STARTED: 'game_started',
    BLOCK_CLAIMED: 'block_claimed',
    GAME_TICK: 'game_tick',
    GAME_OVER: 'game_over',
    CLAIM_BLOCK: 'claim_block',
    START_GAME: 'start_game',
    REQUEST_STATE: 'request_state',
    EXCEPTION: 'exception',
  } as const;

  export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];
  ```

- [ ] T018 [P] Create `packages/shared/src/events/room-events.enum.ts`:

  ```ts
  export const RoomEvents = {
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    PLAYER_READY: 'player_ready',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    ROOM_STATE: 'room_state',
    ROOM_UPDATED: 'room_updated',
  } as const;

  export type RoomEventName = (typeof RoomEvents)[keyof typeof RoomEvents];
  ```

- [ ] T019 Create `packages/shared/src/events/index.ts` (barrel + union type). Depends
      on T017 and T018:
  ```ts
  export * from './game-events.enum';
  export * from './room-events.enum';
  import type { GameEventName } from './game-events.enum';
  import type { RoomEventName } from './room-events.enum';
  export type SocketEventName = GameEventName | RoomEventName;
  ```

### 2.4 Shared domain-type skeletons (each in its own file — `[P]`)

- [ ] T020 [P] Create `packages/shared/src/types/room-config.type.ts`:

  ```ts
  import { GameMode } from '../enums/game-mode.enum';

  export interface RoomConfig {
    /** SOLO or TEAM. Locked at room creation. */
    gameMode: GameMode;
    /** Grid width in blocks. min 5, max 50, default 20. */
    gridWidth: number;
    /** Grid height in blocks. min 5, max 50, default 20. */
    gridHeight: number;
    /** Round length in seconds. min 30, max 300, default 60. */
    durationSeconds: number;
    /** Maximum concurrent players. default 10. */
    maxPlayers: number;
  }
  ```

- [ ] T021 [P] Create `packages/shared/src/types/player.type.ts`:

  ```ts
  import { TeamColor } from '../enums/team-color.enum';

  export interface Player {
    /** Stable user id (UUID). */
    id: string;
    fullName: string;
    /** NONE in solo mode. */
    teamColor: TeamColor;
    score: number;
  }
  ```

- [ ] T022 [P] Create `packages/shared/src/types/block.type.ts`:

  ```ts
  import { TeamColor } from '../enums/team-color.enum';

  export interface Block {
    x: number;
    y: number;
    /** Player id that claimed this block, or null if unclaimed. */
    claimedBy: string | null;
    /** Team color of the claimer, or null if unclaimed. */
    teamColor: TeamColor | null;
  }
  ```

- [ ] T023 [P] Create `packages/shared/src/types/team.type.ts`:

  ```ts
  import { TeamColor } from '../enums/team-color.enum';

  export interface Team {
    /** RED or BLUE. NONE is a sentinel, never a real team. */
    color: TeamColor;
    score: number;
    playerIds: string[];
  }
  ```

- [ ] T024 [P] Create `packages/shared/src/types/game-state.type.ts`:

  ```ts
  import { GameStatus } from '../enums/game-status.enum';
  import type { Block } from './block.type';
  import type { Player } from './player.type';

  export interface GameState {
    roomId: string;
    status: GameStatus;
    /** 2D array indexed as grid[y][x]. */
    grid: Block[][];
    /** Keyed by player id. */
    players: Record<string, Player>;
    remainingSeconds: number;
    /** ISO-8601 timestamp, null until status === PLAYING. */
    startedAt: string | null;
  }
  ```

### 2.5 Shared barrel

- [ ] T025 Create `packages/shared/src/index.ts` (depends on T014–T024):

  ```ts
  export * from './enums/game-status.enum';
  export * from './enums/game-mode.enum';
  export * from './enums/team-color.enum';
  export * from './events';
  export * from './types/room-config.type';
  export * from './types/player.type';
  export * from './types/block.type';
  export * from './types/team.type';
  export * from './types/game-state.type';
  ```

- [ ] T026 From the repo root, run `pnpm -F @zonite/shared type-check`. It must exit 0. If it fails, re-check T014–T025 for typos.

---

**Checkpoint**: Foundation ready. The shared package exists and type-checks. User
story work can now begin in parallel if team capacity allows.

---

## Phase 3: User Story 1 - Run Zonite locally after a single clone (Priority: P1) 🎯 MVP

**Goal**: After this phase, a contributor can run one command and have
backend + frontend + postgres running locally with hot reload. The backend responds
to `GET /api/health` with the Sikka success envelope.

**Independent Test**: Follow steps 3–5 of [quickstart.md](./quickstart.md). All three
services report healthy and hot reload works.

### 3.1 Backend package manifest + TypeScript config

- [ ] T027 [US1] Create `apps/backend/package.json` with this content:

  ```json
  {
    "name": "@zonite/backend",
    "version": "0.0.0",
    "private": true,
    "scripts": {
      "start": "nest start",
      "start:dev": "nest start --watch",
      "build": "nest build",
      "type-check": "tsc --noEmit"
    },
    "dependencies": {
      "@nestjs/common": "^11.1.9",
      "@nestjs/core": "^11.1.9",
      "@nestjs/platform-express": "^11.1.9",
      "@zonite/shared": "workspace:*",
      "reflect-metadata": "^0.2.2",
      "rxjs": "^7.8.1",
      "zod": "^4.1.13"
    },
    "devDependencies": {
      "@nestjs/cli": "^11.0.0",
      "@nestjs/schematics": "^11.0.0",
      "@types/express": "^5.0.0"
    }
  }
  ```

- [ ] T028 [US1] Create `apps/backend/tsconfig.json`:

  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "module": "commonjs",
      "moduleResolution": "node",
      "target": "ES2022",
      "outDir": "./dist",
      "rootDir": "./src",
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "strictPropertyInitialization": false,
      "noEmit": false,
      "paths": {
        "@/*": ["./src/*"],
        "@zonite/shared": ["../../packages/shared/src/index.ts"],
        "@zonite/shared/*": ["../../packages/shared/src/*"]
      }
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] T029 [US1] Create `apps/backend/nest-cli.json`:
  ```json
  {
    "$schema": "https://json.schemastore.org/nest-cli",
    "collection": "@nestjs/schematics",
    "sourceRoot": "src",
    "compilerOptions": {
      "deleteOutDir": true
    }
  }
  ```

### 3.2 Backend env validation (Sikka pattern, Zod-based)

- [ ] T030 [US1] Create `apps/backend/src/env.ts`. This mirrors the Sikka env pattern
      (see `/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend/src/env.ts`).
      Phase 0 only reads a minimal set:

  ```ts
  import { z } from 'zod';

  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z
      .string()
      .url()
      .refine((v) => v.startsWith('postgresql://') || v.startsWith('postgres://'), {
        message: 'DATABASE_URL must start with postgresql:// or postgres://',
      }),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((s) =>
        s
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      ),
  });

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  export const env = Object.freeze(parsed.data);
  export type Env = typeof env;
  ```

### 3.3 Sikka response envelope (ported verbatim)

- [ ] T031 [US1] Create `apps/backend/src/common/types/response.types.ts`. Ported
      from Sikka `src/types/response.types.ts`:

  ```ts
  export interface SuccessResponse<T> {
    code: number;
    success: true;
    message: string;
    data: T;
    timestamp: string;
  }

  export interface ErrorResponse {
    code: number;
    success: false;
    message: string | string[];
    error?: string;
    data?: object;
    timestamp: string;
  }

  export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
  ```

- [ ] T032 [US1] Create `apps/backend/src/common/utils/response.handler.ts`. Ported
      verbatim from Sikka `src/utils/response.handler.ts`:

  ```ts
  import { HttpStatus } from '@nestjs/common';
  import type { SuccessResponse, ErrorResponse } from '../types/response.types';

  export function successResponse<T>(
    data: T,
    message = 'Success',
    code: number = HttpStatus.OK,
  ): SuccessResponse<T> {
    return {
      code,
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  export function errorResponse(
    message: string | string[],
    code: number = HttpStatus.INTERNAL_SERVER_ERROR,
    error?: string,
    data?: object,
  ): ErrorResponse {
    return {
      code,
      success: false,
      message,
      error,
      data,
      timestamp: new Date().toISOString(),
    };
  }
  ```

### 3.4 Health module (reference implementation for every future Sikka-style module)

- [ ] T033 [US1] Create `apps/backend/src/modules/health/dto/health-response.dto.ts`:

  ```ts
  export class HealthStatusDto {
    status!: 'ok';
  }
  ```

- [ ] T034 [US1] Create `apps/backend/src/modules/health/dto/index.ts`:

  ```ts
  export * from './health-response.dto';
  ```

- [ ] T035 [US1] Create
      `apps/backend/src/modules/health/decorators/health-check-endpoint.decorator.ts`:

  ```ts
  import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';

  /**
   * Bundle of metadata for GET /api/health.
   * Swagger decorators are added in a later phase when Scalar docs are wired in.
   */
  export function HealthCheckEndpoint() {
    return applyDecorators(HttpCode(HttpStatus.OK));
  }
  ```

- [ ] T036 [US1] Create `apps/backend/src/modules/health/services/health.service.ts`:

  ```ts
  import { Injectable } from '@nestjs/common';

  @Injectable()
  export class HealthService {
    getStatus(): { status: 'ok' } {
      return { status: 'ok' };
    }
  }
  ```

- [ ] T037 [US1] Create
      `apps/backend/src/modules/health/controllers/health.controller.ts`:

  ```ts
  import { Controller, Get } from '@nestjs/common';
  import { HealthService } from '../services/health.service';
  import { HealthCheckEndpoint } from '../decorators/health-check-endpoint.decorator';
  import { successResponse } from '../../../common/utils/response.handler';
  import type { SuccessResponse } from '../../../common/types/response.types';

  @Controller('health')
  export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @HealthCheckEndpoint()
    getHealth(): SuccessResponse<{ status: 'ok' }> {
      return successResponse(this.healthService.getStatus(), 'Zonite backend is healthy');
    }
  }
  ```

- [ ] T038 [US1] Create `apps/backend/src/modules/health/health.module.ts`:

  ```ts
  import { Module } from '@nestjs/common';
  import { HealthController } from './controllers/health.controller';
  import { HealthService } from './services/health.service';

  @Module({
    controllers: [HealthController],
    providers: [HealthService],
  })
  export class HealthModule {}
  ```

### 3.5 Backend bootstrap

- [ ] T039 [US1] Create `apps/backend/src/app.module.ts`:

  ```ts
  import { Module } from '@nestjs/common';
  import { HealthModule } from './modules/health/health.module';

  @Module({
    imports: [HealthModule],
  })
  export class AppModule {}
  ```

- [ ] T040 [US1] Create `apps/backend/src/main.ts` — bootstrap with `/api` prefix,
      CORS from env, `ValidationPipe` (Sikka standard):

  ```ts
  import 'reflect-metadata';
  import { NestFactory } from '@nestjs/core';
  import { ValidationPipe } from '@nestjs/common';
  import { AppModule } from './app.module';
  import { env } from './env';

  async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
      origin: env.CORS_ORIGINS,
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(env.PORT, '0.0.0.0');
    // eslint-disable-next-line no-console
    console.log(`🚀 Zonite backend listening on http://0.0.0.0:${env.PORT}/api`);
  }

  bootstrap();
  ```

### 3.6 Backend Dockerfile (dev target)

- [ ] T041 [US1] Create `apps/backend/Dockerfile`:
  ```dockerfile
  FROM node:22-alpine AS dev
  RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
  WORKDIR /workspace
  # Install deps from the repo root (monorepo context).
  # docker-compose mounts the repo, so we don't COPY source here.
  EXPOSE 3000
  ENV CHOKIDAR_USEPOLLING=true
  CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm --filter @zonite/backend start:dev"]
  ```

### 3.7 Frontend scaffolding

- [ ] T042 [US1] Create `apps/frontend/package.json`:

  ```json
  {
    "name": "@zonite/frontend",
    "version": "0.0.0",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "vite",
      "build": "tsc --noEmit && vite build",
      "preview": "vite preview",
      "type-check": "tsc --noEmit"
    },
    "dependencies": {
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "@zonite/shared": "workspace:*"
    },
    "devDependencies": {
      "@types/react": "^18.3.12",
      "@types/react-dom": "^18.3.1",
      "@vitejs/plugin-react": "^4.3.4",
      "vite": "^5.4.11"
    }
  }
  ```

- [ ] T043 [US1] Create `apps/frontend/tsconfig.json`:

  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "jsx": "react-jsx",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "rootDir": "./src",
      "noEmit": true,
      "paths": {
        "@/*": ["./src/*"],
        "@zonite/shared": ["../../packages/shared/src/index.ts"],
        "@zonite/shared/*": ["../../packages/shared/src/*"]
      }
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"]
  }
  ```

- [ ] T044 [US1] Create `apps/frontend/vite.config.ts`:

  ```ts
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'node:path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@zonite/shared': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
    server: {
      host: true,
      port: 5173,
      hmr: { clientPort: 5173 },
    },
  });
  ```

- [ ] T045 [US1] Create `apps/frontend/index.html`:

  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Zonite</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

- [ ] T046 [US1] Create `apps/frontend/src/main.tsx`:

  ```tsx
  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { App } from './App';

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('#root not found');
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  ```

- [ ] T047 [US1] Create `apps/frontend/src/App.tsx`. NOTE: a single inline style is a
      **documented Phase 0 exemption** to Constitution Principle III (no design tokens
      yet). Phase 1 removes this exemption:

  ```tsx
  export function App(): JSX.Element {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#100613',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
        }}
      >
        <h1>Zonite — Phase 0 OK</h1>
      </main>
    );
  }
  ```

- [ ] T048 [US1] Create `apps/frontend/Dockerfile`:
  ```dockerfile
  FROM node:22-alpine AS dev
  RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
  WORKDIR /workspace
  EXPOSE 5173
  CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm --filter @zonite/frontend dev"]
  ```

### 3.8 Local-dev env + Docker Compose

- [ ] T049 [US1] Create `.env.example` at the repo root. Every variable Phase 0
      reads is declared here with a default (spec FR-013 / SC-006):

  ```env
  # --- Backend (apps/backend) ---
  # Runtime mode. Controls logger verbosity and strictness.
  NODE_ENV=development

  # Port the backend listens on inside its container. Exposed on the host via
  # docker-compose port mapping.
  PORT=3000

  # Postgres connection string. Uses the compose service name "postgres" as host
  # so the backend reaches the DB over the zonite-net bridge network.
  DATABASE_URL=postgresql://zonite:zonite@postgres:5432/zonite

  # Comma-separated list of origins allowed by the backend CORS policy.
  CORS_ORIGINS=http://localhost:5173

  # --- Frontend (apps/frontend) ---
  # Base URL the frontend calls for API requests. Must include the /api prefix.
  VITE_API_BASE_URL=http://localhost:3000/api
  ```

- [ ] T050 [US1] Create `docker-compose.yml` at the repo root. Three services, one
      named volume for Postgres data, shared bridge network:

  ```yaml
  name: zonite

  services:
    postgres:
      image: postgres:16-alpine
      restart: unless-stopped
      environment:
        POSTGRES_USER: zonite
        POSTGRES_PASSWORD: zonite
        POSTGRES_DB: zonite
      ports:
        - '5432:5432'
      volumes:
        - postgres-data:/var/lib/postgresql/data
      networks:
        - zonite-net
      healthcheck:
        test: ['CMD-SHELL', 'pg_isready -U zonite -d zonite']
        interval: 5s
        timeout: 3s
        retries: 10

    backend:
      build:
        context: .
        dockerfile: apps/backend/Dockerfile
        target: dev
      restart: unless-stopped
      depends_on:
        postgres:
          condition: service_healthy
      env_file: .env
      environment:
        DATABASE_URL: postgresql://zonite:zonite@postgres:5432/zonite
      ports:
        - '3000:3000'
      volumes:
        - .:/workspace
        - /workspace/node_modules
        - /workspace/apps/backend/node_modules
      networks:
        - zonite-net
      healthcheck:
        test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/api/health']
        interval: 10s
        timeout: 5s
        retries: 10
        start_period: 30s

    frontend:
      build:
        context: .
        dockerfile: apps/frontend/Dockerfile
        target: dev
      restart: unless-stopped
      env_file: .env
      ports:
        - '5173:5173'
      volumes:
        - .:/workspace
        - /workspace/node_modules
        - /workspace/apps/frontend/node_modules
      networks:
        - zonite-net

  volumes:
    postgres-data:

  networks:
    zonite-net:
      driver: bridge
  ```

### 3.9 US1 verification

- [ ] T051 [US1] From the repo root, run `pnpm install` once more so the new backend
      and frontend dependencies register in `pnpm-lock.yaml`. Expected exit 0.

- [ ] T052 [US1] From the repo root, run `pnpm type-check`. All three packages must
      type-check with exit 0.

- [ ] T053 [US1] From the repo root, run `docker compose up --build`. Wait for:
  - `postgres` → `healthy`
  - `backend` logs show `🚀 Zonite backend listening on http://0.0.0.0:3000/api`
  - `frontend` logs show `Local: http://localhost:5173/`

  In a second terminal, run `curl -s http://localhost:3000/api/health`. Expected:
  JSON matching the contract in [`contracts/health.http.md`](./contracts/health.http.md)
  — `code: 200, success: true, message: "Zonite backend is healthy", data: { status:
"ok" }, timestamp: "<ISO>"`. Open `http://localhost:5173/` in a browser; it should
  render **"Zonite — Phase 0 OK"**.

  If any of the above fails, the phase is not done — diagnose and fix before moving
  on. Stop compose with `docker compose down` when verified.

---

**Checkpoint**: User Story 1 delivered. MVP bring-up works end-to-end.

---

## Phase 4: User Story 2 - Share types across frontend and backend without duplication (Priority: P1)

**Goal**: Prove that both apps consume `@zonite/shared` by reference — not by copy —
by wiring a real import into each app and running the monorepo-wide type-check.

**Independent Test**: Section 6 of [quickstart.md](./quickstart.md) — rename a shared
enum member and confirm both apps fail to compile.

- [ ] T054 [US2] Update `apps/backend/src/modules/health/services/health.service.ts`
      to import from `@zonite/shared` and include the current `GameStatus` in the payload.
      This proves the backend actually consumes the shared package. Replace the file
      contents with:

  ```ts
  import { Injectable } from '@nestjs/common';
  import { GameStatus } from '@zonite/shared';

  @Injectable()
  export class HealthService {
    getStatus(): { status: 'ok'; boundary: GameStatus } {
      return { status: 'ok', boundary: GameStatus.LOBBY };
    }
  }
  ```

  Then update `apps/backend/src/modules/health/controllers/health.controller.ts`
  return type to match:

  ```ts
  import { Controller, Get } from '@nestjs/common';
  import type { GameStatus } from '@zonite/shared';
  import { HealthService } from '../services/health.service';
  import { HealthCheckEndpoint } from '../decorators/health-check-endpoint.decorator';
  import { successResponse } from '../../../common/utils/response.handler';
  import type { SuccessResponse } from '../../../common/types/response.types';

  @Controller('health')
  export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @HealthCheckEndpoint()
    getHealth(): SuccessResponse<{ status: 'ok'; boundary: GameStatus }> {
      return successResponse(this.healthService.getStatus(), 'Zonite backend is healthy');
    }
  }
  ```

- [ ] T055 [US2] Update `apps/frontend/src/App.tsx` to import a shared enum and
      render it, proving frontend consumption:

  ```tsx
  import { GameStatus } from '@zonite/shared';

  export function App(): JSX.Element {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#100613',
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
          gap: '0.5rem',
        }}
      >
        <h1>Zonite — Phase 0 OK</h1>
        <p style={{ opacity: 0.7 }}>Shared contract boundary: {GameStatus.LOBBY}</p>
      </main>
    );
  }
  ```

- [ ] T056 [US2] From the repo root, run `pnpm type-check`. Must exit 0. If it
      fails, the path alias is misconfigured — re-check `tsconfig.base.json` (T007),
      `apps/backend/tsconfig.json` (T028), `apps/frontend/tsconfig.json` (T043), and
      `apps/frontend/vite.config.ts` (T044) paths.

---

**Checkpoint**: User Stories 1 AND 2 delivered. Shared contract is consumed by both
apps and drift is type-check-enforced.

---

## Phase 5: User Story 3 - Enforce conventions on every commit (Priority: P2)

**Goal**: Pre-commit hook blocks lint/format violations. A minimal CI pipeline
enforces the same on every PR.

**Independent Test**: Section 7 of [quickstart.md](./quickstart.md) + CI job passes
on a green branch and fails on a branch with a known lint violation.

- [ ] T057 [US3] From the repo root, initialize Husky:

  ```bash
  pnpm run prepare
  ```

  This creates the `.husky/` directory structure (Husky v9).

- [ ] T058 [US3] Create `.husky/pre-commit` with this content, then make it
      executable:

  ```bash
  pnpm lint-staged
  ```

  Run `chmod +x .husky/pre-commit` after creating the file.

- [ ] T059 [US3] Create `.github/workflows/ci.yml` (minimal CI — install → lint →
      type-check; **no test stage, no build stage**, per spec FR-017a):

  ```yaml
  name: CI

  on:
    pull_request:
    push:
      branches: [main]

  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true

  jobs:
    lint-and-typecheck:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: pnpm/action-setup@v4
          with:
            version: 9.12.0

        - uses: actions/setup-node@v4
          with:
            node-version-file: '.nvmrc'
            cache: 'pnpm'

        - name: Install
          run: pnpm install --frozen-lockfile

        - name: Lint
          run: pnpm lint

        - name: Type-check
          run: pnpm type-check
  ```

- [ ] T060 [US3] Verify pre-commit locally. Make a throwaway file with a deliberate
      lint violation, stage it, and attempt to commit. The commit MUST be blocked with
      an ESLint/Prettier error. Then discard the change. Exact sequence:
  ```bash
  printf 'const  x=1\n' > apps/backend/src/__lint_probe__.ts
  git add apps/backend/src/__lint_probe__.ts
  git commit -m "probe"
  # Expected: commit blocked.
  git reset HEAD apps/backend/src/__lint_probe__.ts
  rm apps/backend/src/__lint_probe__.ts
  ```

---

**Checkpoint**: User Stories 1, 2, 3 delivered. Conventions enforced at both pre-commit
and CI gates.

---

## Phase 6: User Story 4 - Discover project decisions via Spekit (Priority: P2)

**Goal**: The README explains how to run Zonite and links to the authoritative
ruleset and to the Spekit workspace. Spekit itself is an external tool — the
repo-side deliverable is the README content and a record of which Speks the
workspace should contain.

**Independent Test**: A new engineer opens the README, follows the Spekit link, and
can reach each of the four seed Speks listed.

- [ ] T061 [US4] Create `README.md` at the repo root, overwriting the template that
      came with Spec-Kit. Use this exact content (replace `<SPEKIT_TOPIC_URL>` with the
      real URL once the Topic is provisioned in T063; until then, leave the placeholder
      and add a "pending" note):

  ````markdown
  # Zonite

  Real-time block-claiming multiplayer game.

  - React + NestJS + Socket.io, TypeScript end-to-end.
  - Built on [Yalgamers](../yalgamer-e-sport-frontend/) design tokens.
  - Backend extends the [Sikka Platform Backend](/media/jo/store/youssef/projects/khuta/Sikka-Platform-Backend) patterns.

  ## Prerequisites

  - **Node.js 22 LTS** (see `.nvmrc`)
  - **pnpm 9.x** (`corepack enable && corepack prepare pnpm@9 --activate`)
  - **Docker + Docker Compose v2** (Docker Desktop, OrbStack, or native Docker)

  Windows contributors: use WSL2.

  ## Quickstart

  ```bash
  git clone <repo-url> zonite
  cd zonite
  cp .env.example .env
  pnpm install
  docker compose up --build
  ```

  Then:

  - Backend: `curl http://localhost:3000/api/health`
  - Frontend: open <http://localhost:5173/>

  Full acceptance script: [`specs/001-foundation-setup/quickstart.md`](./specs/001-foundation-setup/quickstart.md).

  ## Project Governance

  - **Ruleset (constitution)**: [`.specify/memory/constitution.md`](./.specify/memory/constitution.md)
  - **Phased roadmap**: [`PLAN.md`](./PLAN.md)
  - **Phase 0 spec + plan + tasks**: [`specs/001-foundation-setup/`](./specs/001-foundation-setup/)
  - **Spekit Dev Hub** (decision log): `<SPEKIT_TOPIC_URL>` _(Phase 0.4 — pending)_

  ## Monorepo layout

  - `apps/backend/` — NestJS 11 backend (Sikka-style modules)
  - `apps/frontend/` — Vite + React 18 frontend
  - `packages/shared/` — cross-wire types, enums, socket event names (single source of truth)

  ## Core commands

  | Command           | What it does                                                |
  | ----------------- | ----------------------------------------------------------- |
  | `pnpm install`    | Install all workspace deps                                  |
  | `pnpm dev`        | `docker compose up --build` (backend + frontend + postgres) |
  | `pnpm type-check` | `tsc --noEmit` across all three packages                    |
  | `pnpm lint`       | ESLint on the whole workspace                               |
  | `pnpm format`     | Prettier                                                    |
  ````

- [ ] T062 [US4] Create `docs/speks.md` tracking the Phase 0 seed Speks and the
      outstanding list. This is a repo-side manifest of what the Spekit Topic must
      contain at Phase 0 exit. Content:

  ```markdown
  # Spekit "Zonite Dev Hub" — Spek Manifest

  Spekit is the external decision log for Zonite (Constitution Principle V). This
  file is the repo-side index of what the Topic should contain at each phase. Update
  this file whenever a Spek is created or retitled.

  ## Phase 0 seed Speks (required before Phase 0 exit)

  - [ ] Repository structure and monorepo guide
  - [ ] Local dev setup (step-by-step, mirrors `specs/001-foundation-setup/quickstart.md`)
  - [ ] Environment variables reference (mirrors `.env.example`)
  - [ ] Shared package contract (mirrors `specs/001-foundation-setup/contracts/shared-package.md`)
  - [ ] Phase 0 exemptions (no Tailwind yet, no test tooling yet — both expire in later phases)

  ## Full project Spek checklist (PLAN.md Appendix D)

  - [ ] Architecture overview
  - [ ] Design system — token sources
  - [ ] Auth flow — JWT + refresh
  - [ ] Room lifecycle
  - [ ] Game engine — in-memory state
  - [ ] WebSocket events reference
  - [ ] How to add a new socket event
  - [ ] How to add a new REST endpoint
  - [ ] How to add a new game mode
  - [ ] Backend conventions (decorators, guards, filters)
  - [ ] Frontend state management guide
  - [ ] Deployment guide
  ```

- [ ] T063 [US4] **External action**: provision the Spekit Topic "Zonite Dev Hub",
      create the five Phase 0 seed Speks listed in `docs/speks.md`, invite all current
      team members. Replace `<SPEKIT_TOPIC_URL>` in `README.md` (T061) with the real
      URL. Tick the five boxes in `docs/speks.md`. This task is **blocking for Phase 0
      exit** per spec FR-020/FR-021. If Spekit provisioning is delayed, leave the
      placeholder and record the delay in the Phase 0 exit review.

---

**Checkpoint**: All four user stories delivered.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Verify the full acceptance script from a clean state, lock in any trailing
cleanup, and declare Phase 0 done.

- [ ] T064 [P] Run `pnpm format` from the repo root to normalize formatting across
      everything written so far. Commit the diff if any.

- [ ] T065 [P] Run `pnpm lint` from the repo root. Must exit 0. Fix any violation
      by rerunning `pnpm lint:fix` + manual cleanup; **do not** disable rules.

- [ ] T066 Run the full acceptance script by walking every step of
      [`quickstart.md`](./quickstart.md) end-to-end on a freshly-cloned checkout (or after
      `git clean -xdf` to simulate one). Tick off every section. Any step that fails is
      a Phase 0 blocker.

- [ ] T067 Verify spec success criteria:
  - **SC-001** (cold clone → healthy ≤ 10 min): confirmed in T066.
  - **SC-002** (no duplicate cross-wire types): `grep -r "LOBBY\\|PLAYING\\|FINISHED"
apps/` should only return imports/usages, never declarations.
  - **SC-003** (pre-commit blocks violations): confirmed in T060.
  - **SC-004** (type-check ≤ 60 s): `time pnpm type-check` from a cold cache.
  - **SC-005** (Spekit Topic exists with 4+ seed Speks): confirmed after T063.
  - **SC-006** (`.env.example` in sync with code): diff `.env.example` against
    `grep -r "env\\." apps/backend/src | grep -oE "env\\.[A-Z_]+"` uniqued — every
    var read is in the example, no var in the example is unused.
  - **SC-007** (CI blocks failing PRs): confirmed by opening a throwaway PR with a
    known lint violation and observing the red check.

- [ ] T068 Create a summary commit on `001-foundation-setup` titled
      `phase 0: foundation & project setup complete` listing which Speks were created,
      which SC items passed, and any exemptions still open (expected: Tailwind — Phase 1;
      tests — first phase that adds one).

---

## Dependencies & Execution Order

### Phase-level dependencies

- **Phase 1 (Setup)**: no dependencies; start immediately.
- **Phase 2 (Foundational)**: depends on Phase 1 completion (needs `pnpm install` to
  work).
- **Phase 3 (US1)**: depends on Phase 2 (backend ports use the shared response types
  but not yet the shared package; the package still must exist before the shared
  consumers land in Phase 4).
- **Phase 4 (US2)**: depends on Phase 3 (edits files Phase 3 creates).
- **Phase 5 (US3)**: depends on Phase 2 (ESLint config exists) but is independent of
  Phase 3 and 4; can run in parallel with Phase 3 if two implementers are available.
- **Phase 6 (US4)**: depends on Phase 3 (README quickstart references `docker compose
up`, which only works after Phase 3 is done).
- **Phase 7 (Polish)**: depends on Phases 3, 4, 5, 6.

### Story-level dependencies

- **US1 (P1)**: no cross-story dependencies.
- **US2 (P1)**: depends on Foundational (shared package) + US1 (files it edits).
- **US3 (P2)**: depends on Foundational (ESLint config). Can run in parallel with
  US1/US2.
- **US4 (P2)**: depends on US1 (README references working quickstart).

### Within-phase parallelism

- Phase 1: T002–T005 are `[P]`; T006–T010 are file writes with no inter-dependency
  and can also be done in parallel; T011 depends on T006–T010.
- Phase 2: T014–T018 are `[P]`; T019 depends on T017 + T018; T020–T024 are `[P]`;
  T025 depends on T012–T024; T026 depends on T025.
- Phase 3: T033, T035, T036 could each be authored in parallel once T031–T032 and
  T030 are done. T037 depends on T033 + T035 + T036. T038 depends on T037.
- Phase 7: T064, T065 are `[P]`.

---

## Parallel Example: Phase 2 shared enums + types

```bash
# All six shared-symbol files can be authored in parallel — different files, no
# dependencies on each other:
Task: "Create packages/shared/src/enums/game-status.enum.ts (T014)"
Task: "Create packages/shared/src/enums/game-mode.enum.ts (T015)"
Task: "Create packages/shared/src/enums/team-color.enum.ts (T016)"
Task: "Create packages/shared/src/events/game-events.enum.ts (T017)"
Task: "Create packages/shared/src/events/room-events.enum.ts (T018)"
Task: "Create packages/shared/src/types/block.type.ts (T022)"
```

---

## Implementation Strategy

### MVP (User Story 1 only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. **Stop and validate**: run `docker compose up --build`, confirm `GET /api/health`
   returns the Sikka envelope, confirm the frontend placeholder renders.
5. This is a demonstrable MVP — Phase 0 has already delivered measurable value.

### Incremental delivery

1. Setup + Foundational → ready to absorb feature work.
2. Add US1 → demo: local bring-up works.
3. Add US2 → demo: edit a shared type, both apps break/pass together.
4. Add US3 → demo: pre-commit and CI block bad diffs.
5. Add US4 → demo: README + Spekit link work.
6. Polish → Phase 0 closes.

### Parallel team strategy (optional)

After Phases 1–2 complete, with three implementers:

- Implementer A: Phase 3 (US1) — biggest bucket, P1.
- Implementer B: Phase 5 (US3) — independent of Phases 3–4.
- Implementer C: Phase 6 (US4) text/docs — can draft README and `docs/speks.md` in
  parallel; final polish waits for Phase 3 so quickstart references real commands.

Phase 4 (US2) must wait for Phase 3 because it edits files Phase 3 creates.

---

## Notes

- `[P]` tasks = different files, no dependencies on unfinished work in the same
  phase.
- `[US#]` label maps a task to a specific user story for traceability.
- Every file path is relative to the repo root
  `/media/jo/store/youssef/projects/yal-gaming/zonite`.
- Commit after each task or tight logical group; **never** use `--no-verify`.
- If a task's file content block and the spec/plan diverge, the spec/plan wins —
  stop and fix the task, do not silently drift.
- Phase 0 ships **no tests** and **no Tailwind**. These are documented exemptions
  (see the "Phase 0 exemptions" Spek). Resist the urge to add either.
