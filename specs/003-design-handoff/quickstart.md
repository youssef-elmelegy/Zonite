# Quickstart: Design Handoff Adoption (Phase 1)

**Feature**: 003-design-handoff
**Audience**: the engineer(s) implementing Phase 1, plus anyone reviewing or validating the deliverable.
**Precondition**: Phase 0 has shipped. `pnpm install` + `pnpm dev` bring up the monorepo. The frontend placeholder at `http://localhost:5173` renders "Zonite — Phase 0 OK".

This doc is the recipe. It is long because Phase 1 has many moving parts, but every step is concrete and ordered. Execute top to bottom; do not skip sections. Each section ends with a "verify" step — if it fails, fix before moving on.

---

## 0. Fetch what you need before you touch code

- The Claude Design handoff bundle, already extracted locally at `/tmp/zonite-design/zonite-game/` during the planning session (tarball SHA will be computed fresh in step 1).
- Self-hosted web font files. Source: [google-webfonts-helper](https://gwfh.mranftl.com/fonts):
  - **Mulish** — weights 400, 500, 600, 700, 800 — subset `latin` — formats `woff2` only.
  - **Inter** — weights 400, 500, 600, 700 — subset `latin` — formats `woff2` only.
  - **Bruno Ace SC** — weight 400 — subset `latin` — formats `woff2` only.
- Read access to the Spekit "Zonite Dev Hub" Topic (you'll publish three Speks at the end).

Open in another tab: [spec.md](./spec.md) (scope), [plan.md](./plan.md) (structure), [research.md](./research.md) (decisions), the three `contracts/*.md` (the acceptance bar).

---

## 1. Commit the handoff bundle under `docs/design/`

```bash
# From repo root
mkdir -p docs/design
cp -R /tmp/zonite-design/zonite-game docs/design/

cat > docs/design/HANDOFF_VERSION.md <<'EOF'
# Zonite Design Handoff — Version Manifest

adopted_at: 2026-04-20
bundle_source: Claude Design (claude.ai/design) — export 53AOnvUnv452coICdMiQ_w
expected_sha256: PLACEHOLDER_FILLED_BY_SCRIPT

## Refresh workflow

When the design team publishes a new bundle:
1. Extract the new tarball over `docs/design/zonite-game/`, replacing every file.
2. Run `node scripts/verify-handoff.mjs --record` to update `expected_sha256` above.
3. Diff the new `colors_and_type.css` into `apps/frontend/src/styles/tokens.css` — preserve the self-hosted `@font-face` rewire from Phase 1.
4. Diff prototype components into the corresponding primitives if design changed them.
5. Update `tokens.d.ts` if the token set changed.
6. Re-run the showcase + axe-core pass; fix any new failures.
7. Open one PR that updates the bundle, the manifest, the tokens, any affected primitives, and any affected Speks.
EOF
```

Write the verifier at `scripts/verify-handoff.mjs` per [contracts/handoff-refresh.contract.md](./contracts/handoff-refresh.contract.md). Then:

```bash
node scripts/verify-handoff.mjs --record
node scripts/verify-handoff.mjs  # should print "✓ ... matches expected_sha256=<hex>"
```

Add a step to `.github/workflows/ci.yml` that runs the verifier **before** lint / type-check:

```yaml
- name: Verify design handoff bundle integrity
  run: node scripts/verify-handoff.mjs
```

**Verify**: `pnpm exec node scripts/verify-handoff.mjs` exits 0.

---

## 2. Self-host the web fonts

Download the three families from google-webfonts-helper into `apps/frontend/public/fonts/`. File naming: `<family>-v<version>-<subset>-<weight>.woff2` (matches the helper's default output).

Expected files:

```
apps/frontend/public/fonts/
├── mulish-v14-latin-400.woff2
├── mulish-v14-latin-500.woff2
├── mulish-v14-latin-600.woff2
├── mulish-v14-latin-700.woff2
├── mulish-v14-latin-800.woff2
├── inter-v13-latin-400.woff2
├── inter-v13-latin-500.woff2
├── inter-v13-latin-600.woff2
├── inter-v13-latin-700.woff2
└── bruno-ace-sc-v9-latin-400.woff2
```

**Verify**: `ls apps/frontend/public/fonts/` lists all ten files.

---

## 3. Install Phase 1 dependencies

```bash
# Frontend workspace
pnpm --filter @zonite/frontend add tailwindcss@^3.4 postcss@^8 autoprefixer@^10 clsx@^2 lucide-react@^0.460.0
pnpm --filter @zonite/frontend add -D stylelint@^16 stylelint-config-standard@^36 stylelint-order@^6 @axe-core/react@^4.10
```

Initialize Tailwind (or write the configs by hand per step 4):

```bash
pnpm --filter @zonite/frontend exec tailwindcss init -p
```

**Verify**: `pnpm install` finishes cleanly, no peer-dep warnings.

---

## 4. Wire the token source file

Create `apps/frontend/src/styles/tokens.css` as a **verbatim copy** of `docs/design/zonite-game/project/colors_and_type.css`, **with this one rewrite**: replace the `@import url('https://fonts.googleapis.com/...')` lines at the top with `@font-face` declarations that point at `/fonts/*.woff2`. Every other line (including `:root`, `body`, `.h1`, `.eyebrow`, `::-webkit-scrollbar-*`) is identical.

Example of the rewrite (Mulish, each weight):

```css
@font-face {
  font-family: 'Mulish';
  src: url('/fonts/mulish-v14-latin-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
/* Repeat for 500, 600, 700, 800. Then Inter 400/500/600/700. Then Bruno Ace SC 400. */
```

Create `apps/frontend/src/types/tokens.d.ts` as a typed handle on the variable names. Minimal form:

```ts
export type TokenName =
  | '--ink-900'
  | '--ink-850'
  | '--ink-800'
  | '--ink-700'
  | '--accent-yellow'
  | '--accent-yellow-deep'
  | '--accent-yellow-mustard'
  | '--accent-yellow-dim'
  // ... every variable name from tokens.css ...
  | '--fs-xs'
  | '--fs-sm'
  | '--fs-body'
  | '--fs-body-lg'
  | '--fs-base'
  | '--fs-md'
  | '--fs-lg'
  | '--fs-xl'
  | '--fs-2xl'
  | '--fs-3xl';

export const cssVar = <T extends TokenName>(name: T): `var(${T})` => `var(${name})` as const;
```

Import `tokens.css` from `apps/frontend/src/main.tsx`:

```ts
import './styles/tokens.css';
import './styles/animations.css'; // created in step 5
```

**Verify**: start the dev server, open the existing Phase 0 placeholder page, and check that:

- The page background matches `--ink-900` exactly (not the old inline `#100613`).
- The body font is Mulish (inspect an element; `font-family` resolves to `Mulish`).
- Browser devtools Network panel shows zero requests to `fonts.googleapis.com` or `fonts.gstatic.com` when the page loads.

---

## 5. Global animations file with `prefers-reduced-motion` guards

Create `apps/frontend/src/styles/animations.css`. Port the keyframes from `docs/design/zonite-game/project/Zonite App.html` verbatim, then add per-animation consumer rules guarded by `@media (prefers-reduced-motion: no-preference)`.

Template pattern:

```css
/* ===== Keyframe definitions — safe at top-level ===== */
@keyframes claimPulse {
  0% {
    transform: scale(0.6);
    filter: brightness(2.2);
  }
  60% {
    transform: scale(1.12);
    filter: brightness(1.4);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

@keyframes cellPulse {
  0%,
  100% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.5;
  }
}
@keyframes timerPulse {
  0%,
  100% {
    box-shadow: 0 0 24px rgba(247, 23, 86, 0.5);
  }
  50% {
    box-shadow: 0 0 40px rgba(247, 23, 86, 0.8);
  }
}
@keyframes gridDrift {
  from {
    background-position:
      0 0,
      0 0;
  }
  to {
    background-position:
      48px 48px,
      48px 48px;
  }
}
@keyframes zpulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Consumer rules — guarded so the reduced-motion default is no-motion ===== */
/* Animations only apply when the user has NO reduced-motion preference AND the showcase's override flag is not set. */
@media (prefers-reduced-motion: no-preference) {
  html:not([data-reduced-motion='true']) .cell-just-claimed {
    animation: claimPulse 400ms var(--ease-out) 1;
  }
  html:not([data-reduced-motion='true']) .timer-critical {
    animation: timerPulse 800ms var(--ease-in-out) infinite;
  }
  html:not([data-reduced-motion='true']) .grid-bg-drift {
    animation: gridDrift 40s linear infinite;
  }
  html:not([data-reduced-motion='true']) .fade-in {
    animation: fadeUp 300ms var(--ease-out) 1;
  }
}

/* ===== Global range-input (slider) thumb — from FR-015 ===== */
input[type='range'] {
  -webkit-appearance: none;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  outline: none;
}
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: var(--accent-yellow);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(253, 235, 86, 0.55);
  border: 2px solid var(--ink-900);
}
input[type='range']::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: var(--accent-yellow);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--ink-900);
}
```

Add a comment block at the top of each keyframe documenting the `reduced_motion_fallback` (per `data-model.md` entity #3).

**Verify**: load the page with Chrome devtools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" and confirm nothing animates in the Phase 0 placeholder. Flip it to `no-preference` and re-confirm the Phase 0 placeholder still has no animations (it shouldn't — it's a placeholder; the guards are ready for consumers added in later steps).

---

## 6. Tailwind config (Preflight off, theme wraps variables)

`apps/frontend/tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: {
          900: 'var(--ink-900)',
          850: 'var(--ink-850)',
          800: 'var(--ink-800)',
          700: 'var(--ink-700)',
        },
        accent: { yellow: 'var(--accent-yellow)' },
        team: {
          red: 'var(--team-red)',
          blue: 'var(--team-blue)',
        },
        // … every brand/semantic/team token the app reaches for via Tailwind utilities.
        // Tokens not listed here are still reachable via arbitrary values: bg-[var(--fire-pink)]
      },
      fontFamily: {
        ui: ['var(--font-ui)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-full)',
      },
      spacing: {
        0: 'var(--sp-0)',
        1: 'var(--sp-1)',
        2: 'var(--sp-2)',
        3: 'var(--sp-3)',
        4: 'var(--sp-4)',
        5: 'var(--sp-5)',
        6: 'var(--sp-6)',
        8: 'var(--sp-8)',
        10: 'var(--sp-10)',
        12: 'var(--sp-12)',
        16: 'var(--sp-16)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Verify**: add a throwaway `className="bg-ink-900 text-white"` to the Phase 0 placeholder and confirm it renders (no CSS errors in devtools).

---

## 7. Lint rules: stylelint + custom ESLint

### Stylelint

`apps/frontend/stylelint.config.cjs`:

```js
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    'color-no-hex': [true, { severity: 'error' }],
    'font-family-name-quotes': 'always-where-recommended',
    'declaration-property-value-disallowed-list': {
      'font-family': ['/^(?!var\\(--font-).*/'],
    },
  },
  ignoreFiles: ['**/styles/tokens.css', '**/node_modules/**'],
};
```

Add to root `package.json` or frontend `package.json`:

```json
"scripts": {
  "lint:css": "stylelint \"apps/frontend/src/**/*.css\""
}
```

### Custom ESLint rule for JSX inline styles

`eslint-rules/no-hex-in-jsx.js`:

```js
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const VALID_FONT_FAMILY = /^var\(--font-(ui|display|mono)\)$/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid hard-coded hex colors and raw font-family strings in JSX inline styles.',
    },
    schema: [],
    messages: {
      hex: 'Hard-coded hex color "{{value}}" in inline style. Use a token from tokens.css (e.g., var(--accent-yellow)).',
      font: 'Raw font-family "{{value}}" in inline style. Use var(--font-ui), var(--font-display), or var(--font-mono).',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'style') return;
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
        if (node.value.expression.type !== 'ObjectExpression') return;
        for (const prop of node.value.expression.properties) {
          if (
            prop.type !== 'Property' ||
            prop.value.type !== 'Literal' ||
            typeof prop.value.value !== 'string'
          )
            continue;
          const value = prop.value.value;
          const key = prop.key.name ?? prop.key.value;
          if (HEX.test(value)) {
            context.report({ node: prop.value, messageId: 'hex', data: { value } });
          }
          if (key === 'fontFamily' && !VALID_FONT_FAMILY.test(value)) {
            context.report({ node: prop.value, messageId: 'font', data: { value } });
          }
        }
      },
    };
  },
};
```

Register it in the root `eslint.config.mjs` flat config:

```js
import noHexInJsx from './eslint-rules/no-hex-in-jsx.js';

