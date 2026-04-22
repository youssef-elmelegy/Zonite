# Phase 1 Data Model: Design Handoff Adoption

**Feature**: 003-design-handoff
**Date**: 2026-04-20

Phase 1 is frontend-only and ships no wire-crossing payloads. The "data" modeled here is the **design-system substrate**: tokens, primitives, animations, icons, and the handoff manifest. These are TypeScript / CSS artifacts, not persisted records. Each entity below names its shape, its source, and its invariants so contracts, the showcase, and the CI checks can all address it by name.

---

## Entities

### 1. Design Token

**What it is**: A named CSS variable defined under `:root` in `apps/frontend/src/styles/tokens.css`, sourced from the handoff's `colors_and_type.css`.

**Attributes**:

| Attribute  | Type          | Example                                                     |
| ---------- | ------------- | ----------------------------------------------------------- |
| name       | string        | `--accent-yellow`                                           |
| category   | enum          | `brand` \| `semantic` \| `team-cell` \| `gradient` \| `radius` \| `spacing` \| `typography` \| `motion` \| `breakpoint` \| `blur` \| `weight` \| `font-size` \| `line-height` |
| value      | string        | `rgb(253, 235, 86)`                                         |
| alias_of   | string \| null | `--cell-own` aliases `--team-blue`; brand tokens are `null` |
| surface_use | string \| null | For color tokens: a short note like "body background" or "hot CTA text"; null for non-color tokens |

**Identity**: the CSS variable name is unique across the file.

**Invariants**:

- Defined in exactly one file (`tokens.css`). A grep for the token's definition across `apps/frontend/src/**` returns exactly one hit.
- Naming convention matches the handoff verbatim (no renames at adoption).
- If `alias_of` is non-null, the value MUST be `var(<alias_of>)` — aliases never re-declare the underlying value.
- Category assignment is deterministic and documented in `tokens.contract.md`'s category table.

**Relationships**: A `UiPrimitive` consumes zero-or-more tokens. A `Brand Alias` (e.g., `--cell-own`) depends on a `Brand Token` (e.g., `--team-blue`).

---

### 2. Typography Face

**What it is**: A web-font face self-hosted under `apps/frontend/public/fonts/` and registered via `@font-face` in `tokens.css`.

**Attributes**:

| Attribute     | Type           | Example                         |
| ------------- | -------------- | ------------------------------- |
| family        | string         | `Mulish`                        |
| weight        | int            | 400, 500, 600, 700, 800         |
| style         | enum           | `normal` (Phase 1 uses normal only) |
| subset        | string         | `latin`                         |
| source_file   | string         | `/fonts/mulish-v14-latin-400.woff2` |
| font_display  | string         | `swap`                          |
| role          | enum           | `ui` \| `display` \| `mono` \| `ui-fallback` |

**Identity**: (family, weight, style) is unique.

**Invariants**:

- `source_file` MUST be a path under `apps/frontend/public/fonts/` — no third-party URLs.
- Exactly one `@font-face` declaration per (family, weight, style).
- `font_display: swap` for every face in Phase 1 (documented decision).
- The font family name as used inside CSS (`font-family: 'Mulish'`) MUST match the name assigned in the corresponding `@font-face` block.

**Relationships**: `Typography Face`s compose the `--font-ui` / `--font-display` / `--font-mono` tokens.

---

### 3. Animation

**What it is**: A `@keyframes` rule defined in `apps/frontend/src/styles/animations.css`, with at least one guarded consumer.

**Attributes**:

| Attribute       | Type     | Example                                                                             |
| --------------- | -------- | ----------------------------------------------------------------------------------- |
| name            | string   | `claimPulse`                                                                        |
| duration        | string   | `400ms`                                                                             |
| easing          | string   | `var(--ease-out)`                                                                   |
| iteration       | string   | `1`                                                                                 |
| purpose         | string   | "Plays once when a grid cell flips to claimed"                                      |
| reduced_motion_fallback | string | "Cell still flips color; scale/brightness pop is suppressed"                  |
| consumers       | string[] | `["GridCell"]` (Phase 1); grows as later phases add consumers                       |

**Phase 1 animation set**:

| Name         | Purpose                                     | Phase 1 consumers         |
| ------------ | ------------------------------------------- | ------------------------- |
| `claimPulse` | Cell claim "pop"                            | `GridCell`                |
| `cellPulse`  | Subtle idle pulse on the Home mini-grid     | `GridBg` (showcase)       |
| `timerPulse` | Countdown critical state (≤ 10s)            | `Countdown`               |
| `gridDrift`  | Slow backdrop drift                         | `GridBg`                  |
| `zpulse`     | Loading-indicator dot pulse                 | (reserved, no Phase 1 consumer) |
| `fadeUp`     | Route / section transition                  | `Shell` / `Showcase`      |

