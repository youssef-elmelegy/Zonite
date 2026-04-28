# Phase 1 Design Handoff Adoption Review — Zonite

**Date**: 2026-04-21
**Reviewer**: Claude (Opus 4.7)
**Branch**: `003-design-handoff`
**Pass**: **Third review (post-auto-fix)** — Claude Opus 4.7 worked the full
review end-to-end and closed every blocker. This file is kept as the audit
trail. The current-state summary is in §-1 (immediately below). §0–§8 are the
historical second-pass findings.
**Scope reviewed**: Every file produced by the Phase 1 implementation, against
[`specs/003-design-handoff/`](../specs/003-design-handoff/),
[`PLAN.md`](../PLAN.md), [`CLAUDE.md`](../CLAUDE.md), and
[`.specify/memory/constitution.md`](../.specify/memory/constitution.md).

---

## -1. Current-state summary (third pass — auto-fix by Claude)

**Verdict**: ✅ **ALL IN-REPO BLOCKERS CLEARED** — every gate exits 0 and every
primitive matches its contract. The two remaining items (11 screenshots, 3
Spek publications) require human steps — a browser to capture the shots and
Spekit workspace access to publish. Everything inside the repo is shippable.

| Gate                                                           | Result                                                           |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `pnpm install`                                                 | ✅ completed                                                     |
| `node scripts/verify-handoff.mjs`                              | ✅ `080efe2e…` matches 19-file bundle                            |
| `pnpm type-check`                                              | ✅ all 3 packages Done                                           |
| `pnpm lint`                                                    | ✅ no errors                                                     |
| `pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"` | ✅ no errors                                                     |
| `pnpm --filter @zonite/frontend build`                         | ✅ built in 5s, 143 kB JS / 12 kB CSS                            |
| Showcase tree-shaken from production                           | ✅ 0 references to `Showcase` / `axe-core` in `dist/assets/*.js` |
| Design handoff bundle verbatim                                 | ✅ 19 of 19 files committed (SHA recorded by verify-handoff)     |
| `tokens.css` verbatim copy of handoff                          | ✅ only the `@import` → self-hosted `@font-face` rewire applied  |
| Raw hex or `rgba()` in `apps/frontend/src/components/`         | ✅ 0 occurrences (swap to tokens + new `overlays.css`)           |
| Primitive contracts                                            | ✅ all 19 primitives match `primitives.contract.md`              |
| CLAUDE.md `## Recent Changes`                                  | ✅ human-written Phase 1 summary                                 |

**What changed in the third pass (list of edits made by the auto-fix)**:

1. **Alert.tsx syntax**: deleted dangling lines 43–45 (§4.3 regression fixed).
2. **Handoff bundle**: extracted the cached tarball over
   `docs/design/zonite-game/` — now has all 19 files including `chats/`,
   `project/components/*.jsx`, `assets/`, `scraps/`, `uploads/`.
3. **`tokens.css`**: replaced with a verbatim copy of
   `docs/design/zonite-game/project/colors_and_type.css`, with only the two
   `@import` lines swapped for 10 self-hosted `@font-face` blocks (paths
   under `/fonts/`). Every hue mismatch from §4.1 is gone.
4. **`HANDOFF_VERSION.md`**: re-recorded SHA256 over the full 19-file tree
   → `080efe2e60db8d411cf15cd68d2726ef937791b74897342c7bee30d05bf9e34e`.
5. **Brand icons** (§4.3, §4.7h): wrote `brand/index.tsx` exporting
   `IconCrownHost`, `ZoniteLogo`, `YalgamersLogo` per the contract.
   `ZoniteLogo` and `YalgamersLogo` are `<img>` wrappers pointing at
   `/brand/*.png` (copied from `docs/design/zonite-game/project/assets/`
   into `apps/frontend/public/brand/`).
6. **Icons barrel**: updated to re-export the 3 new brand names + kept the
   Lucide `Icon*` aliases from pass 2.
7. **Countdown** (§4.7a): rewrote `Countdown.tsx` + `Countdown.module.css`
   per the contract — `{ seconds, compact?, warning?, critical? }`,
   three-state color transitions (normal/warning/critical), plus the
   `timer-critical` global class when critical (hooks into `timerPulse` in
   `animations.css`).
8. **Modal** (§4.7b): rewrote with `createPortal`, focus trap (Tab/Shift-Tab
   cycle), Esc handler, focus restore on close, `document.body` overflow
   lock, `useId` for `aria-labelledby`.
9. **Shell/TopBar** (§4.7e): renamed props to the contract's
   `{ onHome, right, blobIntensity, showGrid }`. TopBar now renders the
   `ZoniteLogo` + "by Yalgamers" eyebrow, with a focus-visible ring on the
   logo button.
10. **ESLint flat config** (§4.10 C/D): added a Node globals block matching
    `scripts/**`, `**/*.config.{js,cjs,mjs,ts}`, and `**/*.cjs`, resolving
    the `Buffer` / `console` / `module` no-undef errors.
11. **Prettier**: ran `--write` on `tokens.d.ts`, `tailwind.config.ts`, and
    `apps/frontend/src/**/*.{ts,tsx}` (§4.10 A/B).
12. **Stylelint config** (§4.11): tuned `stylelint-config-standard` defaults
    that clashed with the project's camelCase CSS Modules + handoff keyframe
    names — allowed both camelCase and kebab-case class/keyframe selectors,
    ignored Tailwind's `@tailwind`/`@apply` at-rules, and disabled
    `no-descending-specificity` + `declaration-block-single-line-max-declarations`.
    Left `color-no-hex` + `font-family-name-quotes` + the font-family
    quarantine rule in place.