export default [
  // ... existing configs ...
  {
    files: ['apps/frontend/src/**/*.{ts,tsx}'],
    plugins: { 'zonite-local': { rules: { 'no-hex-in-jsx': noHexInJsx } } },
    rules: { 'zonite-local/no-hex-in-jsx': 'error' },
  },
];
```

**Verify**: temporarily edit `apps/frontend/src/App.tsx` to use `color: '#ff0000'` in its inline style; run `pnpm lint` and confirm the rule fires with a named file + line. Revert the edit. Then create a one-line test CSS file with a hex color; run `pnpm lint:css` and confirm stylelint catches it. Revert.

---

## 8. Port the handoff prototypes into production primitives

This is the bulk of Phase 1. Follow [contracts/primitives.contract.md](./contracts/primitives.contract.md) as the acceptance bar.

**Rules while porting**:

- Match the prototype's **visual output**, not its JSX structure. Feel free to factor differently.
- Every primitive goes in `apps/frontend/src/components/<category>/<Name>.tsx` with a colocated `<Name>.module.css`.
- A comment block at the top of each `.module.css` declares the `Documented surface`, `Text color`, and computed contrast ratio per the contract.
- Consumed tokens referenced as `var(...)`; consumed animations gated by `@media (prefers-reduced-motion: no-preference) { html:not([data-reduced-motion='true']) ... }`.
- Interactive primitives implement the keyboard behavior from the primitive contract.

**Order** (each phase depends on the previous):

1. **Layout**: `Shell` → `TopBar` → `CornerBlobs` / `GridBg`. `Shell` composes the other three. Test by wrapping the Phase 0 placeholder in `<Shell>`.
2. **Common**: `PlayerChip` → `Countdown` → `icons/index.ts` (barrel: brand icons authored as TSX from `Icons.jsx` source; Lucide re-exports for the generic set).
3. **UI primitives**: `Button` → `Input` → `Field` (depends on Input) → `OtpField` (depends on Field's label/error styles) → `Badge` → `Modal` → `Alert` → `Avatar` → `Slider` → `SegButton` → `Chip`.
4. **Game**: `GridCell`.

For each primitive, after implementing it, add its entry to the showcase (step 9) so you can verify as you go.

**Verify per primitive**: it renders on-brand in the showcase without any call-site styling, every state displays, and its keyboard/reduced-motion/contrast requirements are met (axe-core will confirm contrast at step 10).

---

## 9. Build the dev-only `/_showcase` route

### 9.1 Entry-point switch in `main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import './styles/animations.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');
const root = createRoot(rootEl);

