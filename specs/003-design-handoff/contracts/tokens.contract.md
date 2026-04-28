# Contract: Tokens Source File

**File**: `apps/frontend/src/styles/tokens.css`
**Role**: Single authoritative export surface of every design token the Zonite frontend is permitted to use.
**Owning phase**: 003-design-handoff (this phase ships it)

## Purpose

This file is the compile-time and runtime source of truth for every color, typography, spacing, radius, shadow, breakpoint, motion, and blur value used in `apps/frontend/src/**`. Every other place — components, CSS modules, Tailwind theme, inline styles — consumes tokens from here by name. No other file declares a token value.

## Shape

```css
/* tokens.css — single authoritative token file */

/* Section A — @font-face declarations (Phase 1 self-hosts web fonts) */
@font-face { font-family: 'Mulish';        src: url('/fonts/mulish-v14-latin-400.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: 'Mulish';        src: url('/fonts/mulish-v14-latin-500.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
/* … 500/600/700/800 Mulish, 400-700 Inter, 400 Bruno Ace SC … */

/* Section B — :root token declarations (copied verbatim from the handoff's colors_and_type.css) */
:root {
  --ink-900: rgb(16, 6, 19);
  --accent-yellow: rgb(253, 235, 86);
  /* … every token from the handoff … */

  --cell-own: var(--team-blue);      /* aliases reference, never re-declare */
  --cell-opponent: var(--team-red);
}

/* Section C — base/global selectors (body resets, semantic type classes, scrollbar styling) */
body, .p { font-family: var(--font-ui); font-weight: var(--fw-medium); … }
.h1, h1  { font-family: var(--font-display); … }
::-webkit-scrollbar { width: 8px; … }
```

Sections A, B, and C appear in that order. No other content lives in this file.

## Token category table (canonical category assignment for every variable)

| Category    | Tokens (non-exhaustive example)                                                                                                                           | Notes                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| brand       | `--ink-900/850/800/700`, `--accent-yellow*`, `--magenta-*`, `--fire-red/pink`, `--sky-*`, `--cyan-*`, `--lime-*`, `--orange-500`, `--peach-300`, `--fg-*` | Raw brand palette                                          |
| semantic    | `--bg-page/elevated/card/card-solid/overlay`, `--border-subtle/default/strong/accent`, `--focus-ring`                                                     | Named roles; reference brand tokens via `var(...)`         |
| team-cell   | `--team-red*`, `--team-blue*`, `--team-neutral`, `--cell-empty*`, `--cell-hover*`, `--cell-own`, `--cell-opponent`, `--cell-disabled`                     | Game-specific aliases                                      |
| gradient    | `--grad-fire`, `--grad-magenta-glass/solid`, `--grad-lime`, `--grad-page-veil`                                                                            | Multi-stop gradients for signature surfaces                |
| radius      | `--radius-xs` (4) → `--radius-3xl` (40), `--radius-pill` (100px), `--radius-full` (9999px)                                                                | —                                                          |
| spacing     | `--sp-0` … `--sp-16` (4pt scale)                                                                                                                          | —                                                          |
| typography  | `--font-ui`, `--font-display`, `--font-mono`, `--fw-regular/medium/semibold/bold`, `--fs-xs` … `--fs-3xl`, `--lh-tight/snug/normal/loose`                 | Font families resolve to `@font-face`-declared families    |
| motion      | `--ease-out`, `--ease-in-out`, `--dur-fast/base/slow`                                                                                                     | Consumed by `animations.css` and primitives                |
| breakpoint  | `--bp-mobile` (375), `--bp-tablet` (768), `--bp-desktop` (1280), `--bp-wide` (1920)                                                                       | Reference values; actual media queries live near consumers |
| blur        | `--blur-sm/md/lg`                                                                                                                                         | For glass surfaces                                         |
| shadow/glow | `--glow-sky/yellow/magenta/red`, `--shadow-card/lift`                                                                                                     | —                                                          |

The full token list comes verbatim from the handoff's `colors_and_type.css`. This table is the consumer-facing category summary; the source file is the exhaustive list.

## Consumer rules

1. **Any style value consumed outside `tokens.css` MUST be referenced as a token**. Concretely:
   - CSS / CSS Module: `color: var(--accent-yellow)` / `padding: var(--sp-3)`.
   - TSX inline style: `style={{ color: 'var(--accent-yellow)', padding: 'var(--sp-3)' }}` — the value is always a `var(...)` expression, never a literal.
   - Tailwind theme: maps wrap CSS variables (e.g., `colors: { accent: { yellow: 'var(--accent-yellow)' } }`), never redeclare values.

2. **Hard-coded hex color** anywhere under `apps/frontend/src/**` except `tokens.css` is a **lint error**:
   - Stylelint rule `color-no-hex: [true, { severity: 'error' }]` catches CSS / CSS Modules.
   - Custom ESLint rule `no-hex-in-jsx` catches TSX inline styles.
   - Ignore: `apps/frontend/src/styles/tokens.css` (the token definitions).

3. **Raw `font-family` declaration** (a string literal like `'Mulish'` or `'system-ui, sans-serif'`) outside `tokens.css` is a **lint error**. The only valid `font-family` values in consumer files are `var(--font-ui)`, `var(--font-display)`, `var(--font-mono)`.

4. **Raw pixel spacing** (e.g., `padding: 12px`) is discouraged but not lint-blocked in Phase 1. Review catches it; the guidance is in `OVERRIDE_POLICY.md`.

5. **Alias tokens** (`--cell-own`, `--cell-opponent`, etc.) MUST reference their base token via `var(...)` — not re-declare the RGB value.

## Integrity

- The file is line-for-line identical to the handoff's `colors_and_type.css` **with one exception**: the `@import` block at the top (Google Fonts URLs) is replaced by local `@font-face` declarations referencing `/fonts/*.woff2`. The rest — token declarations, base selectors, keyframes if any — is verbatim.
- The handoff SHA verification (`scripts/verify-handoff.mjs`) hashes the bundle tree (including the original `colors_and_type.css`), so any mutation to that reference file — including the font rewire — happens only in `tokens.css`, never in the handoff copy.

## When this contract changes

A handoff refresh that introduces new tokens, renames tokens, or removes tokens updates this file. The refresh PR:

1. Replaces the bundle tree under `docs/design/zonite-game/`.
2. Updates `HANDOFF_VERSION.md` with the new SHA.
3. Diffs the handoff's new `colors_and_type.css` into `tokens.css` (re-applying the `@import` → `@font-face` rewire).
4. Updates `tokens.d.ts` if the set of variable names changed.
5. Updates the Tailwind theme extension if new color tokens need Tailwind-utility access.
6. Updates this contract's category table if a category was added.
7. Re-runs the showcase visual-diff pass.

No other kind of change to `tokens.css` is permitted. A PR that adds a new token without a handoff refresh is a violation unless explicitly approved per the override policy ("When to add a new token").