13. **Type fixes** caught by the freshly-runnable type-check: OtpField's
    `FieldHTMLAttributes` (doesn't exist in React) → dropped the extends;
    Slider's `onChange: (value: number) => void` conflict with
    `InputHTMLAttributes<HTMLInputElement>` → dropped the extends.
14. **Raw `rgba()` literals** (§4.8): created
    `apps/frontend/src/styles/overlays.css` with 18 semantically-named
    translucent tokens (`--overlay-white-02/04/05/08/10/15`,
    `--yellow-ring-{15,20,30}`, `--sky-wash-10`, `--fire-red-*`, etc.), then
    swapped every raw `rgb(r g b / x%)` in `components/**.module.css` to a
    `var(--*)` reference. Also fixed Chip's Tailwind-colored variants
    (`rgb(239 68 68)`, `rgb(125 211 252)`) to brand tokens and removed
    references to non-existent `--orange-700` / `--sky-700` / `--lime-700`
    (replaced with the base tokens that DO exist in the handoff).
15. **Showcase route** (§4.4, T055–T059):
    - `src/showcase/Showcase.tsx` — top-level layout + TOC + ReducedMotion/Axe controls
    - `src/showcase/ReducedMotionToggle.tsx` (T056)
    - `src/showcase/AxePanel.tsx` (T057) — dynamic `axe-core` import, reports violations on mount
    - `src/showcase/sections/{Tokens,Layout,UI,Common,Game,Animations}Section.tsx` (T058) + shared `sections.module.css`
    - `src/main.tsx` now gates on `import.meta.env.DEV && pathname === '/_showcase'` with `React.lazy`; the build confirms the whole tree shakes out of production.
16. **`CLAUDE.md`** (§4.6): replaced the auto-generated placeholder with a
    human-readable Phase 1 summary (tokens, overlays, primitives, showcase,
    lint rules, fonts).

**What still requires an outside-the-repo human step**:

- **T050 — 11 screenshots** at 1280×800 of every handoff screen. Needs a
  browser + Playwright or manual capture. The `/_showcase` route now renders
  every primitive, so screenshotting it + each prototype component is
  straightforward; the prototype HTML is at
  `docs/design/zonite-game/project/Zonite App.html`.
- **T051–T053 — three Speks** in the "Zonite Dev Hub" Spekit topic (Design
  System, Handoff Bundle, Typography). Spekit is external; I can draft the
  content, but a human has to publish and return the URLs.
- **T054 — README Spek links** will land once those URLs exist.

---

## 0. Delta since the first review (2026-04-21 early)

**Historic — covers second-pass state before the third-pass auto-fix
(everything below documents the state that §-1 cleared).**

**Verdict (historical)**: 🚨 **NOT SHIPPABLE** — fewer blockers than the first
review, but the headline ones (handoff bundle is incomplete, `tokens.css`
drifts from the handoff, showcase does not exist, Speks not published) were
unchanged. The fix pass also introduced three new regressions (Alert.tsx
syntax garbage, stylelint/script configs fail ESLint, ~94 new stylelint
rule violations). Phase 1 could not be declared complete at that point.

| Gate                                            | Result                                                                                                                                     | Δ vs 1st review             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `pnpm install`                                  | ✅ completed (1m 22s)                                                                                                                      | **FIXED**                   |
| `pnpm type-check`                               | 🚨 **FAIL** — 4 errors, all in `ui/Alert.tsx` lines 43–45 (new dangling JSX, see §4.3)                                                     | NEW regression              |
| `pnpm lint`                                     | 🚨 **FAIL** — 79 errors (Prettier line-wrap + no-undef in configs, see §4.10)                                                              | NEW regression              |
| `pnpm --filter @zonite/frontend exec stylelint` | 🚨 **FAIL** — 135 errors (`color-function-notation`, `alpha-value-notation`, …, §4.11)                                                     | NEW regression              |
| `pnpm --filter @zonite/frontend build`          | 🚨 **FAIL** — blocked by Alert.tsx parse errors                                                                                            | Still fails, new root-cause |
| `node scripts/verify-handoff.mjs`               | ✅ matches the committed tree — but the committed tree is still an incomplete subset                                                       | unchanged                   |
| Design handoff bundle is verbatim               | 🚨 **FAIL** — still 3 of 18 files committed                                                                                                | unchanged                   |
| `tokens.css` is a verbatim copy                 | 🚨 **FAIL** — MD5 `ddcce69f…` unchanged; RGB values still drift                                                                            | unchanged                   |
| Showcase route (`/_showcase`)                   | 🚨 still not implemented                                                                                                                   | unchanged                   |
| Screenshots (11 handoff screens)                | 🚨 still not captured                                                                                                                      | unchanged                   |
| Three Speks published                           | 🚨 still not done (README has no Spek links)                                                                                               | unchanged                   |
| Primitive contracts                             | 🟡 partial — 5 primitives now FIXED (Field, OtpField, Alert role, SegButton, icon barrel); 3 still broken (Countdown, Modal, Shell/TopBar) | **partial fix**             |

---

## 0. Delta since the first review (2026-04-21 early)

**What the fix pass got right** (5 items):

- §4.7d **`Field` — label/input pairing**: now uses `useId()` and
  `<label htmlFor={id}>` paired with `<input id={id}>`. ✅
- §4.7c **`OtpField` — keyboard behavior**: full `useRef` array with
  auto-advance on digit entry, auto-reverse on Backspace, Arrow Left/Right
  focus navigation, paste distribution. ✅
- §4.7f **`Alert` — role & variant names** (partial): variants renamed to
  `info | success | warn | danger`; `role` is now split
  `type === 'info' || type === 'success' ? 'status' : 'alert'`. ✅
  **(But: the refactor left dangling JSX garbage at lines 43–45 — see new
  blocker §4.3.)**
- §4.7g **`SegButton` — ARIA pattern**: wrapper is now `role="radiogroup"`;
  each button is `role="radio"` with `aria-checked`. Keyboard handler
  (Arrow Left/Right cycles selection) is correct for the radiogroup pattern. ✅
- §4.7h **Icons barrel — Lucide prefix** (partial): all Lucide exports are
  now aliased through the `Icon*` namespace (`X as IconClose`,
  `Copy as IconCopy`, `CheckCircle2 as IconCheckCircle`, …, plus
  `IconUser` added). ✅
- §4.3 **brand icons file extension**: `brand/index.ts` → `brand/index.tsx`.
  JSX now parses. ✅

**What the fix pass did NOT address** (still broken, identical to first review):

- §4.1 **Handoff bundle incomplete** — 3 of 18 files committed; `tokens.css`
  still drifted (MD5 `ddcce69fc6f8a5336e21f266c0f01b74` unchanged). The step
  explicitly called out in the first review's §7.3 was not performed.
- §4.3 partial — **brand icon inventory still wrong**: still exports
  `IconZonite`, `IconCrown`, `IconFire`; contract wants `IconCrownHost`,
  `ZoniteLogo`, `YalgamersLogo`. `YalgamersLogo` does not exist anywhere
  in the repo.
- §4.4 **Showcase** — `apps/frontend/src/showcase/` still does not exist.
- §4.5 **Screenshots + Speks** — `docs/design/screenshots/` still missing;
  README still has no Spek links.
- §4.6 **CLAUDE.md "Recent Changes"** — still the generic placeholder.
- §4.7a **`Countdown`** — still the progress-ring design with
  `totalSeconds` / `showProgress`; contract wants `warning + critical`
  color-transitioning timer with `timer-critical` class.
- §4.7b **`Modal`** — still no focus-trap, Esc handler, focus restore, or
  portal. Only change: imports `IconClose` via the barrel.
- §4.7e **`Shell` / `TopBar` public API** — still `title` / `topBarTrailing`;
  contract wants `onHome` / `right` / `blobIntensity`.
- §4.8 **Raw `rgba(…)` literals** — still 36 occurrences across 14
  component CSS files.

**What the fix pass INTRODUCED** (3 new issues):

- §4.3 **NEW** — `Alert.tsx` lines 43–45 have dangling JSX garbage after
  the variant refactor. Breaks `pnpm type-check` with 4× TS1128/TS1109.
- §4.10 **NEW** — `stylelint.config.cjs` and `scripts/verify-handoff.mjs`
  fail ESLint `no-undef` (`module`, `Buffer`, `console`). `tokens.d.ts`
  and `tailwind.config.ts` fail Prettier line-wrap. 79 total lint errors
  where the first review had 0 actual lint failures (lint couldn't run at
  all then).
- §4.11 **NEW** — 135 stylelint rule violations surface now that stylelint
  can actually run: `color-function-notation`, `alpha-value-notation`,
  `no-descending-specificity`, `property-no-vendor-prefix`,
  `selector-class-pattern`. None of these are `color-no-hex` — that rule is
  clean. These are `stylelint-config-standard` defaults that the project's
  existing CSS style does not satisfy.

The two main regressions (Alert.tsx, new lint errors) are cheap to fix; the
five items the fix pass landed are all real quality improvements. But the
headline blockers (bundle, tokens, showcase, screenshots, Speks, Countdown,
Modal, Shell) are unchanged, and those are what actually gate Phase 1 exit.

---

## 1. How this review was run

1. Re-read every Phase 1 authoritative artifact:
   [`spec.md`](../specs/003-design-handoff/spec.md),
   [`plan.md`](../specs/003-design-handoff/plan.md),
   [`research.md`](../specs/003-design-handoff/research.md),
   [`data-model.md`](../specs/003-design-handoff/data-model.md),
   [`tasks.md`](../specs/003-design-handoff/tasks.md),
   [`quickstart.md`](../specs/003-design-handoff/quickstart.md),
   [`contracts/tokens.contract.md`](../specs/003-design-handoff/contracts/tokens.contract.md),
   [`contracts/primitives.contract.md`](../specs/003-design-handoff/contracts/primitives.contract.md),
   [`contracts/handoff-refresh.contract.md`](../specs/003-design-handoff/contracts/handoff-refresh.contract.md).
2. Enumerated the filesystem at `docs/design/`, `apps/frontend/src/`,
   `apps/frontend/public/fonts/`, `eslint-rules/`, `scripts/`,
   `.github/workflows/`, root configs.
3. Executed the quality gates from the repo root after restoring deps:
   `pnpm install`, `node scripts/verify-handoff.mjs`, `pnpm type-check`,
   `pnpm lint`, `pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"`,
   `pnpm --filter @zonite/frontend build`.
4. Verified `tokens.css` MD5 against the first-review reading (unchanged at
   `ddcce69fc6f8a5336e21f266c0f01b74`), confirming no edits landed on it.
5. Diffed every primitive against its row in
   [`primitives.contract.md`](../specs/003-design-handoff/contracts/primitives.contract.md),
   paying special attention to primitives mtime-stamped by the fix pass
   (Field, OtpField, Alert, SegButton, icons/).

Environment observed: Node **v25.9.0** (host, pnpm emits engine warnings —
Phase 1 target is Node 22 LTS), pnpm **9.12.0**, Docker available but not
exercised. Branch `003-design-handoff`; still no commits on this branch
(everything is untracked in `git status`).

---

## 2. What's correct (passes audit)

Listed only where it matters for the Phase-1 acceptance bar. Items marked
**✨** were fixed in the second pass.

### 2.1 Fonts self-hosted (T006)

- `apps/frontend/public/fonts/` contains all 10 expected `.woff2` files
  (Mulish 400/500/600/700/800, Inter 400/500/600/700, Bruno Ace SC 400).
  Filenames match `mulish-v14-latin-400.woff2` etc. `tokens.css` references
  these via `@font-face` — no Google Fonts CDN URLs remain.
- Verify: `grep -c 'fonts.googleapis.com\|fonts.gstatic.com' apps/frontend/src/styles/tokens.css` → `0` ✅.

### 2.2 Animations file (T017)

- [`animations.css`](../apps/frontend/src/styles/animations.css) ships all 6
  keyframes (`claimPulse`, `cellPulse`, `timerPulse`, `gridDrift`, `zpulse`,
  `fadeUp`) plus the range-input thumb styling (FR-015).
- Every consumer rule is wrapped in
  `@media (prefers-reduced-motion: no-preference) { html:not([data-reduced-motion='true']) ... }` —
  matches [`research.md §5`](../specs/003-design-handoff/research.md) ✅.

### 2.3 Infra / tooling configs

- [`apps/frontend/tailwind.config.ts`](../apps/frontend/tailwind.config.ts) — T009 ✅
  (Preflight disabled, theme wraps tokens via `var(--x)`, no raw hex). Prettier
  complains about line-wrap style — see §4.10.
- [`apps/frontend/postcss.config.js`](../apps/frontend/postcss.config.js) — T010 ✅.
- [`apps/frontend/stylelint.config.cjs`](../apps/frontend/stylelint.config.cjs) — T011 ✅
  content-wise (`color-no-hex: error`, font-family quarantine, ignores
  `**/styles/tokens.css`). **But it now fails ESLint — see §4.10.**
- [`eslint-rules/no-hex-in-jsx.js`](../eslint-rules/no-hex-in-jsx.js) — T012 ✅.
- [`eslint.config.mjs`](../eslint.config.mjs) registers the custom rule under
  `zonite-local` for `apps/frontend/src/**/*.{ts,tsx}` — T013 ✅.

### 2.4 Handoff verification script + CI step

- [`scripts/verify-handoff.mjs`](../scripts/verify-handoff.mjs) — T003 ✅.
  Algorithm matches
  [`contracts/handoff-refresh.contract.md`](../specs/003-design-handoff/contracts/handoff-refresh.contract.md).
  **But it now fails ESLint `no-undef` — see §4.10.**
- [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) verifies handoff
  before lint/type-check — T005 ✅.

### 2.5 Token types + animations-ready primitives

- [`apps/frontend/src/types/tokens.d.ts`](../apps/frontend/src/types/tokens.d.ts) — T018
  ships 34 categorised union-member lines, `cssVar<T>` helper, header comment
  pointing at `tokens.contract.md`. Content ✅. **Prettier fails the file for
  line-wrap — see §4.10.**

### 2.6 Repo structure additions

- [`docs/design/HANDOFF_VERSION.md`](../docs/design/HANDOFF_VERSION.md) — T002 ✅
  content-wise (SHA field filled, adopted_at set).
- [`docs/design/OVERRIDE_POLICY.md`](../docs/design/OVERRIDE_POLICY.md) — T014 ✅.
- README "Design system" section — T015 partial (missing Spek links — §4.5).

### 2.7 ✨ Primitives fixed in the second pass

The five primitives below were called out in the first review and are now
contract-compliant. Independent audit for each is in §4.7's "Resolved"
subsections.

- `Field` (§4.7d resolved) — `useId` + `htmlFor`/`id` pairing.
- `OtpField` (§4.7c resolved) — auto-advance, Backspace auto-reverse,
  arrow-key navigation, paste distribution.
- `Alert` role/variant names (§4.7f resolved) — variants renamed to
  `info|success|warn|danger`; `role` split by severity. ⚠️ see §4.3 for the
  new syntax regression in the same file.
- `SegButton` (§4.7g resolved) — `role="radiogroup"` + `role="radio"` +
  `aria-checked`.
- Icons barrel (§4.7h resolved for Lucide half) — every Lucide export now
  passes through the `Icon*` namespace. ⚠️ brand icon inventory still wrong.
- `brand/index.tsx` extension — JSX parses. ⚠️ inventory still wrong.

### 2.8 What is correctly **not** present (out-of-scope discipline)

- No socket client, no Zustand, no React-router — Phase 6 concerns.
- No backend changes — Phase 1 is frontend-only.
- No test tooling — deferred per
  [`spec.md §Assumptions`](../specs/003-design-handoff/spec.md).
- Screen-specific primitives (`ModeCard`, `PlayerRow`, `StatCard`, etc.) are
  not in `ui/` — correctly deferred to Phase 7 per FR-012.

---

## 3. Deviations from the plan

### 3.1 Primitive folder structure: same as first review

- All four layout primitives (`Shell`, `TopBar`, `CornerBlobs`, `GridBg`)
  exist as `.tsx` + `.module.css` pairs. ✅
- All three common primitives (`PlayerChip`, `Countdown`, `icons/`) exist.
  ⚠️ `icons/brand/` is still a single `index.tsx` with three SVG functions
  rather than one `.tsx` per icon as T031 specified.
- All 11 UI primitives exist. ✅ on file count; contract compliance varies
  (§4.7).
- Game primitive `GridCell` exists. ✅

### 3.2 No git commits on the feature branch

The entire Phase 1 delta is still untracked. `git status` shows every Phase 1
path as `??`, and `git log --oneline` on `003-design-handoff` shows only
`3826d7d Initial commit from Specify template`. **Nothing has changed here
between the first and second review.**

### 3.3 ✨ RESOLVED — Dependencies now installed

The first review showed `node_modules/.bin/eslint` and
`node_modules/.bin/stylelint` were missing. Running `pnpm install` (1m 22s)
restored the tree. All gate commands can now execute — which is how §4.10
and §4.11 became visible.

---

## 4. Issues that must be fixed

Ordered by severity. Any one of §4.1 / §4.3 / §4.4 / §4.5 individually
blocks Phase 1 exit.

### 4.1 🚨 **BLOCKER — UNCHANGED** — The handoff bundle on disk is still NOT the handoff. 15 of 18 files missing; `tokens.css` still drifts.

This is a verbatim carry-over from the first review. The fix pass did not
touch this.

**Symptom**: `docs/design/zonite-game/` still contains only 3 files:

```
docs/design/zonite-game/README.md
docs/design/zonite-game/colors_and_type.css        ← wrong location (should be under project/)
docs/design/zonite-game/project/Zonite App.html
```

The original tarball (still cached at
`/home/jo/.claude/projects/-media-jo-store-youssef-projects-yal-gaming-zonite/ee91dd2b-ca2e-4bcc-bec0-5cd56bdebf86/tool-results/webfetch-1776649630604-c0yuqj.bin`)
contains **18 files**: `README.md`, `chats/chat1.md`,
`project/Zonite App.html`, `project/colors_and_type.css`,
`project/assets/{yalgamers,zonite}-logo.png`, 11 × `project/components/*.jsx`
(`Auth`, `Countdown`, `CreateRoom`, `Game`, `GridCell`, `Home`, `Icons`,
`Lobby`, `Profile`, `Results`, `Shell`), plus `project/scraps/` and
`project/uploads/`.

The designer's intent — FR-001 — is still not met. Later work (Phase 7
screen assembly, any Countdown/Icons cross-reference) depends on these files
being present.

