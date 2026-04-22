# Feature Specification: Foundation & Project Setup (Phase 0)

**Feature Branch**: `001-foundation-setup`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "read @PLAN.md and create a specifications for Phase 0 — Foundation & Project Setup ONLY."

## Clarifications

### Session 2026-04-17

- Q: Which package manager does Phase 0 commit to for the monorepo? → A: pnpm workspaces (matches Sikka backend and Yalgamer frontend; no extra task orchestrator in Phase 0).
- Q: Does Phase 0 deliver a working CI pipeline, or just the commands? → A: Minimal CI — a single pipeline runs `install → lint → type-check` on every PR. No test stage, no build matrix, no deploy. Kept deliberately simple; expanded when later phases introduce tests and builds.
- Q: Does Phase 0 ship a backend health endpoint, and where? → A: Yes — `GET /api/health` returning `{ status: "ok" }` wrapped in the Sikka base success-response envelope. This doubles as a smoke test for the `/api` global prefix and the mandatory response wrapper from Constitution Principle II.
- Q: Does Phase 0 install and configure testing frameworks? → A: No. Test tooling (Jest, Vitest, Supertest, `@nestjs/testing`) is deferred. It is installed and configured by the first later phase that actually writes a test. Phase 0 ships zero test dependencies.
- Q: How strictly does Phase 0 pin Node and TypeScript versions? → A: Node 22 LTS pinned via `.nvmrc` and root `engines.node` (matching Sikka's `@types/node` ^22 and Yalgamer's runtime). TypeScript pinned to ^5.7.x as a root devDependency and inherited by every workspace package — no package pins its own TypeScript version.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Run Zonite locally after a single clone (Priority: P1)

A new engineer joins the Zonite team, clones the repository, follows a short written
setup guide, and has the backend, frontend, and supporting database running locally
with hot reload — without needing to chase down tribal knowledge or contact another
engineer. They can open the frontend in a browser, the frontend reaches the backend,
and the backend reaches the database, all over local networking.

**Why this priority**: This is the gate for every other phase. Until a new contributor
can run the project from a cold clone, no one else on the team can build Zonite. It
is also the smallest demonstrable slice of Phase 0 — if it works, Phase 0 has delivered
value even if later steps slip.

**Independent Test**: On a clean machine (no pre-existing repo state), clone the
repository, copy `.env.example` to `.env`, run the documented local-dev bring-up
command, and within 10 minutes have: (a) `GET /api/health` returning HTTP 200 with
`{ status: "ok" }` wrapped in the Sikka success envelope, (b) the frontend dev
server serving its landing page, (c) the database reachable from the backend. No
additional manual setup steps required beyond what the README lists.

**Acceptance Scenarios**:

1. **Given** a clean checkout of the repository and a machine with the documented
   prerequisites installed, **When** the engineer runs the documented local-dev
   bring-up command, **Then** backend, frontend, and database services all start and
   report healthy within 10 minutes of the first command.
2. **Given** a running local environment, **When** the engineer edits a backend
   source file, **Then** the backend hot-reloads the change without a manual restart.
3. **Given** a running local environment, **When** the engineer edits a frontend
   source file, **Then** the frontend dev server picks up the change without a full
   page reload where hot module replacement applies.
4. **Given** `.env.example` is committed but `.env` is not, **When** the engineer
   copies `.env.example` to `.env` without further edits, **Then** all services boot
   with safe local defaults (no external credentials required for basic bring-up).

---

### User Story 2 - Share types across frontend and backend without duplication (Priority: P1)

A frontend or backend engineer needs to add or change a field on a value that travels
over the network (a room config, a game state slice, a socket event name). They update
a single file in the shared contract package; both the frontend and backend codebases
pick up the change through normal module resolution and fail to compile if they use
the old shape. There is no second place to keep in sync.

**Why this priority**: The shared contract is the spine of the project per the
constitution. Without it in place from Phase 0, every subsequent phase risks drift
between frontend and backend types, and that drift is exactly the class of bug the
project cannot afford at runtime in a real-time game.

**Independent Test**: An engineer adds a new field to a shared interface, imports the
interface from the frontend app and the backend app, and verifies (a) both apps
compile against the new shape, (b) removing the field from one usage site surfaces a
type error in that app without any manual re-linking or re-publishing step.

**Acceptance Scenarios**:

1. **Given** the shared contract package exists in the monorepo, **When** the backend
   imports a type defined in it, **Then** the import resolves without any manual
   build step beyond the normal install.
2. **Given** the shared contract package exists, **When** the frontend imports the
   same type, **Then** the import resolves the same way and refers to the identical
   type declaration.
3. **Given** an engineer changes a shared interface incompatibly, **When** they run
   the monorepo type check, **Then** any consumer (frontend or backend) using the old
   shape reports a compile error pointing at its own file.
4. **Given** the shared package defines socket event name constants and game enums,
   **When** an engineer writes a new event handler in the backend or a new listener
   in the frontend, **Then** the event name and enum values used are imported from the
   shared package, not hand-typed as string literals.

---

### User Story 3 - Enforce conventions on every commit (Priority: P2)

Any engineer who commits to the repository has their staged changes automatically
checked for formatting and lint violations before the commit is recorded. A commit
that violates the conventions does not land silently; the engineer sees the failure
and fixes it before the commit completes.

**Why this priority**: Conventions that are not mechanically enforced rot. Getting
this in place in Phase 0 is far cheaper than retrofitting after dozens of commits
have landed. It is lower priority than P1 only because work can technically proceed
without it; it MUST still ship before Phase 0 is called complete.

**Independent Test**: Stage a file with a deliberate formatting or lint violation,
attempt to commit, and verify the commit is blocked with a readable error message.
Fix the violation, re-commit, and verify the commit succeeds.

**Acceptance Scenarios**:

1. **Given** the repository is cloned and dependencies are installed, **When** an
   engineer stages a file with a style violation and runs `git commit`, **Then** the
   commit is blocked with an explanatory message naming the offending file(s).
2. **Given** a pre-commit failure, **When** the engineer fixes the violation and
   retries, **Then** the commit completes normally.
3. **Given** pre-commit hooks are installed, **When** hooks run, **Then** they only
   process staged files (not the entire repository), so commits remain fast on a
   large workspace.

---

### User Story 4 - Discover project decisions via Spekit (Priority: P2)

An engineer (new or existing) needs to understand a foundational decision — repo
structure, how to run the project locally, what the shared package is for, how to
set environment variables — and finds it in the Spekit "Zonite Dev Hub" Topic,
linked from the repository README. They do not have to dig through chat history or
ask a maintainer.

**Why this priority**: The constitution (Principle V) makes Spekit the system of
record for "why" decisions. Phase 0 is the right moment to establish the workspace
and seed it, so every later phase lands its Speks in a place that already exists
and that everyone can find.

**Independent Test**: An engineer opens the README, follows the Spekit link, and
finds Speks that explain repo structure, local dev setup, environment variables,
and the shared package contract — each in its own addressable Spek.

**Acceptance Scenarios**:

1. **Given** the README is read by a new engineer, **When** they follow the Spekit
   Topic link, **Then** they reach the "Zonite Dev Hub" Topic.
2. **Given** the "Zonite Dev Hub" Topic, **When** the engineer browses it, **Then**
   they find at least four Speks covering repo structure, local dev guide,
   environment setup, and the shared package contract.
3. **Given** a new foundational decision is made during Phase 0, **When** the PR that
   implements it is opened, **Then** the PR links the Spek documenting the decision
   (new or updated).

---

### Edge Cases

- A contributor on a machine where the required container runtime is unavailable
  follows a documented fallback path (or receives a clear error explaining what is
  missing). The absence of the runtime never produces a half-started system.
- A contributor whose `.env` file is missing required variables receives a clear,
  named error on backend startup rather than a silent misconfiguration later.
- Two engineers pick the same default local port. The local-dev configuration keeps
  ports explicit and documented so the clash is obvious and fixable by overriding a
  single variable.
- A pull request changes a shared type without updating one of its consumers. The
  monorepo type check surfaces the inconsistency before merge; no runtime discovery
  is required.
- A pre-commit hook fails on a file the engineer did not intend to touch (e.g., a
  generated file). The engineer can see which check failed and which file triggered
  it, and can resolve it without disabling the hook infrastructure.
- The Spekit workspace is not yet provisioned when Phase 0 starts. Work proceeds with
  the README marked "Spekit link: pending" and the link is filled in as soon as the
  workspace is available; this does not block the rest of Phase 0.

## Requirements _(mandatory)_

### Functional Requirements

**Monorepo & Workspace Structure**

