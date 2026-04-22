# Implementation Plan: Design Handoff Adoption (Phase 1 — Style Extraction)

**Branch**: `003-design-handoff` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-design-handoff/spec.md`

## Summary

Adopt the Claude Design handoff bundle (`docs/design/zonite-game/`) as the authoritative visual source for Zonite. Ship it as a pinned, hash-verified read-only reference; translate its `colors_and_type.css` verbatim into `apps/frontend/src/styles/tokens.css` (rewiring the handoff's Google Fonts `@import` to self-hosted `@font-face` declarations); port its prototype components into production React 18 + Vite + TypeScript primitives under `components/layout/`, `components/ui/`, `components/common/`, `components/game/`; register the handoff's keyframe animations globally with `prefers-reduced-motion` guards; wire a dev-only `/_showcase` route that renders every token and primitive in every state; and enforce the Constitution's Principle III (Yalgamers Fidelity) mechanically via a `stylelint` rule (`color-no-hex` + `font-family`-quarantine) plus a custom ESLint rule for JSX inline styles. Every Phase 1 primitive meets WCAG 2.1 AA on its documented surface, respects `prefers-reduced-motion`, and is keyboard-operable. Three new Speks land in the "Zonite Dev Hub" Topic: token sources & override policy, handoff bundle refresh workflow, and the Mulish/Gilroy typography stand-in.

## Technical Context

**Language/Version**: TypeScript ^5.7 (root-pinned from Phase 0, strict mode on). Runtime: Node.js 22 LTS (pinned via `.nvmrc`).

**Primary Dependencies** (Phase 1 additions only — Phase 0 stack unchanged):

- `apps/frontend`:
  - `tailwindcss@^3.4` + `postcss@^8` + `autoprefixer@^10` — Tailwind configured with **Preflight disabled** and a theme that wraps the CSS variables from `tokens.css`. Used for utility classes; NOT the source of truth for values.
  - `clsx@^2` — className composition for conditional state classes on primitives.
  - `lucide-react@^0.460.0` — community icon library. Handoff's custom brand icons coexist as hand-authored SVG components under `components/common/icons/brand/`.
- `apps/frontend` devDeps:
  - `stylelint@^16`, `stylelint-config-standard@^36`, `stylelint-order@^6` — CSS lint with `color-no-hex: true` applied to every CSS file except the single designated token file.
  - `@axe-core/react@^4.10` (dev-only dynamic import) — wired in the showcase view to report WCAG AA contrast failures at runtime.
- Root devDeps:
  - No new root dependencies. The custom ESLint rule that scans JSX `style={{ }}` attributes for hex literals and raw font-family strings ships as a local rule file under `eslint-rules/` registered by the root flat config.
- No router library introduced in Phase 1. The dev-only showcase is selected via a `window.location.pathname === '/_showcase'` check in `main.tsx`, gated on `import.meta.env.DEV`. Phase 6 replaces this with `react-router-dom` v6 per the constitution.
- No state management, HTTP client, or socket client introduced in Phase 1. Per FR-021, the prototype's `localStorage` state mechanism is explicitly NOT ported.
- No test tooling added in Phase 1 (FR-020 scope boundary; Phase 0 clarification defers test tooling to the first phase that writes a test).

**Storage**: N/A. Phase 1 is frontend-only; no DB migrations, no backend code touched.

**Testing**: Out of scope (aligned with Phase 0's deferral). Phase 1 verifies visually via the `/_showcase` route plus three automated checks in CI: (1) `stylelint` on `.css` files, (2) the custom ESLint rule on `.tsx` files, (3) the `verify-handoff.mjs` script that recomputes the bundle SHA256 and compares to `HANDOFF_VERSION.md`. An `axe-core` runtime pass is attached to the showcase for the a11y verification at exit (FR-013a, SC-009).

**Target Platform**: Evergreen browsers (Chromium, Firefox, Safari latest-1). The frontend is served by Vite in dev and as a static bundle in production. `prefers-reduced-motion` is a native CSS media query; no polyfill.

**Project Type**: Web application — monorepo frontend-only work in this phase. Layout inherited from Phase 0 (pnpm workspaces: `apps/backend`, `apps/frontend`, `packages/shared`).

**Performance Goals**:

- First Contentful Paint parity with the handoff prototype on a cold load: the landing view paints with the correct faces and colors in one render, no flash-of-fallback-font on a production build served locally (SC-011).
- The monorepo type-check continues to complete in ≤60 seconds locally (Phase 0 SC-004 inherited, Phase 1 SC-008).
- Production build size: the `/_showcase` route and every component reachable only from it tree-shake out entirely (SC-010). A size-diff sanity check at exit: the prod bundle grows by no more than the incremental cost of the primitives + tokens + brand icons + Lucide subset actually imported by non-showcase code (≈ single-digit KB gz for tokens + animations + Lucide tree-shaken icons).

**Constraints**:

- **No hard-coded hex colors or raw font-family strings** anywhere under `apps/frontend/src/**` except the single token file (FR-006). Enforced by `stylelint` (CSS) and a custom ESLint rule (TSX inline styles).
- **No third-party font CDN requests in production** (FR-007a). Mulish and the display-font stand-in are self-hosted under `apps/frontend/public/fonts/`.
- **Tailwind Preflight MUST be disabled** in `tailwind.config.ts`. The handoff's `tokens.css` is the reset/body-base-style; Tailwind provides utilities only.
- **No duplicate generic icon library**: Lucide is the single generic icon source (FR-010a). A custom ESLint rule forbids importing from other generic-icon packages (e.g., `heroicons`, `react-icons`, `@radix-ui/icons`) in `apps/frontend/src/**`.
- **Every Phase 1 animation guarded by `@media (prefers-reduced-motion: no-preference)`** — animations collapse to instant state changes when the user prefers reduced motion (FR-013a).
- **Handoff bundle integrity**: `docs/design/zonite-game/` matches the SHA256 recorded in `docs/design/HANDOFF_VERSION.md`; CI fails if it drifts (FR-002a).

**Scale/Scope** (Phase 1 deliverables):

- Frontend source files added / modified: approximately **40-60**. Rough breakdown:
  - 2 style files: `tokens.css`, `animations.css`.
  - 4 layout primitives: `Shell`, `TopBar`, `CornerBlobs`, `GridBg`.
  - 3 common primitives: `PlayerChip`, `Countdown`, icon exports (including ~8 custom brand icons).
  - 11 UI primitives: `Button`, `Input`, `Field`, `OtpField`, `Badge`, `Modal`, `Alert`, `Avatar`, `Slider`, `SegButton`, `Chip`.
  - 1 game primitive: `GridCell`.
  - 1 dev-only showcase page split into category sections (tokens, layout, ui, common, game, animations).
  - 1 a11y harness (axe-core wiring for the showcase).
  - 4 config / tooling files: `tailwind.config.ts`, `postcss.config.js`, `stylelint.config.cjs`, `eslint-rules/no-hex-in-jsx.js`.
- Repository-root additions: `docs/design/zonite-game/` (~20 files from the handoff bundle), `docs/design/HANDOFF_VERSION.md`, `scripts/verify-handoff.mjs`, `.github/workflows/verify-handoff.yml` (or an added step to the existing CI workflow).
- Spekit deliverables: 3 new Speks + screenshots of 11 prototype screens attached to the design-system Spek.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Evaluated against [.specify/memory/constitution.md](../../.specify/memory/constitution.md) v1.0.0.

### Principle I — Shared Contract Source of Truth

- **Compliant.** Phase 1 adds no cross-wire types, payloads, or socket event names. The token file, primitives, animations, and icons are all frontend-only concerns. `packages/shared` is not modified; no risk of duplicated enums or event constants. If a future primitive grows a prop shape that later phases need to serialize over the wire, that shape will land in `packages/shared` at the time the cross-wire use appears (not speculatively in Phase 1).

### Principle II — Sikka Backend Parity (NON-NEGOTIABLE)

- **Not exercised (out of scope).** Phase 1 does not touch `apps/backend` beyond confirming it still builds. No controllers, services, DTOs, decorators, or response-envelope concerns are introduced or modified. The principle cannot be violated because Phase 1 does not open the surface.

### Principle III — Yalgamers Design Fidelity

- **Compliant, and this is the phase that operationalizes the principle.** The constitution mandates: design tokens live in a single source file consumed by the frontend; reusable primitives live in `apps/frontend/src/components/ui/`; hard-coded hex values and font stacks in components are banned outside the token file. Phase 1 delivers every one of these: `tokens.css` as the single source of truth, the `components/{layout,ui,common,game}/` libraries, and the `stylelint` + custom-ESLint gate that blocks hex/font-family violations (FR-015, FR-016, SC-002, SC-005).
- **One resolved nuance**: the constitution's Principle III names `design-tokens.ts` OR `tailwind.config.ts` OR `tokens.css` as the single source of truth. Phase 1 picks **`tokens.css`** because the handoff bundle ships tokens in that shape verbatim and rewriting them as TS losses the `@font-face` / `:root` / `::-webkit-scrollbar-*` / keyframe-compatible declaration blocks. Tailwind's `tailwind.config.ts` theme wraps the CSS variables rather than redeclaring values — compliant with FR-005, FR-006.

### Principle IV — Authoritative Real-Time Server

- **Not exercised (out of scope).** Phase 1 ships no socket gateway, no game-state handling, no real-time endpoints, no client socket code. The prototype's `localStorage`-based state is explicitly NOT ported (FR-021). Phase 4 / 5 operationalize this principle.

### Principle V — Spekit-Documented Decisions

- **Compliant.** Phase 1 lands three new Speks in the "Zonite Dev Hub" Topic (FR-023, FR-024, FR-025): (1) token sources and override policy, (2) handoff bundle refresh workflow, (3) Mulish/Gilroy stand-in. Screenshots of every handoff screen are attached to the design-system Spek (FR-026). The Phase-1 feature PR links these Speks in its description, satisfying the Principle V gate for merge.

### Technology & Architectural Constraints

- **Compliant with new notes.**
  - Monorepo layout / path aliases / naming conventions: unchanged.
  - `apps/frontend` stack: Phase 1 adds Tailwind to align with the constitution's "Tailwind (aligned to Yalgamers tokens)" line in the Frontend stack. Tailwind consumes `tokens.css` via its theme extension; Preflight disabled to defer body-base-style ownership to `tokens.css`.
  - Router, state, HTTP, socket clients: deferred to Phase 6 per PLAN.md. Phase 1's dev-only `/_showcase` uses a `pathname` + `import.meta.env.DEV` conditional in `main.tsx` instead of pulling `react-router-dom` forward one phase.
  - Grid config bounds (`width/height ∈ [5, 50]`, `duration ∈ [30, 300]`): Phase 1 showcases a `Slider` primitive that respects these bounds when presented with the board-size example, but does NOT implement any actual room configuration. Enforcement lands with the CreateRoom screen in Phase 7.
  - Local dev stack (Postgres + backend + Vite frontend only): unchanged.

### Development Workflow & Quality Gates

- **Pre-commit**: `lint-staged` runs `eslint` and `prettier` on staged files; extended in this phase with `stylelint` on `.css` files.
- **Type safety**: `pnpm type-check` continues to pass in ≤60s. Tailwind is configured with full TypeScript types for the theme extension so a reference to a missing token name fails the type-check (FR-017).
- **Contract-first**: N/A for Phase 1 (no cross-wire changes).
- **Gameplay verification**: N/A (no gameplay surface touched).
- **Docs sync**: three new Speks ship as part of this phase's merge, per Principle V.

### Gate result

**PASS (pre-design)** — no violations requiring Complexity Tracking entries. Phase 1 operationalizes Principle III and respects the other four principles by staying in the frontend lane.

### Post-design re-check (after Phase 1 artifacts)

Re-evaluated after generating `research.md`, `data-model.md`, `contracts/tokens.contract.md`, `contracts/primitives.contract.md`, `contracts/handoff-refresh.contract.md`, and `quickstart.md`:

- **Principle I**: still compliant. The primitive contracts are frontend-internal; no payload shape is promoted to `packages/shared`.
- **Principle II**: still not exercised.
- **Principle III**: still compliant, and strengthened. The `tokens.contract.md` pins the export surface of `tokens.css` as a named set; the `primitives.contract.md` pins the per-primitive visual-state matrix used by the showcase and the axe-core pass. The `handoff-refresh.contract.md` pins the SHA-verification workflow so a silently-mutated bundle is impossible to merge.
- **Principle IV**: still not exercised.
- **Principle V**: still compliant. The three Speks' content is enumerated in `quickstart.md` with each Spek's title + required body sections.

**Still PASS.** No new Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/003-design-handoff/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — resolves design decisions
├── data-model.md        # Phase 1 output — tokens, primitives, animations as entities
├── quickstart.md        # Phase 1 output — how to run Phase 1 end-to-end
├── contracts/           # Phase 1 output
│   ├── tokens.contract.md          # tokens.css export surface
│   ├── primitives.contract.md      # per-primitive visual-state matrix
│   └── handoff-refresh.contract.md # bundle refresh workflow + SHA CI check
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created here)
```

### Source Code (repository root)

```text
zonite/
├── docs/
│   └── design/
│       ├── HANDOFF_VERSION.md                       # delivery date + SHA256 of the bundle tree
│       └── zonite-game/                             # committed handoff bundle (read-only)
│           ├── README.md
│           ├── chats/chat1.md
│           └── project/
│               ├── Zonite App.html
│               ├── colors_and_type.css
│               ├── assets/
│               │   ├── yalgamers-logo.png
│               │   └── zonite-logo.png
│               └── components/
│                   ├── Auth.jsx
│                   ├── Countdown.jsx
│                   ├── CreateRoom.jsx
│                   ├── Game.jsx
│                   ├── GridCell.jsx
│                   ├── Home.jsx
│                   ├── Icons.jsx
│                   ├── Lobby.jsx
│                   ├── Profile.jsx
│                   ├── Results.jsx
│                   └── Shell.jsx
├── scripts/
│   └── verify-handoff.mjs                           # deterministic hash of docs/design/zonite-game/
├── .github/
│   └── workflows/
│       └── ci.yml                                   # existing CI + a new verify-handoff step
├── eslint-rules/
│   └── no-hex-in-jsx.js                             # custom rule: no hex/fonts in TSX inline styles
├── apps/
│   └── frontend/
│       ├── public/
│       │   └── fonts/
│       │       ├── mulish-v14-latin-400.woff2
│       │       ├── mulish-v14-latin-500.woff2
│       │       ├── mulish-v14-latin-600.woff2
│       │       ├── mulish-v14-latin-700.woff2
│       │       ├── mulish-v14-latin-800.woff2
│       │       ├── inter-v13-latin-400.woff2
│       │       ├── inter-v13-latin-500.woff2
│       │       ├── inter-v13-latin-600.woff2
│       │       ├── inter-v13-latin-700.woff2
│       │       └── bruno-ace-sc-v9-latin-400.woff2
│       ├── src/
│       │   ├── main.tsx                             # dev-only /_showcase pathname switch
│       │   ├── App.tsx                              # placeholder landing (from Phase 0), now uses tokens
│       │   ├── styles/
│       │   │   ├── tokens.css                       # verbatim copy of handoff's colors_and_type.css
│       │   │   │                                    # with @import replaced by @font-face
│       │   │   └── animations.css                   # claimPulse, cellPulse, timerPulse, gridDrift,
│       │   │                                        # zpulse, fadeUp + slider-thumb styling;
│       │   │                                        # every keyframe usage wrapped in
│       │   │                                        # prefers-reduced-motion: no-preference
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Shell.tsx
│       │   │   │   ├── Shell.module.css
│       │   │   │   ├── TopBar.tsx
│       │   │   │   ├── TopBar.module.css
│       │   │   │   ├── CornerBlobs.tsx
│       │   │   │   ├── CornerBlobs.module.css
│       │   │   │   ├── GridBg.tsx
│       │   │   │   └── GridBg.module.css
│       │   │   ├── ui/
│       │   │   │   ├── Button.tsx / Button.module.css
│       │   │   │   ├── Input.tsx / Input.module.css
│       │   │   │   ├── Field.tsx / Field.module.css
│       │   │   │   ├── OtpField.tsx / OtpField.module.css
│       │   │   │   ├── Badge.tsx / Badge.module.css
│       │   │   │   ├── Modal.tsx / Modal.module.css
│       │   │   │   ├── Alert.tsx / Alert.module.css
│       │   │   │   ├── Avatar.tsx / Avatar.module.css
│       │   │   │   ├── Slider.tsx / Slider.module.css
│       │   │   │   ├── SegButton.tsx / SegButton.module.css
│       │   │   │   └── Chip.tsx / Chip.module.css
│       │   │   ├── common/
│       │   │   │   ├── PlayerChip.tsx / PlayerChip.module.css
│       │   │   │   ├── Countdown.tsx / Countdown.module.css
│       │   │   │   └── icons/
│       │   │   │       ├── index.ts                     # re-exports: brand + Lucide subset
│       │   │   │       └── brand/                       # hand-authored SVG components
│       │   │   │           ├── CrownHost.tsx
│       │   │   │           ├── ZoniteLogo.tsx
│       │   │   │           ├── YalgamersLogo.tsx
│       │   │   │           └── … (from Icons.jsx)
│       │   │   └── game/
│       │   │       ├── GridCell.tsx
│       │   │       └── GridCell.module.css
│       │   ├── showcase/                                # dev-only; tree-shaken in prod
│       │   │   ├── Showcase.tsx                         # root view mounted only when DEV && path
│       │   │   ├── Showcase.module.css
│       │   │   ├── sections/
│       │   │   │   ├── TokensSection.tsx                # color / spacing / radius / shadow / type swatches
│       │   │   │   ├── LayoutSection.tsx                # Shell + TopBar + decorative layers
│       │   │   │   ├── UiSection.tsx                    # every ui/* primitive, every state
│       │   │   │   ├── CommonSection.tsx                # PlayerChip, Countdown (with threshold demo), icons
│       │   │   │   ├── GameSection.tsx                  # GridCell states + claim-pulse trigger
│       │   │   │   └── AnimationsSection.tsx            # live triggers for every keyframe animation
│       │   │   └── ReducedMotionToggle.tsx              # sets html[data-reduced-motion='true']
│       │   └── types/
│       │       └── tokens.d.ts                          # string-literal union of valid CSS var names
│       ├── tailwind.config.ts                           # theme extension wraps tokens.css variables; preflight: false
│       ├── postcss.config.js
│       ├── stylelint.config.cjs                         # color-no-hex + font-family disallow list
│       ├── index.html                                   # unchanged
│       ├── Dockerfile                                   # unchanged
│       ├── tsconfig.json                                # unchanged
│       └── package.json                                 # + tailwindcss, clsx, lucide-react; + devDeps
├── packages/                                             # unchanged in Phase 1
│   └── shared/
├── apps/backend/                                         # unchanged in Phase 1
├── eslint.config.mjs                                     # registers ./eslint-rules/no-hex-in-jsx.js
├── .prettierrc                                           # unchanged
├── docker-compose.yml                                    # unchanged
├── README.md                                             # + link to docs/design/zonite-game/README.md
└── pnpm-lock.yaml                                        # updated with Phase 1 deps
```

**Structure Decision**: Frontend-only expansion of the Phase 0 web-application layout. The handoff bundle is committed under `docs/design/` (not `apps/frontend/public/` or `packages/shared/`) so it is clearly **reference material, not shipping code**. The frontend's `src/styles/tokens.css` is the single compiled-into-the-bundle token source; `src/styles/animations.css` keeps keyframes separate so the `prefers-reduced-motion` guards live in one greppable file. Component libraries are split four ways (`layout/`, `ui/`, `common/`, `game/`) following the handoff's own organizational intent: layout wraps the page, `ui/` is generic primitives, `common/` is shared-across-pages specific components, `game/` holds the grid cell (the only game-owned primitive Phase 1 ships). The `showcase/` folder sits adjacent to `components/` — it is source under `src/` (imported by `main.tsx`) but every import path into it is behind the `import.meta.env.DEV` guard so Vite's tree-shaker drops it from prod. Screen-specific primitives (`ModeCard`, `PlayerRow`, `StatCard`, etc., named in FR-012) are NOT scaffolded in this phase; they land with their consuming screen in Phase 7.

## Complexity Tracking

> No Constitution Check violations requiring justification. Table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| _(none)_  | —          | —                                    |