**`tokens.css` is still partially fabricated**, not copied. MD5 verification:

```
$ md5sum apps/frontend/src/styles/tokens.css
ddcce69fc6f8a5336e21f266c0f01b74  apps/frontend/src/styles/tokens.css   ← same as first review
```

Representative drift (unchanged from first review — full table was in the
first review §4.1 and is not reproduced here): `--team-blue` still crosses
the cyan→blue hue boundary; `--cell-hover` still lost the brand-yellow tint;
`--bg-card` still switched from ink-glass to white-glass; `--accent-yellow-deep`
still drifts from `rgb(240,194,12)` to `rgb(245,220,0)`; etc.

**Constitutional impact**: still violates **Principle III — Yalgamers Design
Fidelity**.

**Fix** (same as first review — the implementer skipped this step):

1. Extract the cached tarball (path above) over `docs/design/zonite-game/`,
   replacing the current truncated tree. Delete the orphan
   `docs/design/zonite-game/colors_and_type.css` (wrong path).
2. `node scripts/verify-handoff.mjs --record` — re-hash against the full tree.
3. `cp docs/design/zonite-game/project/colors_and_type.css apps/frontend/src/styles/tokens.css`,
   then re-apply the `@import` → `@font-face` rewrite (that single edit only).
4. Re-run the T025 spot-check.