**Invariants**:

- Every `animation:` property that references one of these keyframes MUST sit inside a `@media (prefers-reduced-motion: no-preference)` block (FR-014, FR-013a).
- The `reduced_motion_fallback` description MUST describe how information is still conveyed when motion collapses.

---

### 4. UI Primitive

**What it is**: A React component exported under one of `components/{layout,ui,common,game}/`, ported from the handoff prototype.

**Attributes**:

| Attribute              | Type     | Example                                            |
| ---------------------- | -------- | -------------------------------------------------- |
| name                   | string   | `Button`                                           |
| category               | enum     | `layout` \| `ui` \| `common` \| `game`             |
| variants               | string[] | `["primary", "secondary", "ghost", "link"]`        |
| states                 | string[] | `["default", "hover", "focus", "active", "disabled", "loading"]` |
| documented_surface     | string[] | `["--bg-page", "--bg-card", "--bg-elevated"]` (background tokens the primitive is tested against) |
| text_contrast_ratios   | object   | `{ "primary on bg-page": "14.1:1" }` (WCAG AA minimum 4.5:1 for body; auto-fail review if below) |
| consumed_tokens        | string[] | `["--accent-yellow", "--ink-900", "--radius-md", "--sp-2"]` |
| consumed_animations    | string[] | `[]` (Button has no keyframe animations — transitions only) |
| keyboard_behavior      | string   | "Enter / Space activates; Tab reaches; Esc not bound" |
| a11y_role              | string   | `button` (native `<button>` ships the role)        |
| props_sketch           | object   | `{ variant: Variant; size?: Size; disabled?: boolean; loading?: boolean; onClick: () => void }` (conceptual, not TS) |
| source_prototype_file  | string   | `docs/design/zonite-game/project/components/Auth.jsx::Button` |

**Phase 1 primitive set** (pinned in `primitives.contract.md`):

- **Layout (4)**: `Shell`, `TopBar`, `CornerBlobs`, `GridBg`
- **Common (3)**: `PlayerChip`, `Countdown`, `Icons` (icon exports barrel — technically a module not a component)
- **UI (11)**: `Button`, `Input`, `Field`, `OtpField`, `Badge`, `Modal`, `Alert`, `Avatar`, `Slider`, `SegButton`, `Chip`
- **Game (1)**: `GridCell`

**Invariants**:

- A primitive MUST NOT require per-call-site CSS to look correct (FR-009, FR-013).
- Every listed state MUST be renderable in the showcase (FR-022b, SC-004).
- Interactive primitives meet the keyboard behavior documented for them.
- Contrast ratios MUST meet WCAG 2.1 AA on every documented surface (SC-009).

**Relationships**: Consumes `Design Token`s. Optionally consumes `Animation`s. Icon primitives re-export members of the `Icon Set` (below).

---

### 5. Icon

**What it is**: A React component under `components/common/icons/` re-exported through the `icons/index.ts` barrel.

**Attributes**:

| Attribute  | Type      | Example                                      |
| ---------- | --------- | -------------------------------------------- |
| name       | string    | `IconCopy`                                   |
| source     | enum      | `brand` \| `lucide`                          |
| sizing     | string    | "viewBox 24×24; inherits current color"      |
| a11y       | string    | "Decorative by default (`aria-hidden=true`); pass `title` prop to expose to AT" |

**Phase 1 icon set** (pinned in `primitives.contract.md`):

- **Brand (source: `brand`)**: `ZoniteLogo`, `YalgamersLogo`, `IconCrownHost`, plus any remaining hand-drawn icon from `Icons.jsx`. Exact list frozen during implementation when `Icons.jsx` is inspected file-by-file.
- **Generic (source: `lucide`)**: `IconCopy`, `IconClose` (Lucide `X`), `IconChevronDown`, `IconChevronUp`, `IconChevronLeft`, `IconChevronRight`, `IconCheck`, `IconCheckCircle`, `IconXCircle`, `IconEye`, `IconEyeOff`, `IconSearch`, `IconInfo`, `IconWarn`, `IconSettings`, `IconUser`, `IconArrowLeft`, `IconArrowRight`.

**Invariants**:

- Exactly one `index.ts` barrel re-exports all icons. No deep imports from `components/common/icons/brand/*` outside the barrel.
- Lucide is the only generic-icon source; importing from another generic-icon package anywhere under `apps/frontend/src/**` is a lint violation (FR-010a).

---

### 6. Design Handoff Bundle

**What it is**: The committed, read-only folder `docs/design/zonite-game/`.

**Attributes**:

| Attribute       | Type    | Example                                                |
| --------------- | ------- | ------------------------------------------------------ |
| root_path       | string  | `docs/design/zonite-game`                              |
| files           | string[] | 20-ish paths; see plan's Project Structure            |
| adopted_at      | ISO-date | `2026-04-20`                                          |
| bundle_source   | string  | `Claude Design (claude.ai/design) export 53AOn…`       |
| expected_sha256 | hex-string | 64 chars                                             |

**Invariants**:

- Committed contents match `expected_sha256` in `docs/design/HANDOFF_VERSION.md` (FR-002a).
- No file under `root_path` is edited in place — the bundle is replaced as a whole on refresh (FR-002).

---

### 7. Handoff Version Manifest

**What it is**: `docs/design/HANDOFF_VERSION.md` — the single file recording the adopted bundle version.

**Attributes**:

| Attribute       | Type       | Example                                            |
| --------------- | ---------- | -------------------------------------------------- |
| adopted_at      | ISO-date   | `2026-04-20`                                       |
| bundle_source   | string     | `Claude Design export …`                           |
| expected_sha256 | hex-string | 64 chars                                           |

**Invariants**:

- Exactly one such file in the repo.
- Updated in the same PR that updates the bundle tree (no partial commits).
- CI `scripts/verify-handoff.mjs` recomputes and matches on every PR.

---

### 8. Override Policy Document

**What it is**: `docs/design/OVERRIDE_POLICY.md`.

**Attributes**:

| Attribute | Type     | Example                                                                                |
| --------- | -------- | -------------------------------------------------------------------------------------- |
| sections  | string[] | `["When to add a new token", "When a local style exception is permissible", "What reviewers block"]` |
| mirror_url | string  | Spekit URL (filled when the Spek is published; recorded in the MD)                     |

**Invariants**:

- Content is mirrored into the Spekit Spek "Zonite Design System — token sources and override policy" (FR-019, FR-023).
- Changes to the policy update both files in the same PR (Principle V).

---

### 9. Spekit Topic Entry

**What it is**: A Spek in the "Zonite Dev Hub" Topic documenting a design-system decision.

**Attributes**:

| Attribute         | Type     | Example                                                          |
| ----------------- | -------- | ---------------------------------------------------------------- |
| title             | string   | `Zonite Design System — token sources and override policy`       |
| required_sections | string[] | `["Where tokens come from", "Override policy", "Lint enforcement", "How to refresh"]` |
| attachments       | string[] | screenshot filenames                                             |
| last_updated      | ISO-date | `2026-04-20`                                                     |

**Phase 1 required Speks** (all three must exist before Phase 1 is declared complete):

1. `Zonite Design System — token sources and override policy` — mirrors `OVERRIDE_POLICY.md` and links to `tokens.css`.
2. `Claude Design handoff bundle — what it is and how to update` — explains bundle semantics, SHA manifest, refresh workflow.
3. `Zonite typography — Gilroy vs. Mulish fallback` — records the stand-in and the single-file swap.

Plus attached screenshots of all 11 handoff screens (onboarding, login, signup, forgot, reset, home, create, lobby, game, results, profile).

**Invariants**: Exactly these three Speks at minimum; PRs that revise a design decision MUST update the corresponding Spek in the same PR (Principle V).

---

## State / lifecycle

Most entities here are static — defined once, consulted many times. The dynamic parts:

- **Design Token** / **Animation** / **UI Primitive** values update when the handoff bundle is refreshed; the refresh PR updates `HANDOFF_VERSION.md` + affected source files together.
- **Spekit Topic Entry** updates when any governing rule changes (enforced by review per Principle V).
- **Handoff Bundle** is append-only in practice: once a version is adopted it stays in git history even after a refresh replaces its contents.

## Relationships summary (diagrammatic)

```
Design Handoff Bundle ──pins──► Handoff Version Manifest
                            │
                            └──inspiration──► Typography Face, Design Token, Animation, UI Primitive, Icon
                                                                                    │
UI Primitive ──consumes──► Design Token (many)                                      │
UI Primitive ──optionally consumes──► Animation                                     │
UI Primitive ──re-exports / imports──► Icon                                         │
Brand Alias (Design Token) ──aliases──► Brand Token (Design Token)                  │
Design Token ──composes──► Typography Face (for --font-* tokens)                    │
                                                                                    │
Override Policy Document ──mirrored-in──► Spekit Topic Entry                        │
Spekit Topic Entry ──attaches──► screenshot                                         │
All of the above ──covered-by──► Showcase route ──audited-by──► axe-core
```

No database, no migrations, no state machines. Everything above is either source code / CSS / Markdown / SVG in this repo or a Spek in the external Spekit Topic.