if (import.meta.env.DEV && window.location.pathname === '/_showcase') {
  import('./showcase/Showcase').then(({ Showcase }) => {
    root.render(
      <StrictMode>
        <Showcase />
      </StrictMode>,
    );
  });
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
```

### 9.2 Showcase tree

Per [contracts/primitives.contract.md §Showcase contract](./contracts/primitives.contract.md):

```
apps/frontend/src/showcase/
├── Showcase.tsx                    # top-level; hosts ReducedMotionToggle + AxePanel + sections
├── Showcase.module.css
├── ReducedMotionToggle.tsx         # toggles <html data-reduced-motion="true">
├── AxePanel.tsx                    # dynamic import @axe-core/react; renders violations
└── sections/
    ├── TokensSection.tsx
    ├── LayoutSection.tsx
    ├── UiSection.tsx
    ├── CommonSection.tsx
    ├── GameSection.tsx
    └── AnimationsSection.tsx
```

Each section:

- Renders every primitive in every documented state (see the primitive contract's matrix).
- Labels each example with the primitive name, variant, and state.
- For interactive primitives, includes a "trigger" control where the state isn't purely declarative (e.g., a button that triggers the `claimPulse` on a demo `GridCell`; a range of `Countdown`s that step from 30s → 10s on a timer so the color-critical transitions are visible).

### 9.3 Axe-core wiring

```tsx
// AxePanel.tsx (dev-only)
import { useEffect, useState } from 'react';

export function AxePanel(): JSX.Element | null {
  const [violations, setViolations] = useState<Array<{ id: string; help: string; nodes: number }>>(
    [],
  );
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (async () => {
      const axe = await import('@axe-core/react');
      const react = await import('react');
      const reactDOM = await import('react-dom');
      axe.default(react, reactDOM, 1000, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      });
    })();
    const handler = (e: CustomEvent<{ violations: any[] }>) => {
      /* populate setViolations */
    };
    window.addEventListener('axe-results', handler as EventListener);
    return () => window.removeEventListener('axe-results', handler as EventListener);
  }, []);
  if (!import.meta.env.DEV) return null;
  return <aside aria-label="Axe-core report">{/* render violations list */}</aside>;
}
```

(Note: `@axe-core/react` logs to console by default; a small helper can mirror results to the panel. Acceptable Phase 1 fidelity: log-to-console plus the panel listing any failures seen since page mount.)

**Verify**: open `http://localhost:5173/_showcase` in dev. Every section renders. Axe panel shows zero WCAG AA violations. Toggle reduced-motion: every animation collapses. Navigate to `http://localhost:5173/_showcase` on a production build (see step 11): falls through to the normal not-found path / renders `<App />` (Phase 0 placeholder), not the showcase.