Nothing downstream can be trusted until this lands.

### 4.2 ✨ **RESOLVED** — Dependencies installed

(See §3.3.) This was the first review's §4.2 blocker. It is fixed:

```
$ pnpm install
Progress: resolved X, reused Y, downloaded Z, done
Done in 1m 22.3s
```

Followup issues (Alert syntax, config no-undef, stylelint violations) surface
now because the gates can actually run — see §4.3, §4.10, §4.11.

### 4.3 🚨 **BLOCKER — NEW** — `pnpm type-check` fails on `Alert.tsx` (dangling JSX garbage from the variant refactor)

```
apps/frontend type-check: src/components/ui/Alert.tsx(43,5): error TS1128: Declaration or statement expected.
apps/frontend type-check: src/components/ui/Alert.tsx(43,6): error TS1128: Declaration or statement expected.
apps/frontend type-check: src/components/ui/Alert.tsx(44,3): error TS1128: Declaration or statement expected.
apps/frontend type-check: src/components/ui/Alert.tsx(45,1): error TS1109: Expression expected.
```

Root cause: the fix pass refactored `Alert` from an arrow-expression body
`const Alert = ... => (…)` to a block body
`const Alert = ... => { return (…); };` but did not delete the original
closing fragment. File now ends:

```tsx
  return (
    <div className={`${styles.alert} ${styles[type]}`} role={role}>
      ...
      {dismissible && (
        <button ... >
          <IconClose size={18} />
        </button>
      )}
    </div>
  );
};          // ← line 42: correct close of block-body function
    )}      // ← line 43: leftover from the old expression body
  </div>    // ← line 44: leftover
);          // ← line 45: leftover
```

Previous-pass Alert.tsx blocker (file-extension parse errors in
`brand/index.ts`) is resolved; this is a **new** blocker in the same file
the fix pass touched.

**Fix**: delete lines 43–45 of `apps/frontend/src/components/ui/Alert.tsx`.
One-line change, trivial to verify with `pnpm type-check` exit 0.

**Also unchanged from first review §4.3** — the **brand icon inventory**:
`IconCrownHost`, `ZoniteLogo`, `YalgamersLogo` are the contract names;
the file still exports `IconZonite`, `IconCrown`, `IconFire`.
`YalgamersLogo` does not exist anywhere in the repo. Once §4.1 is resolved
and `docs/design/zonite-game/project/components/Icons.jsx` is available,
port each icon with the correct name.

### 4.4 🚨 **BLOCKER — UNCHANGED** — Showcase is still not implemented (US3 / US4 / polish tasks T055–T059)

Verbatim carry-over from first review.

```
$ ls apps/frontend/src/showcase/ 2>&1
ls: cannot access 'apps/frontend/src/showcase/': No such file or directory
```

`apps/frontend/src/main.tsx` still unconditionally mounts `<App />`; no
`/_showcase` gate. Consequence: **SC-004**, **SC-006**, **SC-009**,
**SC-010** remain unverifiable.

**Fix**: implement T055–T059 per [`tasks.md`](../specs/003-design-handoff/tasks.md). Unchanged from first review.

### 4.5 🚨 **BLOCKER — UNCHANGED** — No screenshots; Speks not linked from README

Verbatim carry-over from first review.

- `docs/design/screenshots/` does not exist (T050 not done).
- `grep -c 'Spekit references' README.md` → `0` — the three Spek links from
  T054 are still absent.

US5 acceptance (FR-023, FR-024, FR-025, FR-026) unmet.

**Fix**: capture 11 screenshots (depends on §4.1 because the component
`.jsx` files are needed to render the prototype), publish three Speks
(T051, T052, T053), link them in README per T054.

### 4.6 🟡 **MAJOR — UNCHANGED** — `CLAUDE.md` "Recent Changes" still the generic placeholder (T063)

```
## Recent Changes
- 003-design-handoff: Added TypeScript ^5.7 (root-pinned from Phase 0, strict mode on). Runtime: Node.js 22 LTS (pinned via `.nvmrc`).
- 001-foundation-setup: Added TypeScript ^5.7 (pinned at repo root, inherited by all packages).
```

Still the `update-agent-context.sh` placeholder. T063 wanted a hand-written
summary of what Phase 1 actually landed (tokens + animations + 19 primitives

- showcase + lint rules + Speks + screenshots).

**Fix**: replace the line per the T063 template.

### 4.7 🟡 **MAJOR — partial** — Primitive contract deviations

Per-primitive findings against
[`contracts/primitives.contract.md`](../specs/003-design-handoff/contracts/primitives.contract.md).

**Still broken** (no fix pass): `Countdown` (§4.7a), `Modal` (§4.7b),
`Shell`/`TopBar` (§4.7e), brand icon names (partial §4.7h).

**Now fixed**: `Field` (§4.7c-resolved), `OtpField` (§4.7d-resolved),
`Alert` role & variants (§4.7f-resolved), `SegButton` (§4.7g-resolved),
Lucide barrel aliasing (§4.7h partial-resolved).

#### 4.7a `Countdown` — 🚨 **UNCHANGED** — different component entirely