- **FR-001**: The repository MUST contain three workspace packages: a backend app,
  a frontend app, and a shared contract package, each with its own package manifest.
- **FR-002**: The workspace MUST be managed by **pnpm workspaces** at the root, so
  that installing dependencies once at the root resolves dependencies for all three
  packages. A single `pnpm-lock.yaml` is committed; cross-package references use the
  `workspace:*` protocol. No additional task orchestrator (Turborepo, Nx) is
  introduced in Phase 0.
- **FR-003**: Cross-package imports from the backend app or the frontend app into the
  shared contract package MUST resolve without a publish or bundle step — the package
  is consumed directly from the workspace.
- **FR-004**: The repository root MUST contain `.env.example`, `docker-compose.yml`,
  and `README.md`; each of those files MUST be kept current with actual project
  behavior.

**Shared Contract Package**

- **FR-005**: The shared contract package MUST define typed shapes for every value
  that crosses the frontend/backend boundary in later phases, including at minimum:
  room configuration, game state, player, block, team, and game mode.
- **FR-006**: The shared contract package MUST define socket event name constants as
  an enum (or equivalent exhaustive constant object) so that event names are imported,
  not typed as string literals at call sites.
- **FR-007**: The shared contract package MUST define the following enums with stable
  string values: game status (`LOBBY`, `PLAYING`, `FINISHED`), game mode (`SOLO`,
  `TEAM`), team color (`RED`, `BLUE`, `NONE`).
- **FR-008**: The shared contract package MUST be the only place these types and
  enums are defined; duplicating them inside the backend or frontend app is
  prohibited.

**Local Development Environment**

- **FR-009**: A single documented command (invoked from the repository root) MUST be
  sufficient to bring up backend, frontend, and a local PostgreSQL database on an
  engineer's machine.
- **FR-009a**: The backend MUST expose `GET /api/health` which returns HTTP 200 with
  payload `{ status: "ok" }` wrapped in the Sikka base success-response envelope
  (per Constitution Principle II). This endpoint serves as the authoritative "backend
  is up" probe for local bring-up, `docker-compose` healthchecks, and the CI
  pipeline.
- **FR-010**: The backend local-dev configuration MUST hot-reload on source changes
  without a manual restart.
- **FR-011**: The frontend local-dev configuration MUST serve the app via a
  development server with module replacement on source changes.
- **FR-012**: The local-dev environment MUST NOT require Redis, a message broker, or
  any service beyond PostgreSQL, backend, and frontend. Additional services are out
  of scope for Phase 0.
- **FR-013**: `.env.example` MUST list every environment variable the project reads,
  each with an inline comment explaining what it controls and a safe local default
  where one exists.
- **FR-014**: Copying `.env.example` to `.env` without edits MUST be sufficient to
  boot the local environment for a contributor who only needs to run and develop —
  no external credentials required for basic bring-up.

**Conventions & Quality Gates**

- **FR-014a**: The repository MUST pin a single Node.js major version (**Node 22
  LTS**) in both `.nvmrc` and the root `package.json` `engines.node` field.
  Contributors whose local Node differs receive a warning on `pnpm install`.
- **FR-014b**: The repository MUST pin a single TypeScript version (**^5.7.x**) as
  a root-level devDependency. Workspace packages MUST NOT declare their own
  TypeScript version; they inherit from the root.
- **FR-015**: The repository MUST enforce a single shared formatter configuration and
  a single shared lint configuration at the root, so that all three packages conform
  to the same style rules.
- **FR-016**: A pre-commit hook mechanism MUST run the formatter and linter on staged
  files only and MUST block a commit whose staged files violate the configured rules.
- **FR-017**: The monorepo MUST expose a single command that type-checks all three
  packages in one pass, suitable for CI and for local verification before a PR.
- **FR-017a**: A minimal continuous-integration pipeline MUST run on every pull
  request and execute, in order: dependency install, lint, type-check. Any step
  failing blocks the PR. Test and build stages are deliberately out of scope for
  Phase 0 and are added when later phases introduce tests and production builds.
- **FR-018**: The repository MUST document the convention that the shared package is
  the source of truth for cross-wire types and event names, with the consequence that
  reviewers block PRs that redefine those types inside an app.

**Documentation & Spekit Workspace**

- **FR-019**: The repository README MUST include: project overview, prerequisites,
  the local-dev bring-up command, a link to the Spekit "Zonite Dev Hub" Topic, and a
  link to the project constitution.