---

## 10. Accessibility verification pass

With the showcase complete:

1. **Contrast audit**: open the showcase. Confirm axe panel reports **zero** WCAG 2.1 AA contrast failures. If any fail, check the primitive's `documented_surface` comment — the failure is either (a) the primitive rendered on a non-documented surface (fix the showcase), (b) the token actually fails AA (raise with design and document as a known deviation), or (c) an axe bug (confirm with a manual contrast checker; suppress with justification).
2. **Keyboard walk-through**: with the mouse away from the keyboard, Tab through the entire showcase. Every interactive primitive's focus state is visible (yellow focus ring); Enter / Space activates what's focusable; the Modal demo traps focus and restores on Esc; the OtpField auto-advances; the Slider responds to Arrow / Home / End.
3. **Reduced-motion pass**: toggle the showcase's `ReducedMotionToggle` on. Re-trigger every animation demo: `claimPulse` collapses (cell still flips color), `timerPulse` collapses (critical glow is static at peak), `gridDrift` stops, `fadeUp` skips to final. Then toggle OS-level `prefers-reduced-motion: reduce` via devtools and re-verify.

**Verify**: all three sub-passes succeed. Record the verification result in the Phase 1 PR description.

---

## 11. Production build check

```bash
pnpm --filter @zonite/frontend build
pnpm --filter @zonite/frontend preview
```