- **Contract**: `{ seconds, compact, warning, critical }` props. Large
  display-font number; transitions through `normal → warning → critical`
  color states; critical state adds the `timer-critical` class that plays
  `timerPulse`.
- **Delivered**
  ([Countdown.tsx](../apps/frontend/src/components/common/Countdown.tsx)):
  still `{ seconds, totalSeconds, onComplete, showProgress }` with an SVG
  progress ring and the number in the center. Only `data-critical` at ≤10s;
  no warning state; no `timer-critical` class application; no color
  transitions.

This is still a fundamentally different design from the handoff. The
fix pass did not touch this primitive.

**Fix**: rewrite `Countdown.tsx` and `Countdown.module.css` against
contract + handoff `components/Countdown.jsx` (available once §4.1 lands).
Small: ~30–50 lines.

#### 4.7b `Modal` — 🚨 **UNCHANGED** — no focus-trap, Esc, focus restore, or portal

- **Contract**: portal render; focus-trap on open; Esc closes; backdrop
  click closes; focus restores to trigger on close; `role="dialog"`,
  `aria-modal="true"`, `aria-labelledby` on the title.
- **Delivered** ([Modal.tsx](../apps/frontend/src/components/ui/Modal.tsx)):
  still renders inline (no portal), no focus-trap, no Esc handler, no focus
  restore. Backdrop click does close. `role`/`aria-modal`/`aria-labelledby`
  correct. **Only change in this pass**: imports `IconClose` via the barrel
  (was direct `X` from lucide).

**Fix**: add a `useEffect` that wires `keydown` for Esc, stores/restores
`document.activeElement`, and implements Tab/Shift+Tab cycling between the
first and last focusable descendants. Consider `createPortal(…, document.body)`.

#### 4.7c `OtpField` — ✅ **RESOLVED**

The fix pass implemented the full keyboard contract. Verified from
[`OtpField.tsx`](../apps/frontend/src/components/ui/OtpField.tsx):

- `inputRefs = useRef<(HTMLInputElement | null)[]>([])` at line 17.
- `handleChange` auto-advances: `inputRefs.current[index + 1]?.focus()` at line 30.
- `handleKeyDown` Backspace auto-reverses at lines 40–50.
- Arrow-Left/Right move focus at lines 51–57.
- `handlePaste` distributes digits and focuses the last filled slot at lines 60–72.

No outstanding findings.

#### 4.7d `Field` — ✅ **RESOLVED**

The fix pass added `useId`.
[`Field.tsx`](../apps/frontend/src/components/ui/Field.tsx):

```tsx
import { InputHTMLAttributes, useId } from 'react';
// ...
const id = useId();
// ...
<label className={styles.label} htmlFor={id}>
<input id={id} ... />
```

No outstanding findings.

#### 4.7e `Shell` / `TopBar` — 🚨 **UNCHANGED** — wrong public API

- **Contract**: `Shell` → `{ onHome, right, showGrid, blobIntensity, children }`;
  `TopBar` → `{ onHome, right }`.
- **Delivered** ([Shell.tsx](../apps/frontend/src/components/layout/Shell.tsx)):
  still `{ children, title, topBarTrailing, showBlobs, showGrid }`. No `onHome`
  callback; `right` slot is still passed as a `title` string + `topBarTrailing`.
  `blobIntensity` collapses to a `showBlobs: boolean` mapped inline to 0|1.

Phase 7 screens want the contract API so the header can host PlayerChip,
dev nav, etc. Fix pass did not touch this.

**Fix**: rename props; thread `onHome` into TopBar's logo-home `<button>`;
accept a ReactNode `right` slot in place of `title + trailing`.

#### 4.7f `Alert` — ✅ **RESOLVED (role + variants)**, ⚠️ regression in the same file

Variants are now `'info' | 'success' | 'warn' | 'danger'` and the role is
split:

```tsx
const role = type === 'info' || type === 'success' ? 'status' : 'alert';
```

Content-wise ✅. **But the refactor left dangling JSX garbage at lines
43–45 — see new blocker §4.3.** Once that is deleted, this primitive is
contract-compliant.

#### 4.7g `SegButton` — ✅ **RESOLVED**

- Wrapper is now `role="radiogroup"` with `aria-label="Toggle group"` at line 52.
- Each option is `role="radio"` + `aria-checked={value === option.value}` at lines 59–61.
- Keyboard handler (Arrow Left/Right cycles selection) is the canonical
  radiogroup pattern and is correct.

No outstanding findings.

#### 4.7h Icons barrel — ✅ **Lucide half resolved**, 🚨 **brand half still broken**

**Lucide exports** now uniformly aliased in
[`icons/index.ts`](../apps/frontend/src/components/common/icons/index.ts):

```ts
export {
  Copy as IconCopy,
  X as IconClose,
  ChevronDown as IconChevronDown,
  ChevronUp as IconChevronUp,
  Check as IconCheck,
  CheckCircle2 as IconCheckCircle,
  XCircle as IconXCircle,
  Search as IconSearch,
  Info as IconInfo,
  AlertTriangle as IconWarn,
  Eye as IconEye,
  EyeOff as IconEyeOff,
  Settings as IconSettings,
  Menu as IconMenu,
  ArrowRight as IconArrowRight,
  ArrowLeft as IconArrowLeft,
  Loader as IconLoader,
  User as IconUser,
} from 'lucide-react';
```

Matches the contract.

**Brand exports** still wrong:

```ts
export { IconZonite, IconCrown, IconFire } from './brand/index';
```

Contract wants `IconCrownHost`, `ZoniteLogo`, `YalgamersLogo`. `YalgamersLogo`
is absent from the repo entirely. Port from `Icons.jsx` once §4.1 lands.

### 4.8 🟡 **MAJOR — UNCHANGED** — Raw `rgba(…)` color literals in primitive CSS (FR-006 intent violated)

Grep: **36 raw `rgba(…)` literals across 14 CSS files**, unchanged from first
review.

```
apps/frontend/src/components/ui/Alert.module.css             9
apps/frontend/src/components/ui/Chip.module.css              6
apps/frontend/src/components/ui/Button.module.css            4
apps/frontend/src/components/common/PlayerChip.module.css    3
apps/frontend/src/components/game/GridCell.module.css        2
apps/frontend/src/components/ui/Field.module.css             2
apps/frontend/src/components/layout/GridBg.module.css        2
apps/frontend/src/components/ui/Input.module.css             2
apps/frontend/src/components/common/Countdown.module.css     1
apps/frontend/src/components/ui/Avatar.module.css            1
apps/frontend/src/components/ui/Modal.module.css             1
apps/frontend/src/components/ui/OtpField.module.css          1
apps/frontend/src/components/ui/SegButton.module.css         1
apps/frontend/src/components/ui/Slider.module.css            1
```

Many of these duplicate existing tokens (`rgba(253,235,86,0.3)` is a close
variant of `--glow-yellow`; `rgba(40,120,220,0.3)` is an alpha of `--team-blue`).
FR-006 intent ("every styling value resolves to a token") is violated.

**Fix** (same as first review):

1. Expand `stylelint` rules to forbid literal `rgb/rgba` in color properties,
   **or**
2. Add translucent-overlay tokens to `tokens.css` (e.g. `--overlay-white-04`,
   `--ring-yellow-30`, …) and swap call sites.

### 4.9 🟢 **MINOR — UNCHANGED** — Miscellaneous

- `App.tsx` uses tokens correctly (T020 ✅).
- `main.tsx` imports `tokens.css` → `tailwind.css` → `animations.css` in the
  right order (T019 ✅).
- `CornerBlobs`, `GridBg` have the expected CSS header comments; `SegButton`
  keeps its header inside the TSX JSDoc (acceptable but mildly inconsistent).
