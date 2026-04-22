# Contract: UI Primitive Library

**Location**: `apps/frontend/src/components/{layout,ui,common,game}/`
**Role**: The frozen Phase 1 primitive inventory with per-primitive state matrix, consumed-token list, documented surface, and keyboard behavior.
**Owning phase**: 003-design-handoff

## Purpose

Pins the Phase 1 primitive set so (a) the showcase renders every primitive in every state, (b) the axe-core runtime pass has a stable target, (c) the lint rule that blocks raw hex/fonts has a known set of files to skip, and (d) Phase 7 engineers can consult a single place to learn which primitives exist.

## Visual-state matrix per primitive

For each primitive: `variants`, `states`, `documented_surface` (background tokens the primitive is tested against), `consumed_tokens` (abbreviated; full set in the component's source), `consumed_animations`, and the `keyboard_behavior`.

### Layout primitives

#### `Shell`
- **Path**: `components/layout/Shell.tsx`
- **Source**: `Shell.jsx::Shell`
- **Variants**: `default` (shell wraps entire app)
- **States**: `default`
- **Documented surface**: `--bg-page` as the outermost surface; sets `--bg-page` via CSS on the root itself.
- **Consumed tokens**: `--bg-page`, `--font-ui`, `--fg-primary`; composes `TopBar`, `CornerBlobs`, `GridBg`
- **Consumed animations**: `fadeUp` (applied to the child slot when a `key` changes)
- **Keyboard**: not interactive.

#### `TopBar`
- **Path**: `components/layout/TopBar.tsx`
- **Source**: `Shell.jsx::TopBar`
- **Props sketch**: `{ onHome?: () => void; right?: ReactNode }`
- **Variants**: `default`
- **States**: `default`, `with-player-chip`, `with-nav-dev`
- **Documented surface**: `--bg-elevated`
- **Consumed tokens**: `--bg-elevated`, `--border-subtle`, `--fg-primary`, `--sp-4`, `--sp-6`, `--radius-full`
- **Keyboard**: logo link is a native `<a>` or `<button>` — Enter/Space activates.

#### `CornerBlobs`
- **Path**: `components/layout/CornerBlobs.tsx`
- **Source**: `Shell.jsx::CornerBlobs`
- **Props sketch**: `{ intensity?: 0 | 1 }`
- **Variants**: `default`
- **States**: `hidden` (intensity 0), `visible` (intensity 1)
- **Documented surface**: `--bg-page` (decorative layer absolutely positioned behind content)
- **Consumed tokens**: `--grad-fire`, `--grad-magenta-glass`, `--blur-lg`
- **Keyboard**: `aria-hidden="true"` (purely decorative).

#### `GridBg`
- **Path**: `components/layout/GridBg.tsx`
- **Source**: `Shell.jsx::GridBg`
- **Variants**: `default`
- **States**: `static`, `animated` (drift when `prefers-reduced-motion: no-preference`)
- **Documented surface**: `--bg-page` (decorative layer)
- **Consumed tokens**: `--border-subtle`, `--fg-faint`
- **Consumed animations**: `gridDrift`
- **Keyboard**: `aria-hidden="true"`.

### Common primitives

#### `PlayerChip`
- **Path**: `components/common/PlayerChip.tsx`
- **Source**: `Shell.jsx::PlayerChip`
- **Props sketch**: `{ player: string; xp?: number; onClick?: () => void }`
- **Variants**: `default`, `interactive` (has `onClick`)
- **States**: `default`, `hover` (only when interactive), `focus`, `disabled`
- **Documented surface**: `--bg-elevated`
- **Consumed tokens**: `--fg-primary`, `--fg-tertiary`, `--sky-300`, `--border-subtle`, `--radius-full`, `--sp-2`, `--sp-3`
- **Contrast**: name on `--bg-elevated` ≥ 7:1; XP numeric (`--sky-300`) on `--bg-elevated` ≥ 4.5:1
- **Keyboard**: when interactive, Enter/Space activates; Tab reaches; focus ring via `--focus-ring`.

#### `Countdown`
- **Path**: `components/common/Countdown.tsx`
- **Source**: `Countdown.jsx`
- **Props sketch**: `{ seconds: number; compact?: boolean; warning?: number }`
- **Variants**: `default`, `compact`
- **States**: `normal` (≥ 21s), `warning` (≤ 20s), `critical` (≤ 10s)
- **Documented surface**: `--bg-card-solid`
- **Consumed tokens**: `--accent-yellow`, `--orange-500`, `--team-red`, `--glow-yellow`, `--glow-red`, `--font-display`, `--fs-2xl`
- **Consumed animations**: `timerPulse` (critical state only, guarded by reduced-motion)
- **Keyboard**: not interactive.
- **Contrast check**: critical-red digits on `--bg-card-solid` ≥ 4.5:1.

#### Icons (barrel)
- **Path**: `components/common/icons/index.ts`
- **Exports**: brand + Lucide (see `data-model.md` entity #5 for the full list).
- **A11y**: decorative by default (`aria-hidden="true"`); pass `title` to surface to screen readers.

### UI primitives

All UI primitives ship `default` / `hover` / `focus` / `active` / `disabled` at minimum unless stated. All shipped on the same documented surface set unless specified.

#### `Button`
- **Props sketch**: `{ variant: 'primary' | 'secondary' | 'ghost' | 'link'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; loading?: boolean; onClick: () => void; leftIcon?: ReactNode; rightIcon?: ReactNode; children: ReactNode }`
- **Variants**: `primary` (yellow filled), `secondary` (outlined), `ghost` (transparent), `link` (text-like)
- **States**: `default`, `hover`, `focus`, `active`, `disabled`, `loading`
- **Documented surface**: `--bg-page`, `--bg-card`, `--bg-elevated`
- **Consumed tokens**: `--accent-yellow*`, `--ink-900`, `--fg-primary`, `--fg-tertiary`, `--radius-md`, `--sp-2`, `--sp-3`, `--sp-4`, `--focus-ring`
- **Contrast**: `primary`: `--ink-900` (near-black) on `--accent-yellow` = **14.1:1**. `secondary`: `--fg-primary` on `--bg-page` = **18:1**. `ghost` / `link`: `--fg-primary` on `--bg-card` = **~17:1**.
- **Keyboard**: native `<button>`, Enter/Space activates, Tab reaches, focus-ring visible.
- **Loading state**: includes an inline spinner icon (Lucide `IconLoader2` or a custom one) + `aria-busy="true"`. Disables interaction.

#### `Input`
- **Props sketch**: `{ type?: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }`
- **States**: `default`, `focus`, `disabled`, `readonly`, `invalid` (pair with `Field` for label + error)
- **Documented surface**: `--bg-card-solid`, `--bg-elevated`
- **Consumed tokens**: `--fg-primary`, `--fg-muted` (placeholder), `--border-default`, `--border-accent`, `--focus-ring`, `--radius-md`, `--sp-3`, `--sp-4`, `--font-ui`, `--fs-body-lg`
- **Contrast**: text on surface ≥ 7:1; placeholder on surface ≥ 4.5:1.
- **Keyboard**: native `<input>`.

#### `Field`
- **Composition of**: label + `Input` + optional hint + optional inline error + optional right slot (icon / action)
- **Props sketch**: `{ label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; hint?: string; right?: ReactNode; autoComplete?: string }`
- **States**: `default`, `focus`, `error`, `disabled`, `with-hint`, `with-right-slot`
- **Documented surface**: inherits from `Input`
- **Consumed tokens**: Input's + `--fg-tertiary` (hint), `--team-red` (error text), `--sp-2`
- **Keyboard**: label `htmlFor` pairs with input `id`; clicking label focuses input.

#### `OtpField`
- **Props sketch**: `{ value: string; onChange: (v: string) => void; length?: 6 }`
- **States**: `default`, `focus` (on each slot), `filled`, `error` (optional)
- **Documented surface**: `--bg-card-solid`
- **Consumed tokens**: Input's + `--sp-2`
- **Keyboard**: **first slot receives Tab**. Typing a digit auto-advances. Backspace on empty slot moves to previous slot. Arrow Left/Right move between slots. Paste distributes across slots. Focus-ring on the currently-active slot.

#### `Badge`
- **Props sketch**: `{ variant: 'red' | 'blue' | 'yellow' | 'neutral' | 'live'; children: ReactNode }`
- **Variants**: `red` (team red), `blue` (team blue), `yellow` (accent), `neutral` (white on dark), `live` (cyan, pulsing)
- **States**: `default`
- **Consumed tokens**: `--team-red*`, `--team-blue*`, `--accent-yellow*`, `--cyan-400`, `--radius-pill`, `--sp-1`, `--sp-2`, `--fs-xs`
- **Consumed animations**: `zpulse` for `live` variant
- **Keyboard**: not interactive.

#### `Modal`
- **Props sketch**: `{ open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg' }`
- **Variants**: `sm`, `md`, `lg`
- **States**: `closed`, `opening`, `open`, `closing`
- **Documented surface**: `--bg-overlay` (backdrop) + `--bg-card-solid` (dialog)
- **Consumed tokens**: `--bg-overlay`, `--bg-card-solid`, `--border-subtle`, `--radius-lg`, `--shadow-lift`, `--blur-md`, `--sp-4`, `--sp-6`
- **Consumed animations**: `fadeUp` on open
- **Keyboard**: **focus trap** while open, **Esc** closes, focus restores to trigger on close, backdrop click closes (configurable).
- **A11y**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at title.

#### `Alert`
- **Props sketch**: `{ variant: 'info' | 'success' | 'warn' | 'danger'; dismissible?: boolean; onDismiss?: () => void; children: ReactNode }`
- **Variants**: `info` (sky), `success` (lime), `warn` (orange), `danger` (red)
- **States**: `default`, `dismissed` (transitions out)
- **Documented surface**: `--bg-card-solid`
- **Consumed tokens**: `--sky-*`, `--lime-*`, `--orange-500`, `--team-red`, `--fg-primary`, `--radius-md`, `--sp-3`
- **Keyboard**: if dismissible, dismiss button focusable, Enter/Space activates.
- **A11y**: `role="status"` for info/success, `role="alert"` for warn/danger.

#### `Avatar`
- **Props sketch**: `{ src?: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; onClick?: () => void }`
- **Variants**: `with-image`, `initials-only`, `interactive` (has onClick)
- **States**: `default`, `hover` (if interactive), `focus`, `loading` (when image is decoding)
- **Consumed tokens**: `--bg-card-solid`, `--accent-yellow`, `--ink-900`, `--radius-full`, `--fw-semibold`
- **Keyboard**: when interactive, behaves as `Button`.
- **A11y**: `img` with `alt={name}` for image; initials receive `aria-label={name}`.

#### `Slider`
- **Props sketch**: `{ label?: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; unit?: string }`
- **States**: `default`, `focus`, `disabled`, `dragging`
- **Consumed tokens**: `--accent-yellow`, `--ink-900`, `--fg-muted` (track), `--glow-yellow` (thumb), `--radius-full`, `--sp-1`
- **Global styling**: uses the global range-input thumb styling from `tokens.css` (FR-015).
- **Keyboard**: Left / Right = ±step; Home / End = min / max; Page Up / Down = ±10 × step; focus-ring on the thumb.
- **A11y**: native `<input type="range">` with `aria-label` + value annunciation.

#### `SegButton` (segmented button group)
- **Props sketch**: `{ options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void; disabled?: boolean }`
- **States**: per-button: `default`, `hover`, `focus`, `active` (selected), `disabled`
- **Documented surface**: `--bg-elevated`
- **Consumed tokens**: `--accent-yellow`, `--border-subtle`, `--fg-tertiary`, `--radius-sm` (per button), `--radius-pill` (group wrapper), `--sp-1`, `--sp-2`
- **Keyboard**: Arrow keys move focus between buttons; Enter / Space activates. Tab enters the group and reaches the active button first.
- **A11y**: `role="radiogroup"` on the wrapper, `role="radio"` + `aria-checked` on each button.

#### `Chip`
- **Props sketch**: `{ variant: 'neutral' | 'brand' | 'success' | 'warn'; interactive?: boolean; onClick?: () => void; onClose?: () => void; children: ReactNode }`
- **Variants**: `neutral`, `brand`, `success`, `warn`, with optional `interactive` and `closable` flags
- **States**: `default`, `hover` (interactive), `focus`, `closing`
- **Consumed tokens**: `--bg-card-solid`, `--fg-primary`, `--fg-tertiary`, `--accent-yellow`, `--lime-400`, `--orange-500`, `--radius-pill`, `--sp-1`, `--sp-2`
- **Keyboard**: interactive chip behaves as `Button`; closable chip's close icon is a separate tab-stop.

### Game primitive

#### `GridCell`
- **Path**: `components/game/GridCell.tsx`
- **Source**: `GridCell.jsx` + `Game.jsx::Cell`
- **Props sketch**: `{ state: 'empty' | 'own' | 'opponent' | 'hover' | 'disabled'; size?: number; label?: string; idx?: number; onClick?: () => void; justClaimed?: boolean }`
- **States**: `empty`, `hover`, `own`, `opponent`, `disabled`, `just-claimed`
- **Documented surface**: `--bg-page` (grid lives on the game canvas background)
- **Consumed tokens**: `--cell-empty`, `--cell-empty-border`, `--cell-hover*`, `--cell-own`, `--cell-opponent`, `--cell-disabled`, `--radius-xs`
- **Consumed animations**: `claimPulse` when `justClaimed=true`, guarded by reduced-motion
- **Keyboard**: when interactive (not disabled, has onClick), Enter/Space activates on the focused cell; Tab reaches it. Arrow keys are NOT implemented in Phase 1 — the game screen in Phase 7 decides whether grid navigation goes primitive-level or screen-level.

---

## Showcase contract

The `/_showcase` route (dev-only; FR-022a) renders:

1. **Tokens section** — every token from the category table as a labeled swatch. Color tokens show the resolved value, the name, and the text of "on --bg-page" + "on --bg-card" with computed contrast ratios (axe runs against these surfaces).
2. **Layout section** — `Shell` wrapping a demo content area with `TopBar`, `CornerBlobs` at intensity 0 and 1, `GridBg` static and animated.
3. **UI section** — every UI primitive from the list above, in every documented state.
4. **Common section** — `PlayerChip` default and interactive, `Countdown` at 30s → 20s → 10s (triggerable), every icon (brand + Lucide) in a grid.
5. **Game section** — `GridCell` in every state, with a "trigger claim" button to demo `claimPulse`.
6. **Animations section** — each of the six animations with a "play" button that applies the keyframe to a demo element.
7. **Reduced-motion toggle** (top of page) — sets `<html data-reduced-motion="true">`; a second visual verification of every animation in its reduced state.
8. **Axe panel** (top of page) — lists every WCAG 2.1 AA failure axe reports against the showcase on mount and on each interaction that re-renders.

## Contract enforcement

A primitive is considered "shipped in Phase 1" only if:

1. Its implementation file exists at the declared path.
2. It appears in the showcase's relevant section rendering every listed state.
3. Its contrast ratios on the documented surface pass WCAG 2.1 AA (4.5:1 body, 3:1 large/UI).
4. Its keyboard behavior matches the row above.
5. Its consumed tokens all come from `tokens.css` (no hard-coded values — lint-gated).
6. Any consumed animation is guarded by `prefers-reduced-motion: no-preference` and has a documented `reduced_motion_fallback` in `animations.css` comments.

A primitive failing any of those is not considered Phase 1 complete; the feature PR may not merge.