Open the previewed URL and:

- Navigate to `/` → Phase 0 placeholder renders with tokens applied.
- Navigate to `/_showcase` → does NOT render the showcase. Falls through to `<App />` (since no real router exists) or shows the browser's default 404 / empty state, depending on your server config. Acceptable: falls through. Not acceptable: showcase renders.
- Open devtools → Network → reload: zero requests to `fonts.googleapis.com` / `fonts.gstatic.com` / any other external CDN for fonts. All `/fonts/*.woff2` are served locally.
- Open devtools → Application → Source maps or bundle analysis: files under `src/showcase/**` are absent from the prod bundle.

**Verify**: all three checks pass. Capture evidence (screenshots of Network panel, bundle inspection) for the PR.

---

## 12. Run the full quality-gate sweep

```bash
pnpm install
node scripts/verify-handoff.mjs
pnpm lint
pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"
pnpm type-check
pnpm --filter @zonite/frontend build
```

**Verify**: every command exits 0 within the Phase 0 performance budget (type-check ≤ 60s). Commit nothing that makes any of these red.

---

## 13. Spekit documentation sprint

Publish three Speks in the "Zonite Dev Hub" Topic:

1. **"Zonite Design System — token sources and override policy"** (FR-023). Body sections:
   - Where tokens come from (the handoff bundle; link to `docs/design/zonite-game/`)
   - The token source file (`tokens.css`)
   - The override policy (mirror of `docs/design/OVERRIDE_POLICY.md`)
   - Lint enforcement (stylelint rule + custom ESLint rule)
   - Attach screenshots of every handoff screen: onboarding, login, signup, forgot, reset, home, create, lobby, game, results, profile.