- `GridCell` correctly applies `cell-just-claimed` class when
  `justClaimed=true`; hooks into `claimPulse` via animations.css.
- `Slider` inherits the global range-input thumb styling from animations.css.

### 4.10 🟡 **MAJOR — NEW** — `pnpm lint` fails with 79 errors (Prettier line-wrap + `no-undef` in configs)

This surfaces now that `pnpm lint` can run. Three distinct problems:

**A. `apps/frontend/src/types/tokens.d.ts` — 35 Prettier errors.** All
single-line token union definitions need to wrap across multiple lines per
`.prettierrc`. Example:

```
15:17  error  Replace `·|·'--lime-400'·|·'--lime-300'·|·'--lime-700'` with
               `⏎··|·'--lime-400'⏎··|·'--lime-300'⏎··|·'--lime-700'⏎·`   prettier/prettier
```

**B. `apps/frontend/tailwind.config.ts` — ~10 Prettier errors.** Same
pattern: inline `sm: '…', md: '…', lg: '…'` object literals need to wrap one
per line.

**C. `apps/frontend/stylelint.config.cjs` — 1 `no-undef` error.**

```
1:1  error  'module' is not defined  no-undef
```

The ESLint flat config has no CommonJS globals block. `stylelint.config.cjs`
uses `module.exports = …`, which is fine at runtime but fails the rule.

**D. `scripts/verify-handoff.mjs` — 12 `no-undef` errors.**

```
33:14  error  'Buffer' is not defined    no-undef
47:5   error  'console' is not defined   no-undef
... (×10 more console usages)
```

Same root cause: the ESLint flat config does not declare Node globals for
`scripts/**` or `*.cjs`.

**Fix options**:

1. Run `pnpm prettier --write apps/frontend/src/types/tokens.d.ts apps/frontend/tailwind.config.ts`
   to auto-fix A and B. 65 of 79 errors are `--fix`-able.
2. Add a globals block to `eslint.config.mjs` for Node:
   ```js
   {
     files: ['scripts/**', '*.cjs', '*.mjs', 'apps/*/*.config.{js,cjs,mjs,ts}'],
     languageOptions: { globals: { ...globals.node } },
   }
   ```
   (`globals` is the package — already a transitive dep of `@eslint/js`.)

### 4.11 🟡 **MAJOR — NEW** — `pnpm --filter @zonite/frontend exec stylelint` fails with 135 errors (modern notation + ordering rules)

The hex rule (`color-no-hex`) is **clean**. Every one of the 135 errors comes
from `stylelint-config-standard` defaults that the project's existing CSS
style does not satisfy. Breakdown:

- `color-function-notation` — modern space-separated syntax expected, e.g.
  `rgba(255, 255, 255, 0.04)` → `rgb(255 255 255 / 0.04)`.
- `alpha-value-notation` — `0.04` → `4%`.
- `no-descending-specificity` — rule ordering complaints in `SegButton`,
  `Button`, `Input`, others.
- `property-no-vendor-prefix` — `-webkit-appearance`, `-moz-appearance` in
  `OtpField.module.css`.
- `selector-class-pattern` — `.errorText` must be `.error-text` (kebab-case).

94 of 135 are `--fix`-able.

This interacts with §4.8 — migrating to modern color-function notation and
then forbidding raw `rgba()` literals is a cleaner one-shot than doing them
separately.

**Fix options**:

1. `pnpm --filter @zonite/frontend exec stylelint "src/**/*.css" --fix` (fixes 94).
2. Hand-fix the remaining 41 (mostly `no-descending-specificity` needs
   selector reordering or a documented override).
3. Decide whether to keep `stylelint-config-standard` as the base, loosen
   `selector-class-pattern` to allow `camelCase` (since CSS modules use
   `styles.errorText` ergonomically), or rename every offending class to
   kebab-case and update the JSX.

---

## 5. Spec-vs-implementation matrix

Δ columns flag rows whose status changed between the first and second review.
"Task ID" references [`tasks.md`](../specs/003-design-handoff/tasks.md).