- **FR-020**: The Spekit "Zonite Dev Hub" Topic MUST be created and MUST contain, at
  minimum, Speks covering: repository structure and monorepo guide, local dev setup,
  environment variables reference, and the shared package contract.
- **FR-021**: All current team members MUST be invited to the Spekit Topic before
  Phase 0 is declared complete.
- **FR-022**: Subsequent foundational decisions made during Phase 0 MUST be recorded
  as Speks in the same Topic, and the README link MUST remain current.

### Key Entities _(include if feature involves data)_

- **Workspace Package**: A unit within the monorepo that owns a package manifest and
  a subset of source files. Relationships: the backend app and the frontend app each
  depend on the shared contract package; the shared contract package depends on no
  other workspace package.
- **Shared Contract**: The authoritative set of cross-wire types, enums, and event
  name constants. Attributes (conceptual, not schema): a collection of game-domain
  shapes (room configuration, game state, player, block), a collection of enums, a
  collection of named event constants.
- **Environment Variable Manifest**: The list of variables the project reads, each
  with a name, a human-readable description, and (where applicable) a safe local
  default. Surfaces in the repository as `.env.example`.
- **Local Dev Stack**: The set of locally-running services required to develop
  Zonite — backend, frontend, and PostgreSQL — with their startup command and health
  expectations.
- **Spekit Topic ("Zonite Dev Hub")**: The external documentation workspace that
  holds project Speks. Attributes: a link URL, a set of Speks, a member list.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new contributor can go from a cold clone to a running local
  environment (backend reachable, frontend reachable, database reachable) in under
  10 minutes, following only the README, on a machine that already meets the listed
  prerequisites.
- **SC-002**: 100% of the cross-wire types and socket event names referenced in
  subsequent phases are imported from the shared contract package; zero duplicate
  definitions live in the backend or frontend apps (enforced by review and spot-check
  on the Phase 0 exit review).
- **SC-003**: An attempted commit containing a known style or lint violation is
  blocked by the pre-commit hook in 100% of attempts on a freshly-cloned workspace,
  with a human-readable error that names the offending file(s).
- **SC-004**: The monorepo-wide type-check command exits with zero errors on the
  main branch at Phase 0 completion, and the same command completes locally in under
  60 seconds for an engineer on a typical development laptop.
- **SC-005**: The Spekit "Zonite Dev Hub" Topic exists, contains the four seed Speks
  (repo structure, local dev, env variables, shared contract), and is linked from
  the README. A new engineer reports (in a brief onboarding check) that they found
  the answer to at least one of their questions in Spekit without asking a teammate.
- **SC-006**: `.env.example` and the README stay in sync with the actual boot
  requirements of the project: on the day Phase 0 is declared complete, no variable
  read by the project is missing from `.env.example`, and no variable listed in
  `.env.example` is unused.
- **SC-007**: The CI pipeline blocks a pull request whose diff fails lint or
  type-check in 100% of attempts; it does not run any test or build stage in
  Phase 0. A PR with a known lint violation is created as part of Phase 0 exit
  verification and observed to be blocked.

## Assumptions

- The team has access to the Sikka Platform Backend repository as a reference for
  backend patterns; that reference is consulted in Phase 2, but Phase 0 itself does
  not require Zonite to import or extend Sikka code yet.
- The team has access to the Yalgamers frontend repository as a reference for design
  tokens; token extraction is Phase 1 work, so Phase 0 does not need a final design
  system — only that the frontend app boots and is wired for styling later.
- Contributors have a modern development machine with a container runtime available
  for the local-dev stack. Contributors without one follow a documented fallback or
  accept that Phase 0 local-dev is not supported on their configuration.
- The Spekit product is already licensed and available to the team; provisioning the
  "Zonite Dev Hub" Topic is an administrative step, not a procurement step.
- Authentication, game logic, and real-time gameplay are explicitly **out of scope**
  for Phase 0. Phase 0 only delivers the container that later phases fill.
- Test tooling (Jest, Vitest, Supertest, `@nestjs/testing`) is explicitly **out of
  scope** for Phase 0. It is installed by the first later phase that writes a test.
  No placeholder test scaffolds are added in Phase 0.
- The constitution at `.specify/memory/constitution.md` is the authoritative ruleset;
  Phase 0 conventions (shared-contract-first, Sikka parity as a later-phase rule,
  Spekit-documented decisions) are inherited from it, not re-litigated here.