2. **"Claude Design handoff bundle — what it is and how to update"** (FR-024). Body sections:
   - What the bundle is (link to the README)
   - Where it lives in the repo (`docs/design/zonite-game/`)
   - Version manifest (link to `HANDOFF_VERSION.md`)
   - Refresh workflow (copy of the manifest's "Refresh workflow" section)
   - SHA verification (link to `scripts/verify-handoff.mjs`)

3. **"Zonite typography — Gilroy vs. Mulish fallback"** (FR-025). Body sections:
   - Primary typeface intent (Gilroy, proprietary, not yet licensed)
   - Current stand-in (Mulish, OFL, self-hosted)
   - The single-file swap (when Gilroy `.woff2` arrives, update `tokens.css` `@font-face` + the `--font-ui` primary entry)
   - Why Mulish was chosen (geometric-humanist, closest match to Gilroy)

**Verify**: all three Speks exist and are linked from the repo README (add links to a "Design system" section).

---

## 14. Add the override policy file

Create `docs/design/OVERRIDE_POLICY.md` with the structure from [research.md §13](./research.md). Content is mirrored into Spek 1 above.

**Verify**: both the MD file and the Spek exist, and a diff shows they carry the same rules.

---

## 15. Phase 1 exit checks — the acceptance bar

Before declaring Phase 1 complete, confirm:

- [ ] `docs/design/zonite-game/` committed; `HANDOFF_VERSION.md` has a non-placeholder SHA; CI step runs and passes.
- [ ] `apps/frontend/src/styles/tokens.css` is a verbatim copy (modulo the `@font-face` rewire) of `colors_and_type.css`.
- [ ] `apps/frontend/src/styles/animations.css` ships every keyframe + guarded consumer rules + the global range-input thumb.
- [ ] All 19 primitives (4 layout + 3 common + 11 UI + 1 game) + icon barrel are implemented and listed in the showcase.
- [ ] `/_showcase` renders in dev; tree-shaken from production.
- [ ] Axe-core on the showcase reports zero WCAG 2.1 AA failures.
- [ ] Manual keyboard walk-through passes (every interactive primitive operable without a mouse).
- [ ] Reduced-motion pass: every animation collapses while preserving information.
- [ ] Stylelint + custom ESLint rule catch attempted violations (demonstrated once per SC-005).
- [ ] `pnpm type-check` passes in ≤ 60s.
- [ ] Production build: zero external font CDN requests; `/fonts/*.woff2` served locally.
- [ ] Three Speks published in "Zonite Dev Hub" with the required sections and the 11 screenshots attached.
- [ ] `docs/design/OVERRIDE_POLICY.md` exists and matches Spek 1.
- [ ] README links to `docs/design/zonite-game/README.md` (FR-003) and to the Spekit Topic.

When every box is ticked, open the Phase 1 PR. Reviewers cross-check against [spec.md](./spec.md) Success Criteria and the three contracts in this folder.

---

## Troubleshooting

- **FOUT on the display font**: `font-display: swap` accepts a brief flash of the fallback. If the flash is jarring, test `font-display: fallback` (shorter swap window). Do not use `font-display: block` — blocks render for up to 3 seconds.
- **Tailwind utilities don't pick up a new token**: `tailwind.config.ts`'s `theme.extend` is additive; confirm the token is declared in that map (or use arbitrary values `bg-[var(--fire-pink)]` as an escape hatch for tokens you don't map). Both paths still resolve through the single `tokens.css`.
- **`color-no-hex` false positive on a valid place**: verify the file is `tokens.css` (ignored) or add the file to `ignoreFiles` with a justification comment. Do not suppress per-line unless there's a strong reason (and then raise a Spek to discuss changing the rule).
- **Bundle SHA mismatch in CI after a local edit**: you edited the bundle tree. Revert the edit (the bundle is read-only), or — if the edit is intentional because design shipped a new version — run the full refresh workflow, not a point fix.
- **Axe reports contrast on a primitive that "looks fine"**: re-read the primitive's `documented_surface` comment. The primitive might be rendered on a surface it was never tested against; either change the showcase example, or (if the primitive genuinely needs the new surface) update the documented_surface list and add the contrast pair to the primitive contract.