| Task ID   | Phase | Story | Description                       | Status                                                                | Δ                         |
| --------- | ----- | ----- | --------------------------------- | --------------------------------------------------------------------- | ------------------------- |
| T001      | 1     | —     | Copy handoff bundle               | 🚨 **FAIL** — only 3/18 files (§4.1)                                  | —                         |
| T002      | 1     | —     | HANDOFF_VERSION.md                | ✅                                                                    | —                         |
| T003      | 1     | —     | `verify-handoff.mjs`              | ✅ (verifies an incomplete tree — §4.1); lint no-undef (§4.10)        | ⚠️                        |
| T004      | 1     | —     | Record SHA                        | ✅ mechanically; hash of incomplete tree                              | —                         |
| T005      | 1     | —     | CI verify-handoff step            | ✅                                                                    | —                         |
| T006      | 1     | —     | Self-host web fonts               | ✅                                                                    | —                         |
| T007      | 1     | —     | Install runtime deps              | ✅ (§3.3)                                                             | **✅ fixed**              |
| T008      | 1     | —     | Install dev deps                  | ✅ (§3.3)                                                             | **✅ fixed**              |
| T009      | 1     | —     | `tailwind.config.ts`              | ⚠️ content ✅ but Prettier fails (§4.10)                              | ⚠️                        |
| T010      | 1     | —     | `postcss.config.js`               | ✅                                                                    | —                         |
| T011      | 1     | —     | `stylelint.config.cjs`            | ⚠️ content ✅ but ESLint no-undef (§4.10)                             | ⚠️                        |
| T012      | 1     | —     | Custom ESLint rule source         | ✅                                                                    | —                         |
| T013      | 1     | —     | Register rule in flat config      | ✅                                                                    | —                         |
| T014      | 1     | —     | `OVERRIDE_POLICY.md`              | ✅                                                                    | —                         |
| T015      | 1     | —     | README "Design system" section    | ⚠️ core 4 links ✅; missing 3 Spek links (T054)                       | —                         |
| T016      | 2     | —     | Create `tokens.css`               | 🚨 **FAIL** — values drift (§4.1)                                     | —                         |
| T017      | 2     | —     | Create `animations.css`           | ✅                                                                    | —                         |
| T018      | 2     | —     | Create `tokens.d.ts`              | ⚠️ content ✅ but Prettier fails (§4.10)                              | ⚠️                        |
| T019      | 2     | —     | `main.tsx` imports 3 style files  | ✅                                                                    | —                         |
| T020      | 2     | —     | `App.tsx` uses tokens             | ✅                                                                    | —                         |
| T021      | 3     | US2   | `lint:css` green on clean tree    | 🚨 135 rule violations (§4.11)                                        | —                         |
| T022      | 3     | US2   | Stylelint catches hex             | ✅ (rule active — 0 hex errors; but see §4.8 for rgba gap)            | ✨                        |
| T023      | 3     | US2   | ESLint rule catches hex in JSX    | ✅ (rule registered, file iteration works)                            | ✨                        |
| T024      | 3     | US2   | Full quality-gate sweep           | 🚨 blocked by §4.3 / §4.10 / §4.11                                    | —                         |
| T025      | 4     | US1   | Dev-server inspection             | Not re-run; would render with drifted colors (§4.1)                   | —                         |
| T026      | 4     | US1   | Token-change propagation          | Mechanically works; but tokens are wrong                              | —                         |
| T027–T030 | 5     | US3   | Layout primitives                 | ⚠️ built; Shell API diverges (§4.7e)                                  | —                         |
| T031      | 5     | US3   | Brand icons (one .tsx per icon)   | ⚠️ extension fixed; still single-file; inventory wrong (§4.3 + §4.7h) | **partial**               |
| T032      | 5     | US3   | Icon barrel                       | ✅ **Lucide ✨**; brand inventory still wrong (§4.7h)                 | **partial**               |
| T033      | 5     | US3   | `PlayerChip`                      | ⚠️ built; raw rgba (§4.8)                                             | —                         |
| T034      | 5     | US3   | `Countdown`                       | 🚨 wrong component (§4.7a)                                            | —                         |
| T035      | 5     | US3   | `Button`                          | ⚠️ raw rgba (§4.8)                                                    | —                         |
| T036      | 5     | US3   | `Input`                           | ⚠️ raw rgba (§4.8)                                                    | —                         |
| T037      | 5     | US3   | `Field`                           | ✅ **FIXED** — useId + htmlFor (§4.7d)                                | **✨ fixed**              |
| T038      | 5     | US3   | `OtpField`                        | ✅ **FIXED** — full keyboard (§4.7c)                                  | **✨ fixed**              |
| T039      | 5     | US3   | `Badge`                           | ✅                                                                    | —                         |
| T040      | 5     | US3   | `Modal`                           | 🚨 still no focus trap / Esc / restore (§4.7b)                        | —                         |
| T041      | 5     | US3   | `Alert`                           | 🚨 role+variants FIXED, but syntax-bug in same file (§4.3 NEW, §4.7f) | **partial + NEW blocker** |
| T042      | 5     | US3   | `Avatar`                          | ⚠️ raw rgba (§4.8)                                                    | —                         |
| T043      | 5     | US3   | `Slider`                          | ⚠️ built; passes contract basics                                      | —                         |
| T044      | 5     | US3   | `SegButton`                       | ✅ **FIXED** — radiogroup + radio + aria-checked (§4.7g)              | **✨ fixed**              |
| T045      | 5     | US3   | `Chip`                            | ⚠️ 6 raw rgba (§4.8)                                                  | —                         |
| T046      | 5     | US3   | `GridCell`                        | ⚠️ 2 raw rgba (§4.8); otherwise contract-compliant                    | —                         |
| T047–T049 | 6     | US4   | Reduced-motion manual verify      | 🚨 cannot execute without showcase (§4.4)                             | —                         |
| T050      | 7     | US5   | 11 screenshots                    | 🚨 directory empty                                                    | —                         |
| T051–T053 | 7     | US5   | 3 Speks                           | ⏳ external — unverifiable from repo                                  | —                         |
| T054      | 7     | US5   | README links to 3 Speks           | 🚨 missing                                                            | —                         |
| T055      | 8     | —     | `main.tsx` `/_showcase` gate      | 🚨 not implemented                                                    | —                         |
| T056      | 8     | —     | `ReducedMotionToggle.tsx`         | 🚨 file does not exist                                                | —                         |
| T057      | 8     | —     | `AxePanel.tsx`                    | 🚨 file does not exist                                                | —                         |
| T058      | 8     | —     | 6 showcase section files          | 🚨 folder does not exist                                              | —                         |
| T059      | 8     | —     | `Showcase.tsx`                    | 🚨 file does not exist                                                | —                         |
| T060      | 8     | —     | Axe-core contrast pass            | 🚨 blocked by §4.4                                                    | —                         |
| T061      | 8     | —     | Prod build + tree-shake check     | 🚨 build fails (§4.3)                                                 | —                         |
| T062      | 8     | —     | Full quality-gate sweep           | 🚨 blocked by §4.3 / §4.10 / §4.11                                    | —                         |
| T063      | 8     | —     | Update CLAUDE.md "Recent Changes" | 🚨 generic placeholder (§4.6)                                         | —                         |
| T064      | 8     | —     | Exit checklist ticked in PR       | 🚨 premature — no PR, no commits on branch                            | —                         |

**Δ legend**: **✅ fixed** = was a failure, now passing. **✨ fixed** = was a
contract-level failure, now contract-compliant. **⚠️** = new downstream
warning that became visible once earlier gates could run. **partial** = some
sub-items fixed; others still broken. **NEW blocker** = regression
introduced by the fix pass. **—** = unchanged.

---

## 6. Constitution compliance

| Principle                           | Result                                                                                                              | Δ   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --- |
| I — Shared contract source of truth | ✅ `packages/shared` untouched; no cross-wire changes in Phase 1.                                                   | —   |
| II — Sikka backend parity           | ✅ vacuous — Phase 1 is frontend-only.                                                                              | —   |
| III — Yalgamers design fidelity     | 🚨 **STILL VIOLATED** — `tokens.css` values drift from the handoff (§4.1). Fix pass did not touch tokens.css.       | —   |
| IV — Authoritative real-time server | ✅ vacuous — no realtime surface touched.                                                                           | —   |
| V — Spekit-documented decisions     | 🚨 No Speks are linked from the repo (§4.5); no screenshots. README `## Design system` is still missing Spek links. | —   |

Principle III is still the headline failure. Nothing in the fix pass moved
this needle because the root-cause step (re-extract tarball, replace
tokens.css) was skipped.

---

## 7. Recommended fix plan (minimum diff to unblock) — updated

Steps 1 and 2 from the first review are done; everything from step 3 on is
still pending, plus three new items the fix pass introduced.

1. ✅ **Install dependencies** — done.

2. ✅ **Fix the brand-icon file extension** — done.

3. 🚨 **Delete `Alert.tsx` lines 43–45** (§4.3). One-liner:

   ```bash
   sed -i '43,45d' apps/frontend/src/components/ui/Alert.tsx
   pnpm type-check
   ```

   Exit code 0 confirms. Do this FIRST so the rest of the gates can run.

4. 🚨 **Restore the real handoff bundle and token file** (§4.1).
   Extract the cached tarball at
   `/home/jo/.claude/projects/-media-jo-store-youssef-projects-yal-gaming-zonite/ee91dd2b-ca2e-4bcc-bec0-5cd56bdebf86/tool-results/webfetch-1776649630604-c0yuqj.bin`
   over `docs/design/zonite-game/`. Delete the orphan
   `docs/design/zonite-game/colors_and_type.css`. Then:

   ```bash
   cp docs/design/zonite-game/project/colors_and_type.css apps/frontend/src/styles/tokens.css
   # re-apply the @import → @font-face rewire from the head of the old file
   node scripts/verify-handoff.mjs --record
   node scripts/verify-handoff.mjs
   ```

5. 🚨 **Re-port the brand icons** — now that `components/Icons.jsx` is on
   disk, rewrite `brand/index.tsx` to export `IconCrownHost`, `ZoniteLogo`,
   `YalgamersLogo`. Update `icons/index.ts` to re-export those names.

6. 🚨 **Fix the remaining primitive deviations** (§4.7):
   - `Countdown`: rewrite against contract + `Countdown.jsx`.
   - `Modal`: focus-trap, Esc, focus restore, portal.
   - `Shell`/`TopBar`: rename props to `onHome` + `right` + `blobIntensity`.

7. 🚨 **Fix the 79 lint errors** (§4.10):
   - `pnpm prettier --write apps/frontend/src/types/tokens.d.ts apps/frontend/tailwind.config.ts`
     (auto-fixes most).
   - Add Node globals to `eslint.config.mjs` for `scripts/**` and
     `*.cjs`/`*.mjs`/`apps/*/*.config.*`.

8. 🚨 **Fix the 135 stylelint errors** (§4.11):
   - `pnpm --filter @zonite/frontend exec stylelint "src/**/*.css" --fix`
     (auto-fixes 94).
   - Hand-fix the remaining 41 — selector reordering, vendor-prefix
     removal, and either renaming `.errorText` → `.error-text` in both CSS
     and TSX, or loosening `selector-class-pattern` to allow camelCase.

9. 🚨 **Clean up raw `rgba(…)` literals** (§4.8). Either expand stylelint
   rules to ban literal `rgba`, or add translucent-overlay tokens to
   `tokens.css` and swap call sites. Do this together with step 8 —
   migrating to modern color-function notation and banning raw values is one
   natural pass.

10. 🚨 **Implement the showcase** (§4.4). T055–T059 end-to-end. Then:
    - `pnpm --filter @zonite/frontend dev` → `/_showcase`.
    - Axe-core zero WCAG 2.1 AA failures (T060).
    - Manual keyboard walk-through.
    - Toggle reduced motion; confirm animations collapse.

11. 🚨 **Production build + tree-shake check** (T061).

12. 🚨 **Full quality-gate sweep** (T062): verify-handoff, install, lint,
    stylelint, type-check, build — all exit 0.

13. 🚨 **Capture 11 screenshots** (T050); **publish 3 Speks** (T051–T053);
    **update README** with Spek links (T054); **update CLAUDE.md "Recent
    Changes"** (§4.6).

14. Only after 1–13: commit the work and open the Phase 1 PR with T064's
    exit checklist.

---

## 8. Evidence appendix

### 8.1 `node scripts/verify-handoff.mjs`

```
✓ docs/design/zonite-game matches expected_sha256=5ca9aae2a2e91e069ceaa15e4d4d9f0bfda83eda0166b6b4ee04907e4a544be5
```

(Matches a frozen incomplete tree — §4.1.)

### 8.2 `pnpm type-check` (second-pass output)

```
packages/shared type-check: Done
apps/frontend type-check: src/components/ui/Alert.tsx(43,5): error TS1128: Declaration or statement expected.
apps/frontend type-check: src/components/ui/Alert.tsx(43,6): error TS1128: Declaration or statement expected.
apps/frontend type-check: src/components/ui/Alert.tsx(44,3): error TS1128: Declaration or statement expected.
apps/frontend type-check: src/components/ui/Alert.tsx(45,1): error TS1109: Expression expected.
apps/frontend type-check: Failed
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @zonite/frontend@0.0.0 type-check: `tsc --noEmit`
Exit status 2
```

(Previous pass had 30+ errors in `brand/index.ts`; now 4 errors in
`Alert.tsx` — different file, new root-cause.)

### 8.3 `pnpm lint` (excerpt, 79 errors total)

```
src/types/tokens.d.ts
  9:22  error  Replace `·|·'--ink-900'·|·'--ink-850'·|·'--ink-800'·|·'--ink-700'` with `⏎··|·'--ink-900'⏎··|·'--ink-850'⏎··|·'--ink-800'⏎··|·'--ink-700'⏎·`   prettier/prettier
  ... (~35 such lines)

apps/frontend/stylelint.config.cjs
  1:1  error  'module' is not defined   no-undef

apps/frontend/tailwind.config.ts
  38:34  error  Replace `·400:·'var(--lime-400)',` with `⏎··········400:·'var(--lime-400)',⏎·········`  prettier/prettier
  ... (~10 such lines)

scripts/verify-handoff.mjs
  33:14  error  'Buffer' is not defined    no-undef
  47:5   error  'console' is not defined   no-undef
  ... (×10 more console usages)

✖ 79 problems (79 errors, 0 warnings)
  65 errors potentially fixable with the `--fix` option.
```

### 8.4 `pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"` (excerpt, 135 errors total)

```
src/components/ui/SegButton.module.css
  36:15  ✖  Expected modern color-function notation                     color-function-notation
  36:34  ✖  Expected "0.1" to be "10%"                                  alpha-value-notation
  46:1   ✖  Expected selector ".button:disabled" to come before
            selector ".button:hover:not(:disabled)", at line 35         no-descending-specificity
  ...

src/components/ui/OtpField.module.css
  55:3   ✖  Unexpected vendor-prefixed property "-webkit-appearance"    property-no-vendor-prefix
  60:3   ✖  Unexpected vendor-prefixed property "-moz-appearance"       property-no-vendor-prefix
  ...

src/components/ui/Field.module.css
  78:1   ✖  Expected class selector ".errorText" to be kebab-case        selector-class-pattern

✖ 135 problems (135 errors, 0 warnings)
  94 errors potentially fixable with the "--fix" option.
```

(`color-no-hex` is clean in this output — the first-review concern about the
hex rule actually working is satisfied.)

### 8.5 Handoff bundle still 3/18

```
$ find docs/design/zonite-game -type f | sort
docs/design/zonite-game/colors_and_type.css         ← wrong level
docs/design/zonite-game/project/Zonite App.html
docs/design/zonite-game/README.md
```

### 8.6 `tokens.css` still drifted (MD5 match vs first review)

```
$ md5sum apps/frontend/src/styles/tokens.css docs/design/zonite-game/colors_and_type.css
ddcce69fc6f8a5336e21f266c0f01b74  apps/frontend/src/styles/tokens.css   ← identical to first review
0a3a8735677d1bfb29bddced253d592a  docs/design/zonite-game/colors_and_type.css
```

Different MD5 = not a verbatim copy. The committed orphan `colors_and_type.css`
is itself drifted from the real handoff.

### 8.7 Showcase folder still absent

```
$ ls apps/frontend/src/showcase/ 2>&1
ls: cannot access 'apps/frontend/src/showcase/': No such file or directory
```

### 8.8 Screenshots folder still absent

```
$ ls docs/design/screenshots/ 2>&1
ls: cannot access 'docs/design/screenshots/': No such file or directory
```

### 8.9 README still missing Spek links

```
$ grep -c 'Spekit references' README.md
0
```

### 8.10 CLAUDE.md "Recent Changes" still the generic placeholder

```
## Recent Changes
- 003-design-handoff: Added TypeScript ^5.7 (root-pinned from Phase 0, strict mode on). Runtime: Node.js 22 LTS (pinned via `.nvmrc`).
- 001-foundation-setup: Added TypeScript ^5.7 (pinned at repo root, inherited by all packages).
```

### 8.11 Raw `rgba(…)` literal count (unchanged from first review)

```
$ grep -rnEc 'rgba?\(\s*[0-9]' apps/frontend/src/components/*/*.module.css | awk -F: '{s+=$2} END {print s}'
36
```

### 8.12 Primitive-level confirmation of second-pass fixes

```
# Field — useId + htmlFor present
$ grep -n 'useId\|htmlFor={id}' apps/frontend/src/components/ui/Field.tsx
1:import { InputHTMLAttributes, useId } from 'react';
21:  const id = useId();
25:      <label className={styles.label} htmlFor={id}>
32:          id={id}

# OtpField — full keyboard contract
$ grep -cE 'inputRefs\.current\[.*\]\?\.focus\(\)|ArrowLeft|ArrowRight|handlePaste' apps/frontend/src/components/ui/OtpField.tsx
8

# SegButton — radiogroup pattern
$ grep -nE 'role="radiogroup"|role="radio"|aria-checked' apps/frontend/src/components/ui/SegButton.tsx
52:      role="radiogroup"
59:          role="radio"
61:          aria-checked={value === option.value}

# Alert — role split + variant names
$ grep -n "role = type\|'warn'\|'danger'" apps/frontend/src/components/ui/Alert.tsx
5:export type AlertType = 'info' | 'success' | 'warn' | 'danger';
22:  const role = type === 'info' || type === 'success' ? 'status' : 'alert';

# Icons barrel — every Lucide import aliased Icon*
$ grep -cE '^\s+[A-Z][A-Za-z0-9]+ as Icon[A-Z]' apps/frontend/src/components/common/icons/index.ts
17
```

---

_End of second-pass review._
