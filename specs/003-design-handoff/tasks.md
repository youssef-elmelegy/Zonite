---
description: 'Task list for implementing Phase 1 — Design Handoff Adoption'
---

# Tasks: Design Handoff Adoption (Phase 1 — Style Extraction)

**Input**: Design documents from `/specs/003-design-handoff/`
**Prerequisites**: [plan.md](./plan.md) (required), [spec.md](./spec.md) (required), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)
**Tests**: NOT requested. Per [spec.md §Assumptions](./spec.md), test tooling is deferred. No test tasks in this file.
**Organization**: Tasks are grouped by user story. Each task lists the exact file, the exact action, and a verification step a cheaper model can run to confirm it worked.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from [spec.md](./spec.md) (US1–US5). Setup / Foundational / Polish carry no story label.
- **File paths**: Every path is absolute-from-repo-root.

## How to use this file

You are implementing Phase 1. Work top-to-bottom. Each task has:

1. **What to do** — concrete file path(s) and the action.
2. **Snippet / content** — the exact content or a link to the contract section that pins it.
3. **Verify** — a command or observation that proves the task succeeded.

Do not skip a verify step. If it fails, stop and fix before moving on.

**Absolute paths referenced**:

- Repo root: `/media/jo/store/youssef/projects/yal-gaming/zonite`
- Extracted handoff bundle (already on disk from planning session): `/tmp/zonite-design/zonite-game/`
- Feature directory: `/media/jo/store/youssef/projects/yal-gaming/zonite/specs/003-design-handoff/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Commit the handoff bundle, wire its integrity check, add the web fonts, install Phase 1 dependencies, and create tooling configs. No `apps/frontend/src/**` files change in this phase — the src is touched in Phase 2.

- [x] **T001** Copy the already-extracted Claude Design handoff bundle into the repo under `docs/design/zonite-game/`.

  Run from repo root:

  ```bash
  mkdir -p docs/design
  cp -R /tmp/zonite-design/zonite-game docs/design/
  ```

  **Verify**: `ls docs/design/zonite-game/` shows `README.md`, `chats/`, and `project/`. `ls docs/design/zonite-game/project/` shows `Zonite App.html`, `colors_and_type.css`, `assets/`, and `components/`.

- [x] **T002** Create `docs/design/HANDOFF_VERSION.md` with a placeholder SHA that T004 will fill.

  Write this exact content to `docs/design/HANDOFF_VERSION.md`:

  ```markdown
  # Zonite Design Handoff — Version Manifest

  adopted_at: 2026-04-20
  bundle_source: Claude Design (claude.ai/design) — export 53AOnvUnv452coICdMiQ_w
  expected_sha256: 0000000000000000000000000000000000000000000000000000000000000000

  ## Refresh workflow

  When the design team publishes a new bundle:
  1. Extract the new tarball over `docs/design/zonite-game/`, replacing every file.
  2. Run `node scripts/verify-handoff.mjs --record` to update `expected_sha256` above.
  3. Diff the new `colors_and_type.css` into `apps/frontend/src/styles/tokens.css` — preserve the self-hosted `@font-face` rewire from Phase 1.
  4. Diff prototype components into the corresponding primitives if design changed them.
  5. Update `tokens.d.ts` if the token set changed.
  6. Re-run the showcase + axe-core pass; fix any new failures.
  7. Open one PR that updates the bundle, the manifest, the tokens, any affected primitives, and any affected Speks.
  ```

  **Verify**: `cat docs/design/HANDOFF_VERSION.md | head -5` shows the three top-level fields.

- [x] **T003** Create `scripts/verify-handoff.mjs` — zero-dependency Node ESM script that hashes the bundle tree and compares to the manifest.

  Create the directory first: `mkdir -p scripts`. Then write `scripts/verify-handoff.mjs` with this exact content:

  ```js
  #!/usr/bin/env node
  // verify-handoff.mjs — verify (or record) the SHA256 of docs/design/zonite-game/
  // Contract: specs/003-design-handoff/contracts/handoff-refresh.contract.md
  import { createHash } from 'node:crypto';
  import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
  import { join, relative, resolve } from 'node:path';
  import { argv, cwd, exit } from 'node:process';

  const ROOT = resolve(cwd());
  const BUNDLE_DIR = join(ROOT, 'docs/design/zonite-game');
  const MANIFEST = join(ROOT, 'docs/design/HANDOFF_VERSION.md');
  const record = argv.includes('--record');

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = [];
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) files.push(...(await walk(full)));
      else if (e.isFile()) files.push(full);
    }
    return files;
  }

  async function computeHash() {
    const files = (await walk(BUNDLE_DIR)).sort((a, b) =>
      relative(BUNDLE_DIR, a).localeCompare(relative(BUNDLE_DIR, b), 'en'),
    );
    const h = createHash('sha256');
    for (const file of files) {
      const rel = relative(BUNDLE_DIR, file).split('\\').join('/');
      h.update(rel, 'utf8');
      h.update(Buffer.from([0]));
      h.update(await readFile(file));
      h.update(Buffer.from([0]));
    }
    return h.digest('hex');
  }

  function extractExpected(md) {
    const m = /^expected_sha256:\s+([0-9a-f]{64})\s*$/m.exec(md);
    return m ? m[1] : null;
  }

  try {
    try { await stat(BUNDLE_DIR); } catch {
      console.error(`✗ Bundle directory missing: ${BUNDLE_DIR}`);
      exit(1);
    }
    const md = await readFile(MANIFEST, 'utf8');
    const expected = extractExpected(md);
    const actual = await computeHash();

    if (record) {
      const today = new Date().toISOString().slice(0, 10);
      const next = md
        .replace(/^expected_sha256:\s+[0-9a-f]*\s*$/m, `expected_sha256: ${actual}`)
        .replace(/^adopted_at:\s+.*$/m, `adopted_at: ${today}`);
      await writeFile(MANIFEST, next);
      console.log(`✓ Recorded expected_sha256=${actual}, adopted_at=${today}`);
      exit(0);
    }

    if (!expected) {
      console.error('✗ HANDOFF_VERSION.md is missing or unparseable (no expected_sha256)');
      exit(2);
    }
    if (expected !== actual) {
      console.error('✗ Bundle hash mismatch');
      console.error(`  expected: ${expected}`);
      console.error(`  actual:   ${actual}`);
      console.error('  Refresh the manifest with `node scripts/verify-handoff.mjs --record`');
      console.error('  or restore the bundle to the committed version.');
      exit(3);
    }
    console.log(`✓ docs/design/zonite-game matches expected_sha256=${actual}`);
  } catch (err) {
    console.error('✗ verify-handoff.mjs failed:', err.message);
    exit(1);
  }
  ```

  Make it executable: `chmod +x scripts/verify-handoff.mjs`.

  **Verify**: `node scripts/verify-handoff.mjs` exits non-zero with code 3 (hash mismatch — expected for the placeholder).

- [x] **T004** Run the verifier in record mode to fill in the real SHA in the manifest.

  ```bash
  node scripts/verify-handoff.mjs --record
  node scripts/verify-handoff.mjs
  ```

  **Verify**: The second command prints `✓ docs/design/zonite-game matches expected_sha256=<64-hex>` and exits 0. `grep expected_sha256 docs/design/HANDOFF_VERSION.md` shows a 64-character hex value (not all zeros).

- [x] **T005** [P] Add the handoff-verification step to the CI workflow.

  Open `.github/workflows/ci.yml` (create if missing). Immediately before the existing lint / type-check steps (fail fast), add:

  ```yaml
  - name: Verify design handoff bundle integrity
    run: node scripts/verify-handoff.mjs
  ```

  If `.github/workflows/ci.yml` does not yet exist in this repo, create a minimal one:

  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    ci:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
          with: { version: 9 }
        - uses: actions/setup-node@v4
          with: { node-version: 22, cache: 'pnpm' }
        - run: pnpm install --frozen-lockfile
        - name: Verify design handoff bundle integrity
          run: node scripts/verify-handoff.mjs
        - run: pnpm lint
        - run: pnpm type-check
  ```

  **Verify**: `grep -A1 'Verify design handoff' .github/workflows/ci.yml` shows the step.

- [x] **T006** [P] Download self-hosted web fonts into `apps/frontend/public/fonts/`.

  Create the directory: `mkdir -p apps/frontend/public/fonts`.

  Download `.woff2` files (Latin subset only) using `curl` from `gwfh.mranftl.com/api/fonts/...` OR manually via <https://gwfh.mranftl.com/fonts>. The filenames MUST be:

  ```
  apps/frontend/public/fonts/mulish-v14-latin-400.woff2
  apps/frontend/public/fonts/mulish-v14-latin-500.woff2
  apps/frontend/public/fonts/mulish-v14-latin-600.woff2
  apps/frontend/public/fonts/mulish-v14-latin-700.woff2
  apps/frontend/public/fonts/mulish-v14-latin-800.woff2
  apps/frontend/public/fonts/inter-v13-latin-400.woff2
  apps/frontend/public/fonts/inter-v13-latin-500.woff2
  apps/frontend/public/fonts/inter-v13-latin-600.woff2
  apps/frontend/public/fonts/inter-v13-latin-700.woff2
  apps/frontend/public/fonts/bruno-ace-sc-v9-latin-400.woff2
  ```

  Suggested one-shot download (version tags in URLs may differ — use what google-webfonts-helper returns):

  ```bash
  BASE=apps/frontend/public/fonts
  # Mulish (latin subset, weights 400/500/600/700/800) from Google Fonts CDN via gwfh:
  # If curl fails to resolve gwfh endpoints, navigate to https://gwfh.mranftl.com/fonts/mulish?subsets=latin,
  # select weights 400/500/600/700/800, format woff2, and save with the exact filenames above.
  ```

  If manual download is required: rename the helper's output to match the filenames above. Version tags `v14` for Mulish, `v13` for Inter, `v9` for Bruno Ace SC are the target as of writing; if helper returns a newer version, use that and update the `@font-face` filenames in T016 accordingly.

  **Verify**: `ls apps/frontend/public/fonts/*.woff2 | wc -l` returns `10`. `file apps/frontend/public/fonts/mulish-v14-latin-400.woff2` reports "Web Open Font Format (Version 2)".

- [x] **T007** [P] Install Phase 1 runtime dependencies in the frontend workspace.

  ```bash
  pnpm --filter @zonite/frontend add tailwindcss@^3.4 postcss@^8 autoprefixer@^10 clsx@^2 lucide-react@^0.460.0
  ```

  **Verify**: `grep -E '"(tailwindcss|postcss|autoprefixer|clsx|lucide-react)"' apps/frontend/package.json` returns 5 lines.

- [x] **T008** [P] Install Phase 1 devDependencies in the frontend workspace.

  ```bash
  pnpm --filter @zonite/frontend add -D stylelint@^16 stylelint-config-standard@^36 stylelint-order@^6 @axe-core/react@^4.10
  ```

  **Verify**: `grep -E '"(stylelint|@axe-core/react)"' apps/frontend/package.json` returns at least 4 lines.

- [x] **T009** [P] Create `apps/frontend/tailwind.config.ts` with Preflight disabled and theme wrapping CSS variables.

  Write this exact content to `apps/frontend/tailwind.config.ts`:

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
          accent: {
            yellow: 'var(--accent-yellow)',
            'yellow-deep': 'var(--accent-yellow-deep)',
            'yellow-mustard': 'var(--accent-yellow-mustard)',
          },
          team: {
            red: 'var(--team-red)',
            'red-soft': 'var(--team-red-soft)',
            'red-deep': 'var(--team-red-deep)',
            blue: 'var(--team-blue)',
            'blue-soft': 'var(--team-blue-soft)',
            'blue-deep': 'var(--team-blue-deep)',
            neutral: 'var(--team-neutral)',
          },
          magenta: {
            500: 'var(--magenta-500)',
            300: 'var(--magenta-300)',
            700: 'var(--magenta-700)',
          },
          fire: { red: 'var(--fire-red)', pink: 'var(--fire-pink)' },
          sky: { 300: 'var(--sky-300)' },
          cyan: { 400: 'var(--cyan-400)', 300: 'var(--cyan-300)', 200: 'var(--cyan-200)' },
          lime: {
            500: 'var(--lime-500)', 400: 'var(--lime-400)', 300: 'var(--lime-300)',
            700: 'var(--lime-700)', 900: 'var(--lime-900)',
          },
          orange: { 500: 'var(--orange-500)' },
          peach: { 300: 'var(--peach-300)' },
          fg: {
            primary: 'var(--fg-primary)',
            secondary: 'var(--fg-secondary)',
            tertiary: 'var(--fg-tertiary)',
            muted: 'var(--fg-muted)',
            faint: 'var(--fg-faint)',
            softgray: 'var(--fg-softgray)',
            steel: 'var(--fg-steel)',
          },
          bg: {
            page: 'var(--bg-page)',
            elevated: 'var(--bg-elevated)',
            card: 'var(--bg-card)',
            'card-solid': 'var(--bg-card-solid)',
            overlay: 'var(--bg-overlay)',
          },
          border: {
            subtle: 'var(--border-subtle)',
            DEFAULT: 'var(--border-default)',
            strong: 'var(--border-strong)',
            accent: 'var(--border-accent)',
          },
        },
        fontFamily: {
          ui: ['var(--font-ui)'],
          display: ['var(--font-display)'],
          mono: ['var(--font-mono)'],
        },
        fontSize: {
          xs: 'var(--fs-xs)', sm: 'var(--fs-sm)', body: 'var(--fs-body)',
          'body-lg': 'var(--fs-body-lg)', base: 'var(--fs-base)', md: 'var(--fs-md)',
          lg: 'var(--fs-lg)', xl: 'var(--fs-xl)', '2xl': 'var(--fs-2xl)', '3xl': 'var(--fs-3xl)',
        },
        borderRadius: {
          xs: 'var(--radius-xs)', sm: 'var(--radius-sm)', md: 'var(--radius-md)',
          lg: 'var(--radius-lg)', xl: 'var(--radius-xl)', '2xl': 'var(--radius-2xl)',
          '3xl': 'var(--radius-3xl)', pill: 'var(--radius-pill)', full: 'var(--radius-full)',
        },
        spacing: {
          0: 'var(--sp-0)', 1: 'var(--sp-1)', 2: 'var(--sp-2)', 3: 'var(--sp-3)',
          4: 'var(--sp-4)', 5: 'var(--sp-5)', 6: 'var(--sp-6)', 8: 'var(--sp-8)',
          10: 'var(--sp-10)', 12: 'var(--sp-12)', 16: 'var(--sp-16)',
        },
        boxShadow: {
          card: 'var(--shadow-card)',
          lift: 'var(--shadow-lift)',
        },
      },
    },
    plugins: [],
  } satisfies Config;
  ```

  **Verify**: `pnpm --filter @zonite/frontend exec tsc --noEmit tailwind.config.ts` exits 0.

- [x] **T010** [P] Create `apps/frontend/postcss.config.js` wiring Tailwind + autoprefixer.

  Write this exact content to `apps/frontend/postcss.config.js`:

  ```js
  export default {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  };
  ```

  **Verify**: `cat apps/frontend/postcss.config.js` shows the two plugins.

- [x] **T011** [P] Create `apps/frontend/stylelint.config.cjs` with `color-no-hex` + font-family quarantine.

  Write this exact content to `apps/frontend/stylelint.config.cjs`:

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
    ignoreFiles: ['**/styles/tokens.css', '**/node_modules/**', '**/public/**'],
  };
  ```

  Add a `lint:css` script entry to `apps/frontend/package.json` inside `"scripts"`:

  ```json
  "lint:css": "stylelint \"src/**/*.css\""
  ```

  **Verify**: `pnpm --filter @zonite/frontend exec stylelint --version` prints a version number. `grep lint:css apps/frontend/package.json` shows the new script.

- [x] **T012** [P] Create the custom ESLint rule `eslint-rules/no-hex-in-jsx.js` at repo root.

  Create the directory: `mkdir -p eslint-rules`. Write this exact content to `eslint-rules/no-hex-in-jsx.js`:

  ```js
  // Custom ESLint rule: forbid hard-coded hex colors and raw font-family strings
  // inside JSX inline `style={{ ... }}` attributes under apps/frontend/src/**.
  // Contract: specs/003-design-handoff/contracts/tokens.contract.md §Consumer rules
  const HEX = /#[0-9a-fA-F]{3,8}\b/;
  const VALID_FONT_FAMILY = /^var\(--font-(ui|display|mono)\)$/;

  export default {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Forbid hard-coded hex colors and raw font-family strings in JSX inline styles. Use tokens from tokens.css.',
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
            if (prop.type !== 'Property') continue;
            if (prop.value.type !== 'Literal' || typeof prop.value.value !== 'string') continue;
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

  **Verify**: `node -e "import('./eslint-rules/no-hex-in-jsx.js').then(m => console.log(typeof m.default.create))"` prints `function`.

- [x] **T013** Register the custom ESLint rule in the root flat config.

  Open `eslint.config.mjs` at repo root. Add this import at the top (with the other imports):

  ```js
  import noHexInJsx from './eslint-rules/no-hex-in-jsx.js';
  ```

  Inside the default-exported array, append a new config object:

  ```js
  {
    files: ['apps/frontend/src/**/*.{ts,tsx}'],
    plugins: {
      'zonite-local': {
        rules: {
          'no-hex-in-jsx': noHexInJsx,
        },
      },
    },
    rules: {
      'zonite-local/no-hex-in-jsx': 'error',
    },
  },
  ```

  **Verify**: `pnpm lint` runs (it may currently pass or report other issues; it MUST not crash with "rule not found"). `pnpm lint 2>&1 | grep -c "no-hex-in-jsx"` can be 0 — the rule is registered but nothing violates it yet.

- [x] **T014** [P] Create `docs/design/OVERRIDE_POLICY.md` with the full override policy text.

  Write this exact content to `docs/design/OVERRIDE_POLICY.md`:

  ```markdown
  # Zonite Frontend Override Policy

  The Zonite frontend is styled exclusively through the design tokens defined in
  `apps/frontend/src/styles/tokens.css`, which is a verbatim copy of the Claude
  Design handoff bundle's `colors_and_type.css`. This document pins the rules
  reviewers enforce.

  ## When to add a new token

  Add a new token if ALL of the following are true:

  - The value will be used in ≥2 places OR by a brand-level primitive.
  - The value comes from the design handoff (or you have explicit design sign-off).
  - No existing token already covers the use case.

  How to add:

  1. Edit `apps/frontend/src/styles/tokens.css` and add the `--foo-bar` variable
     in the appropriate category section.
  2. Update `apps/frontend/src/types/tokens.d.ts` to include the new name.
  3. If the value is a color / spacing / radius / fontSize that belongs in a
     Tailwind utility, add it to `apps/frontend/tailwind.config.ts` (wrapping
     `var(--foo-bar)` — never redeclaring the value).
  4. Note the addition in the PR description and update the Spek "Zonite Design
     System — token sources and override policy" in the same PR.

  ## When a local style exception is permissible

  A local style exception is permissible ONLY when:

  - The value is truly one-off and will not reappear elsewhere.
  - The value is computed at render time and cannot be expressed as a token
    (e.g., a slider fill percentage: `style={{ width: `${pct}%` }}`).
  - The reviewer explicitly approves it in the PR description.
  - An adjacent comment documents the exception: `/* exception: computed at render time */`.

  ## What reviewers MUST block

  Reviewers block a PR that:

  - Hard-codes a hex color anywhere under `apps/frontend/src/**` outside
    `tokens.css`. (Lint catches this; review catches lint bypasses.)
  - Declares a raw font-family string outside `tokens.css`. Valid values
    elsewhere are `var(--font-ui)`, `var(--font-display)`, `var(--font-mono)`.
  - Redeclares a token value inside Tailwind theme (rather than wrapping the CSS
    variable).
  - Swaps a brand icon (under `components/common/icons/brand/`) for a Lucide
    equivalent, or vice versa.
  - Adds an animation that consumes a keyframe without a
    `prefers-reduced-motion: no-preference` guard.
  - Adds a primitive that does not declare its `Documented surface` in its
    `.module.css` header comment.
  - Edits files inside `docs/design/zonite-game/` without updating
    `docs/design/HANDOFF_VERSION.md` in the same commit.

  ## Mirror

  This policy is mirrored into the Spekit Spek "Zonite Design System — token
  sources and override policy". Both artifacts MUST stay in sync; a PR that
  changes one updates the other.
  ```

  **Verify**: `head -5 docs/design/OVERRIDE_POLICY.md` shows the title and opening paragraph.

- [x] **T015** [P] Link the handoff README from the repo root `README.md`.

  Open `README.md`. Add (or extend) a "Design system" section with:

  ```markdown
  ## Design system

  The visual design for Zonite ships as a Claude Design handoff bundle at
  [docs/design/zonite-game/](./docs/design/zonite-game/). Start there before
  touching any frontend UI code:

  - [Handoff README](./docs/design/zonite-game/README.md) — how to read the bundle.
  - [Token source of truth](./apps/frontend/src/styles/tokens.css) — the only
    place color, font, spacing, radius, shadow, and breakpoint values live.
  - [Override policy](./docs/design/OVERRIDE_POLICY.md) — when to add tokens vs.
    when a local exception is allowed.
  - [Handoff version manifest](./docs/design/HANDOFF_VERSION.md) — what version
    of the bundle this repo has adopted.
  ```

  **Verify**: `grep -A5 "## Design system" README.md` shows the four bullet links.

**Checkpoint (Phase 1 complete)**: Bundle is committed + integrity-checked in CI; fonts are on disk; dependencies and configs are installed; no `apps/frontend/src/**` changes yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the token source of truth, the global animations file, and the typed token names. Wire them into the frontend entry point. Update the Phase 0 placeholder `App.tsx` to use tokens instead of its hard-coded hex. Every user story below depends on this phase being complete.

**⚠️ CRITICAL**: No user-story work can begin until this phase is complete.

- [x] **T016** Create `apps/frontend/src/styles/tokens.css` by copying the handoff's `colors_and_type.css` **verbatim**, THEN replacing the Google Fonts `@import` block with local `@font-face` declarations.

  Step 1: `mkdir -p apps/frontend/src/styles && cp docs/design/zonite-game/project/colors_and_type.css apps/frontend/src/styles/tokens.css`.

  Step 2: open `apps/frontend/src/styles/tokens.css`. Find the two `@import url('https://fonts.googleapis.com/...')` lines near the top. Replace them with these 10 `@font-face` blocks (version tags must match the filenames you downloaded in T006 — adjust `v14`, `v13`, `v9` if helper gave different tags):

  ```css
  /* Self-hosted web fonts. Do NOT add third-party font CDN URLs here. */
  @font-face { font-family: 'Mulish'; src: url('/fonts/mulish-v14-latin-400.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Mulish'; src: url('/fonts/mulish-v14-latin-500.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Mulish'; src: url('/fonts/mulish-v14-latin-600.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Mulish'; src: url('/fonts/mulish-v14-latin-700.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Mulish'; src: url('/fonts/mulish-v14-latin-800.woff2') format('woff2'); font-weight: 800; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Inter'; src: url('/fonts/inter-v13-latin-400.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Inter'; src: url('/fonts/inter-v13-latin-500.woff2') format('woff2'); font-weight: 500; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Inter'; src: url('/fonts/inter-v13-latin-600.woff2') format('woff2'); font-weight: 600; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Inter'; src: url('/fonts/inter-v13-latin-700.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
  @font-face { font-family: 'Bruno Ace SC'; src: url('/fonts/bruno-ace-sc-v9-latin-400.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
  ```

  Do NOT change anything else: `:root` variables, `body`, `.p`, `.h1`, `.eyebrow`, `.label`, `.caption`, `.stat`, `.hot-tag`, and `::-webkit-scrollbar*` rules are copied verbatim.

  **Verify**: `grep -c '@font-face' apps/frontend/src/styles/tokens.css` returns `10`. `grep -c 'fonts.googleapis.com\|fonts.gstatic.com' apps/frontend/src/styles/tokens.css` returns `0`. `grep -c '^\s*--accent-yellow:' apps/frontend/src/styles/tokens.css` returns `1`.

- [x] **T017** Create `apps/frontend/src/styles/animations.css` with keyframes, reduced-motion guarded consumer rules, and the global range-input thumb treatment.

  Write this exact content to `apps/frontend/src/styles/animations.css`:

  ```css
  /* animations.css — global keyframes + reduced-motion guards + range-input thumb */
  /* Contract: specs/003-design-handoff/data-model.md §Animation */

  /* =========================================================================
     KEYFRAMES — safe to define at top level; do not animate until a consumer
     rule references them inside a prefers-reduced-motion: no-preference block.
     ========================================================================= */

  /* Cell flips to claimed: scale pop + brightness pulse.
     Reduced-motion fallback: cell flips color only (color change is immediate). */
  @keyframes claimPulse {
    0%   { transform: scale(0.6); filter: brightness(2.2); }
    60%  { transform: scale(1.12); filter: brightness(1.4); }
    100% { transform: scale(1); filter: brightness(1); }
  }

  /* Subtle idle cell pulse (decorative background).
     Reduced-motion fallback: static cell. */
  @keyframes cellPulse {
    0%, 100% { opacity: 0.9; }
    50%      { opacity: 0.5; }
  }

  /* Timer critical-state glow.
     Reduced-motion fallback: static glow at peak intensity (info preserved). */
  @keyframes timerPulse {
    0%, 100% { box-shadow: 0 0 24px rgba(247, 23, 86, 0.5); }
    50%      { box-shadow: 0 0 40px rgba(247, 23, 86, 0.8); }
  }

  /* Decorative backdrop drift.
     Reduced-motion fallback: static backdrop. */
  @keyframes gridDrift {
    from { background-position: 0 0, 0 0; }
    to   { background-position: 48px 48px, 48px 48px; }
  }

  /* Loading-indicator opacity pulse.
     Reduced-motion fallback: static full-opacity dot (info preserved: loading). */
  @keyframes zpulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.3; }
  }

  /* Page/section enter: tiny translate+fade.
     Reduced-motion fallback: element is immediately at final position+opacity. */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* =========================================================================
     CONSUMER RULES — guarded so the default is the reduced-motion path.
     Animations apply ONLY when the user has NO reduced-motion preference AND
     the showcase override attribute is not set.
     ========================================================================= */
  @media (prefers-reduced-motion: no-preference) {
    html:not([data-reduced-motion='true']) .cell-just-claimed {
      animation: claimPulse 400ms var(--ease-out) 1;
    }
    html:not([data-reduced-motion='true']) .cell-idle-pulse {
      animation: cellPulse 2400ms var(--ease-in-out) infinite;
    }
    html:not([data-reduced-motion='true']) .timer-critical {
      animation: timerPulse 800ms var(--ease-in-out) infinite;
    }
    html:not([data-reduced-motion='true']) .grid-bg-drift {
      animation: gridDrift 40s linear infinite;
    }
    html:not([data-reduced-motion='true']) .z-loading-pulse {
      animation: zpulse 1200ms var(--ease-in-out) infinite;
    }
    html:not([data-reduced-motion='true']) .fade-in {
      animation: fadeUp 300ms var(--ease-out) 1;
    }
  }

  /* =========================================================================
     Global range-input (slider) thumb — FR-015. Ships once; every Slider
     primitive inherits it without per-component restyling.
     ========================================================================= */
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

  **Verify**: `grep -c '@keyframes' apps/frontend/src/styles/animations.css` returns `6`. `grep -c 'prefers-reduced-motion: no-preference' apps/frontend/src/styles/animations.css` returns `1`.

- [x] **T018** [P] Create `apps/frontend/src/types/tokens.d.ts` with a string-literal union of every CSS variable name.

  Write this exact content to `apps/frontend/src/types/tokens.d.ts`:

  ```ts
  // tokens.d.ts — typed handle on token names declared in styles/tokens.css.
  // Keep this in sync with the :root block in tokens.css.
  // Contract: specs/003-design-handoff/contracts/tokens.contract.md

  export type TokenName =
    // Brand — ink surface
    | '--ink-900' | '--ink-850' | '--ink-800' | '--ink-700'
    | '--ink-veil-93' | '--ink-veil-96'
    // Brand — accents
    | '--accent-yellow' | '--accent-yellow-deep' | '--accent-yellow-mustard' | '--accent-yellow-dim'
    | '--magenta-500' | '--magenta-300' | '--magenta-700' | '--magenta-soft'
    | '--fire-red' | '--fire-pink'
    | '--sky-300' | '--sky-glow'
    | '--cyan-400' | '--cyan-300' | '--cyan-200'
    | '--lime-500' | '--lime-400' | '--lime-300' | '--lime-700' | '--lime-900'
    | '--orange-500' | '--peach-300'
    // Text neutrals
    | '--fg-primary' | '--fg-secondary' | '--fg-tertiary' | '--fg-muted' | '--fg-faint'
    | '--fg-softgray' | '--fg-steel'
    // Team / cell state
    | '--team-red' | '--team-red-soft' | '--team-red-deep'
    | '--team-blue' | '--team-blue-soft' | '--team-blue-deep'
    | '--team-neutral'
    | '--cell-empty' | '--cell-empty-border' | '--cell-hover' | '--cell-hover-border'
    | '--cell-own' | '--cell-opponent' | '--cell-disabled'
    // Semantic
    | '--bg-page' | '--bg-elevated' | '--bg-card' | '--bg-card-solid' | '--bg-overlay'
    | '--border-subtle' | '--border-default' | '--border-strong' | '--border-accent'
    | '--focus-ring'
    // Gradients
    | '--grad-fire' | '--grad-magenta-glass' | '--grad-magenta-solid' | '--grad-lime' | '--grad-page-veil'
    // Glows / shadows
    | '--glow-sky' | '--glow-yellow' | '--glow-magenta' | '--glow-red'
    | '--shadow-card' | '--shadow-lift'
    // Radii
    | '--radius-xs' | '--radius-sm' | '--radius-md' | '--radius-lg'
    | '--radius-xl' | '--radius-2xl' | '--radius-3xl' | '--radius-pill' | '--radius-full'
    // Spacing
    | '--sp-0' | '--sp-1' | '--sp-2' | '--sp-3' | '--sp-4' | '--sp-5'
    | '--sp-6' | '--sp-8' | '--sp-10' | '--sp-12' | '--sp-16'
    // Typography
    | '--font-ui' | '--font-display' | '--font-mono'
    | '--fw-regular' | '--fw-medium' | '--fw-semibold' | '--fw-bold'
    | '--fs-xs' | '--fs-sm' | '--fs-body' | '--fs-body-lg' | '--fs-base'
    | '--fs-md' | '--fs-lg' | '--fs-xl' | '--fs-2xl' | '--fs-3xl'
    | '--lh-tight' | '--lh-snug' | '--lh-normal' | '--lh-loose'
    // Motion
    | '--ease-out' | '--ease-in-out' | '--dur-fast' | '--dur-base' | '--dur-slow'
    // Breakpoints
    | '--bp-mobile' | '--bp-tablet' | '--bp-desktop' | '--bp-wide'
    // Blur
    | '--blur-sm' | '--blur-md' | '--blur-lg';

  /** Returns `var(--token-name)` with the TokenName narrowed at the type level. */
  export function cssVar<T extends TokenName>(name: T): `var(${T})` {
    return `var(${name})` as `var(${T})`;
  }
  ```

  **Verify**: `pnpm --filter @zonite/frontend exec tsc --noEmit` exits 0.

- [x] **T019** Update `apps/frontend/src/main.tsx` to import `tokens.css` and `animations.css` (+ a Tailwind directive CSS file).

  Step 1: create `apps/frontend/src/styles/tailwind.css` with exactly:

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

  Step 2: open `apps/frontend/src/main.tsx` and add these three import lines at the top of the file, **before** any other imports:

  ```ts
  import './styles/tokens.css';
  import './styles/tailwind.css';
  import './styles/animations.css';
  ```

  Keep everything else in `main.tsx` as it was in Phase 0.

  **Verify**: `pnpm --filter @zonite/frontend dev` boots; `curl -s http://localhost:5173 | grep -q 'Zonite'` succeeds. Open the page: the body background is the ink-purple color `rgb(16, 6, 19)` (use devtools to confirm). Font family on `body` resolves to `Mulish`.

- [x] **T020** Update `apps/frontend/src/App.tsx` to stop using the hard-coded `#100613` and instead rely on tokens (and optionally a small Tailwind class set).

  Replace the entire contents of `apps/frontend/src/App.tsx` with:

  ```tsx
  import { GameStatus } from '@zonite/shared';

  export function App(): JSX.Element {
    return (
      <main className="fade-in" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-6)',
        textAlign: 'center',
      }}>
        <h1 className="h1" style={{ color: 'var(--fg-primary)' }}>
          Zonite
        </h1>
        <p className="eyebrow" style={{ color: 'var(--fire-pink)' }}>
          Phase&nbsp;1 — Design Handoff Adopted
        </p>
        <p className="caption" style={{ color: 'var(--fg-tertiary)' }}>
          Shared contract boundary: {GameStatus.LOBBY}
        </p>
      </main>
    );
  }
  ```

  **Verify**: `pnpm --filter @zonite/frontend type-check` exits 0. Visually in the browser: the word "Zonite" renders in the display font (Bruno Ace SC), the eyebrow label renders in fire-pink uppercase with wide letter-spacing, and the caption is tertiary-white on the ink-purple canvas.

**Checkpoint (Phase 2 complete)**: Tokens and animations are live; the Phase 0 landing page renders with handoff styling. All three P1 user stories + two P2 user stories unblocked.

---

## Phase 3: User Story 2 — Exactly one token source of truth (Priority: P1)

**Goal**: Prove the lint-enforced "no hex / no raw font-family outside tokens.css" rule by exercising both gates and confirming they fire.

**Independent Test**: Staging a one-line violation in CSS triggers a stylelint error naming the file and line; staging a one-line violation in TSX triggers the custom ESLint rule.

- [x] **T021** [US2] Run `lint:css` on the clean tree — must pass green with zero errors.

  ```bash
  pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"
  ```

  **Verify**: exits 0 with no output (or only informational output).

- [x] **T022** [US2] Verify stylelint catches a hex color in a non-token CSS file.

  Create a temporary file `apps/frontend/src/styles/__lint-test.css` with one line:

  ```css
  .test { color: #ff0000; }
  ```

  Run `pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"`.

  **Expected output** includes `color-no-hex` as the rule name, `__lint-test.css` as the file, and a non-zero exit code.

  **Cleanup**: delete the test file: `rm apps/frontend/src/styles/__lint-test.css`. Re-run `lint:css` and confirm it returns to green.

  **Verify**: evidence of a non-zero exit while the file existed, plus a clean re-run after deletion.

- [x] **T023** [US2] Verify the custom ESLint rule `zonite-local/no-hex-in-jsx` catches a hex in a TSX inline style.

  Temporarily edit `apps/frontend/src/App.tsx` — change the `color: 'var(--fg-primary)'` in the `<h1>` to `color: '#ffffff'`. Save.

  Run `pnpm lint` from repo root.

  **Expected output** includes the rule name `zonite-local/no-hex-in-jsx`, a pointer at the offending line, and the message "Hard-coded hex color "#ffffff" in inline style. Use a token from tokens.css (e.g., var(--accent-yellow))."

  **Cleanup**: revert `App.tsx` to use `color: 'var(--fg-primary)'` again. Re-run `pnpm lint` and confirm it returns to green.

  **Verify**: evidence of the error while the edit was in place, plus a clean re-run after revert.

- [x] **T024** [US2] Run the full quality-gate sweep and confirm all green.

  ```bash
  node scripts/verify-handoff.mjs
  pnpm lint
  pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"
  pnpm type-check
  ```

  **Verify**: all four commands exit 0. `pnpm type-check` finishes in under 60 seconds on a typical laptop.

**Checkpoint (US2 complete)**: The single-token-source-of-truth rule is mechanically enforced.

---

## Phase 4: User Story 1 — Visual parity from the first screen (Priority: P1)

**Goal**: Prove that the landing page renders with handoff tokens applied, that every inspected value resolves through a token, and that a token change propagates without per-component edits.

**Independent Test**: A reviewer compares the rendered landing page at `/` to the handoff prototype's dark canvas + eyebrow + display type and sees visual parity.

- [x] **T025** [US1] Start the dev server and perform a manual landing-page inspection.

  ```bash
  pnpm --filter @zonite/frontend dev
  ```

  Open <http://localhost:5173> in a Chromium browser.

  **Verify — all must be true**:
  - The page background matches `rgb(16, 6, 19)` exactly (devtools → Elements → `body` computed style → `background-color`).
  - The `<h1>` "Zonite" renders in `'Bruno Ace SC'` (devtools → Elements → inspected h1 → Computed → `font-family`).
  - The eyebrow "Phase 1 — Design Handoff Adopted" is uppercase, fire-pink (`rgb(248, 29, 74)`), with letter-spacing 0.58em.
  - The caption line is `rgba(255, 255, 255, 0.6)`.
  - Devtools → Network: the only font requests are to local `/fonts/*.woff2`. No requests to `fonts.googleapis.com` or `fonts.gstatic.com`.

- [x] **T026** [US1] Prove token change propagation: temporarily tweak `--accent-yellow` and observe the effect.

  Open `apps/frontend/src/styles/tokens.css`. Find `--accent-yellow: rgb(253, 235, 86);`. Temporarily change it to `--accent-yellow: rgb(255, 0, 255);` (magenta). Save.

  Visual check: in the browser, focus the `<h1>` (hovering a keyboard shortcut) or inspect any element styled with yellow — the focus-ring color (which uses `--accent-yellow`) is now magenta. If no visible yellow-consumer is on the landing page yet, the test still passes if the computed value of `--accent-yellow` in devtools → Elements → :root → Computed is `rgb(255, 0, 255)`.

  **Revert**: restore `--accent-yellow: rgb(253, 235, 86);` and save.

  **Verify**: you saw the magenta variable resolve in at least one computed style during the temporary edit, and the landing page returns to its yellow-accent state after revert.

**Checkpoint (US1 complete)**: The landing page is visibly Yalgamers-branded and token-driven.

---

## Phase 5: User Story 3 — Base UI primitives from the handoff (Priority: P1)

**Goal**: Ship every primitive named in [contracts/primitives.contract.md](./contracts/primitives.contract.md) in the production stack with handoff styling, documented surfaces, and keyboard operability.

**Independent Test**: Each primitive renders correctly in the showcase (added in Phase 8) without per-call-site styling, and in every documented visual state.

Work layer-by-layer: layout → common → ui → game → icons barrel. Within each layer, `[P]` tasks may run in parallel (different files).

### 5.1 Layout primitives

- [x] **T027** [P] [US3] Create `apps/frontend/src/components/layout/CornerBlobs.tsx` + `CornerBlobs.module.css`.

  Reference: [contracts/primitives.contract.md §CornerBlobs](./contracts/primitives.contract.md). Source: `docs/design/zonite-game/project/components/Shell.jsx::CornerBlobs`.

  Create `CornerBlobs.tsx`:

  ```tsx
  import styles from './CornerBlobs.module.css';

  export interface CornerBlobsProps {
    /** 0 = hidden, 1 = visible */
    intensity?: 0 | 1;
  }

  export function CornerBlobs({ intensity = 1 }: CornerBlobsProps): JSX.Element | null {
    if (intensity === 0) return null;
    return (
      <div aria-hidden="true" className={styles.root}>
        <div className={styles.blobFire} />
        <div className={styles.blobMagenta} />
      </div>
    );
  }
  ```

  Create `CornerBlobs.module.css`:

  ```css
  /* Primitive: CornerBlobs
   * Documented surface: --bg-page (decorative layer, absolutely positioned behind content)
   * Consumed tokens: --grad-fire, --grad-magenta-glass, --blur-lg
   */
  .root {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .blobFire {
    position: absolute;
    right: -120px;
    bottom: -120px;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    background: var(--grad-fire);
    filter: var(--blur-lg);
    opacity: 0.35;
  }
  .blobMagenta {
    position: absolute;
    left: -140px;
    top: -140px;
    width: 480px;
    height: 480px;
    border-radius: 50%;
    background: var(--grad-magenta-glass);
    filter: var(--blur-lg);
    opacity: 0.45;
  }
  ```

  **Verify**: `pnpm --filter @zonite/frontend type-check` exits 0 after saving both files. `pnpm --filter @zonite/frontend exec stylelint "src/components/layout/CornerBlobs.module.css"` exits 0.

- [x] **T028** [P] [US3] Create `apps/frontend/src/components/layout/GridBg.tsx` + `GridBg.module.css`.

  Reference: [contracts/primitives.contract.md §GridBg](./contracts/primitives.contract.md). Source: `docs/design/zonite-game/project/components/Shell.jsx::GridBg`.

  Create `GridBg.tsx`:

  ```tsx
  import styles from './GridBg.module.css';

  export function GridBg(): JSX.Element {
    return (
      <div
        aria-hidden="true"
        className={`${styles.root} grid-bg-drift`}
      />
    );
  }
  ```

  The `grid-bg-drift` class on the root triggers the drift animation from `animations.css` (guarded by `prefers-reduced-motion: no-preference`).

  Create `GridBg.module.css`:

  ```css
  /* Primitive: GridBg
   * Documented surface: --bg-page (decorative layer)
   * Consumed tokens: --border-subtle, --fg-faint
   * Consumed animations: gridDrift (via .grid-bg-drift class)
   */
  .root {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(var(--border-subtle) 1px, transparent 1px),
      linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
    background-size: 48px 48px, 48px 48px;
    opacity: 0.45;
  }
  ```

  **Verify**: type-check + stylelint pass.

- [x] **T029** [P] [US3] Create `apps/frontend/src/components/layout/TopBar.tsx` + `TopBar.module.css`.

  Reference: [contracts/primitives.contract.md §TopBar](./contracts/primitives.contract.md). Source: `docs/design/zonite-game/project/components/Shell.jsx::TopBar`.

  Create `TopBar.tsx`:

  ```tsx
  import type { ReactNode } from 'react';
  import styles from './TopBar.module.css';

  export interface TopBarProps {
    onHome?: () => void;
    right?: ReactNode;
  }

  export function TopBar({ onHome, right }: TopBarProps): JSX.Element {
    return (
      <header className={styles.root}>
        <button
          type="button"
          className={styles.home}
          onClick={onHome}
          aria-label="Home"
        >
          <span className={styles.logoMark}>Z</span>
          <span className={styles.logoText}>Zonite</span>
        </button>
        {right && <div className={styles.right}>{right}</div>}
      </header>
    );
  }
  ```

  Create `TopBar.module.css`:

  ```css
  /* Primitive: TopBar
   * Documented surface: --bg-elevated
   * Consumed tokens: --bg-elevated, --border-subtle, --fg-primary, --accent-yellow,
   *                  --sp-4, --sp-6, --radius-full, --focus-ring, --font-display
   */
  .root {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-3) var(--sp-6);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }
  .home {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-1) var(--sp-2);
    background: transparent;
    border: none;
    color: var(--fg-primary);
    cursor: pointer;
    border-radius: var(--radius-md);
  }
  .home:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
  .logoMark {
    display: inline-grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-full);
    background: var(--accent-yellow);
    color: var(--ink-900);
    font-family: var(--font-display);
    font-size: var(--fs-base);
    font-weight: var(--fw-bold);
  }
  .logoText {
    font-family: var(--font-display);
    font-size: var(--fs-lg);
    letter-spacing: 0.02em;
    color: var(--fg-primary);
  }
  .right { display: flex; align-items: center; gap: var(--sp-3); }
  ```

  **Verify**: type-check + stylelint pass.

- [x] **T030** [US3] Create `apps/frontend/src/components/layout/Shell.tsx` + `Shell.module.css`. Depends on T027, T028, T029.

  Reference: [contracts/primitives.contract.md §Shell](./contracts/primitives.contract.md).

  Create `Shell.tsx`:

  ```tsx
  import type { ReactNode } from 'react';
  import { TopBar } from './TopBar';
  import { CornerBlobs } from './CornerBlobs';
  import { GridBg } from './GridBg';
  import styles from './Shell.module.css';

  export interface ShellProps {
    onHome?: () => void;
    right?: ReactNode;
    showGrid?: boolean;
    blobIntensity?: 0 | 1;
    children: ReactNode;
  }

  export function Shell({
    onHome, right, showGrid = true, blobIntensity = 1, children,
  }: ShellProps): JSX.Element {
    return (
      <div className={styles.root}>
        {showGrid && <GridBg />}
        <CornerBlobs intensity={blobIntensity} />
        <TopBar onHome={onHome} right={right} />
        <main className={styles.content}>{children}</main>
      </div>
    );
  }
  ```

  Create `Shell.module.css`:

  ```css
  /* Primitive: Shell
   * Documented surface: --bg-page (the outermost surface)
   */
  .root {
    position: relative;
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--fg-primary);
    font-family: var(--font-ui);
  }
  .content {
    position: relative;
    z-index: 1;
    padding: var(--sp-6);
  }
  ```

  **Verify**: type-check exits 0. Wrap the Phase 0 `App.tsx` temporarily in `<Shell>` and observe the top bar + backdrops in the browser.

### 5.2 Common primitives

- [x] **T031** [P] [US3] Create the brand-icon hand-drawn SVGs under `apps/frontend/src/components/common/icons/brand/`.

  Source: `docs/design/zonite-game/project/components/Icons.jsx`. Open that file and, for each icon function defined there, create one React component in `brand/`. Use this template per icon:

  ```tsx
  // apps/frontend/src/components/common/icons/brand/IconCrownHost.tsx
  import type { SVGProps } from 'react';

  export function IconCrownHost(props: SVGProps<SVGSVGElement>): JSX.Element {
    return (
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="currentColor"
        aria-hidden={props['aria-label'] ? undefined : true}
        {...props}
      >
        {/* Paste the SVG path(s) from Icons.jsx::IconCrown verbatim */}
      </svg>
    );
  }
  ```

  Repeat for: `IconCrownHost`, `ZoniteLogo`, `YalgamersLogo`, plus any other hand-drawn icon in `Icons.jsx` (open the file to enumerate). If `Icons.jsx` defines a tiny icon inline (like `IconSettings`, `IconX`) that Lucide already provides, **skip it from brand/** — Lucide covers it (see T032).

  **Verify**: each brand icon file type-checks. `ls apps/frontend/src/components/common/icons/brand/` shows at least 3 files.

- [x] **T032** [P] [US3] Create the icon barrel `apps/frontend/src/components/common/icons/index.ts` that re-exports brand icons + a Lucide subset under `Icon*` naming.

  Write this exact content:

  ```ts
  // Icon barrel — brand icons + Lucide subset, unified under Icon* names.
  // Override policy: see docs/design/OVERRIDE_POLICY.md.

  // --- Brand (custom SVG) ---
  export { IconCrownHost } from './brand/IconCrownHost';
  export { ZoniteLogo } from './brand/ZoniteLogo';
  export { YalgamersLogo } from './brand/YalgamersLogo';
  // (Add any other brand/*.tsx you created in T031 here.)

  // --- Generic (Lucide) — wrapped to Icon* names for a uniform API ---
  export {
    Copy as IconCopy,
    X as IconClose,
    ChevronDown as IconChevronDown,
    ChevronUp as IconChevronUp,
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    Check as IconCheck,
    CheckCircle2 as IconCheckCircle,
    XCircle as IconXCircle,
    Eye as IconEye,
    EyeOff as IconEyeOff,
    Search as IconSearch,
    Info as IconInfo,
    AlertTriangle as IconWarn,
    Settings as IconSettings,
    User as IconUser,
    ArrowLeft as IconArrowLeft,
    ArrowRight as IconArrowRight,
    Loader2 as IconLoader,
  } from 'lucide-react';
  ```

  **Verify**: `pnpm --filter @zonite/frontend type-check` exits 0. Importing `IconCopy` from `@/components/common/icons` in a scratch file resolves without error.

- [x] **T033** [P] [US3] Create `apps/frontend/src/components/common/PlayerChip.tsx` + `PlayerChip.module.css`.

  Reference: [contracts/primitives.contract.md §PlayerChip](./contracts/primitives.contract.md). Source: `Shell.jsx::PlayerChip`.

  Create `PlayerChip.tsx`:

  ```tsx
  import { clsx } from 'clsx';
  import styles from './PlayerChip.module.css';

  export interface PlayerChipProps {
    player: string;
    xp?: number;
    onClick?: () => void;
  }

  export function PlayerChip({ player, xp, onClick }: PlayerChipProps): JSX.Element {
    const interactive = Boolean(onClick);
    const Tag = interactive ? 'button' : 'div';
    return (
      <Tag
        type={interactive ? 'button' : undefined}
        onClick={onClick}
        className={clsx(styles.root, interactive && styles.interactive)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {player.slice(0, 1).toUpperCase()}
        </span>
        <span className={styles.name}>{player}</span>
        {typeof xp === 'number' && (
          <span className={styles.xp}>{xp.toLocaleString()} XP</span>
        )}
      </Tag>
    );
  }
  ```

  Create `PlayerChip.module.css`:

  ```css
  /* Primitive: PlayerChip
   * Documented surface: --bg-elevated
   * Consumed tokens: --fg-primary, --fg-tertiary, --sky-300, --border-subtle,
   *                  --accent-yellow, --ink-900, --radius-full, --sp-1, --sp-2, --sp-3
   */
  .root {
    display: inline-flex;
    align-items: center;
    gap: var(--sp-2);
    padding: var(--sp-1) var(--sp-3);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-full);
    background: transparent;
    color: var(--fg-primary);
    font-family: var(--font-ui);
    font-size: var(--fs-body);
    line-height: var(--lh-tight);
  }
  .interactive { cursor: pointer; }
  .interactive:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
  .interactive:hover { background: var(--bg-card); }
  .avatar {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: var(--radius-full);
    background: var(--accent-yellow);
    color: var(--ink-900);
    font-weight: var(--fw-bold);
    font-size: var(--fs-xs);
  }
  .name { color: var(--fg-primary); }
  .xp { color: var(--sky-300); font-weight: var(--fw-semibold); margin-left: var(--sp-1); }
  ```

  **Verify**: type-check + stylelint pass.

- [x] **T034** [P] [US3] Create `apps/frontend/src/components/common/Countdown.tsx` + `Countdown.module.css`.

  Reference: [contracts/primitives.contract.md §Countdown](./contracts/primitives.contract.md). Source: `docs/design/zonite-game/project/components/Countdown.jsx`.

  Create `Countdown.tsx`:

  ```tsx
  import { clsx } from 'clsx';
  import styles from './Countdown.module.css';

  export interface CountdownProps {
    seconds: number;
    compact?: boolean;
    /** Below this many seconds, enter "warning" color. Default 20. */
    warning?: number;
    /** Below this many seconds, enter "critical" color + pulse. Default 10. */
    critical?: number;
  }

  function level(seconds: number, warning: number, critical: number):
    'normal' | 'warning' | 'critical' {
    if (seconds <= critical) return 'critical';
    if (seconds <= warning) return 'warning';
    return 'normal';
  }

  function formatMmSs(seconds: number): string {
    const s = Math.max(0, Math.floor(seconds));
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }

  export function Countdown({
    seconds, compact = false, warning = 20, critical = 10,
  }: CountdownProps): JSX.Element {
    const state = level(seconds, warning, critical);
    return (
      <div
        role="timer"
        aria-live="polite"
        aria-atomic="true"
        className={clsx(
          styles.root,
          compact && styles.compact,
          state === 'warning' && styles.warning,
          state === 'critical' && styles.critical,
          state === 'critical' && 'timer-critical',
        )}
      >
        {formatMmSs(seconds)}
      </div>
    );
  }
  ```

  Create `Countdown.module.css`:

  ```css
  /* Primitive: Countdown
   * Documented surface: --bg-card-solid
   * Consumed tokens: --accent-yellow, --orange-500, --team-red, --glow-yellow,
   *                  --glow-red, --font-display, --fs-2xl, --radius-md, --sp-2, --sp-4
   * Consumed animations: timerPulse (critical state, class "timer-critical",
   *                      guarded by prefers-reduced-motion: no-preference)
   */
  .root {
    display: inline-block;
    padding: var(--sp-2) var(--sp-4);
    border-radius: var(--radius-md);
    background: var(--bg-card-solid);
    font-family: var(--font-display);
    font-size: var(--fs-2xl);
    line-height: var(--lh-tight);
    color: var(--accent-yellow);
    box-shadow: var(--glow-yellow);
    font-variant-numeric: tabular-nums;
  }
  .compact { font-size: var(--fs-lg); padding: var(--sp-1) var(--sp-3); }
  .warning { color: var(--orange-500); box-shadow: 0 0 20px rgba(240, 133, 25, 0.4); }
  .critical { color: var(--team-red); box-shadow: var(--glow-red); }
  ```

  **Verify**: type-check + stylelint pass. Write a quick throwaway usage in `App.tsx` (e.g., `<Countdown seconds={30} />`, then `seconds={15}`, then `seconds={8}`) and confirm color transitions.

### 5.3 UI primitives

Each of T035–T045 follows the same shape:

1. Create `<Name>.tsx` and `<Name>.module.css` under `apps/frontend/src/components/ui/`.
2. The `.module.css` header comment records `Documented surface` + `Consumed tokens` + `Consumed animations` per [contracts/primitives.contract.md](./contracts/primitives.contract.md).
3. Imports the `.module.css` via `import styles from './<Name>.module.css'`.
4. No hard-coded hex, no raw font-family; all style values reference tokens through `var(...)` or Tailwind utilities from T009.

Open [contracts/primitives.contract.md](./contracts/primitives.contract.md) side-by-side as you work — the props sketch, states, documented surface, consumed tokens, contrast, and keyboard behavior for each primitive are specified there.

- [x] **T035** [P] [US3] Create `apps/frontend/src/components/ui/Button.tsx` + `Button.module.css`.

  Props per contract: `{ variant: 'primary' | 'secondary' | 'ghost' | 'link'; size?: 'sm' | 'md' | 'lg'; disabled?: boolean; loading?: boolean; onClick: () => void; leftIcon?: ReactNode; rightIcon?: ReactNode; children: ReactNode }`. Implement with a native `<button>` element, `type="button"` by default. Apply `aria-busy="true"` when `loading`. Use `clsx` to compose variant + size + state classes. Loading state disables the button and renders `IconLoader` (from `@/components/common/icons`) before `children`. Focus-visible ring via `outline: 2px solid var(--focus-ring)`.

  CSS header comment MUST include: `Documented surface: --bg-page, --bg-card, --bg-elevated`.

  **Verify**: type-check + stylelint pass.

- [x] **T036** [P] [US3] Create `apps/frontend/src/components/ui/Input.tsx` + `Input.module.css`.

  Props per contract. Implement as a native `<input>` controlled component with props `{ type?: string; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; invalid?: boolean; id?: string }`. `onChange` receives the string value (not the event). Placeholder color uses `var(--fg-muted)`. `invalid=true` adds a red-border class referencing `var(--team-red)`.

  CSS header: `Documented surface: --bg-card-solid, --bg-elevated`.

  **Verify**: type-check + stylelint pass.

- [x] **T037** [US3] Create `apps/frontend/src/components/ui/Field.tsx` + `Field.module.css`. Depends on T036.

  Composition: label + `Input` + optional hint + optional inline error + optional right slot. Props per contract. The label's `htmlFor` must match the input's generated `id` (use `useId()` for the id). Error text uses `var(--team-red)`; hint uses `var(--fg-tertiary)`.

  CSS header: inherits from `Input` documented surface.

  **Verify**: type-check + stylelint pass.

- [x] **T038** [P] [US3] Create `apps/frontend/src/components/ui/OtpField.tsx` + `OtpField.module.css`.

  Props: `{ value: string; onChange: (v: string) => void; length?: 6 }`. Implement as a grid of `length` native `<input>` elements, each accepting one digit. Implement the keyboard behavior from the contract:
  - Digit entry auto-advances focus to the next slot.
  - Backspace on empty slot moves focus to previous slot.
  - Arrow Left / Right move focus between slots.
  - Paste distributes digits across slots.
  - First slot is the initial focus target when the component mounts (optional — don't auto-focus, just ensure Tab lands on it first).

  CSS header: `Documented surface: --bg-card-solid`. Per-slot focus ring via `--focus-ring`.

  **Verify**: type-check + stylelint pass. Test in a throwaway: type a 6-digit code and observe auto-advance + Backspace behavior.

- [x] **T039** [P] [US3] Create `apps/frontend/src/components/ui/Badge.tsx` + `Badge.module.css`.

  Props: `{ variant: 'red' | 'blue' | 'yellow' | 'neutral' | 'live'; children: ReactNode }`. Use semantic team / accent / fg tokens per variant. `live` variant adds the `z-loading-pulse` className (guarded animation) and cyan coloring.

  CSS header: no fixed documented surface (badges overlay arbitrary backgrounds); note "Readable on ≥ --bg-card".

  **Verify**: type-check + stylelint pass.

- [x] **T040** [US3] Create `apps/frontend/src/components/ui/Modal.tsx` + `Modal.module.css`.

  Props: `{ open: boolean; onClose: () => void; title?: string; children: ReactNode; size?: 'sm' | 'md' | 'lg'; dismissOnBackdrop?: boolean }`. Render via a React portal into `document.body`. Implement:
  - Backdrop uses `var(--bg-overlay)` + `backdrop-filter: var(--blur-md)`.
  - Dialog uses `var(--bg-card-solid)`, `var(--radius-lg)`, `var(--shadow-lift)`.
  - Apply `role="dialog"` `aria-modal="true"` and `aria-labelledby` pointing at the title `<h2>` (use `useId()` for the id).
  - **Focus trap**: when `open` becomes `true`, find the first focusable descendant and focus it; on Tab and Shift+Tab at the edges, cycle focus within the dialog.
  - **Esc closes** the dialog.
  - **Backdrop click closes** when `dismissOnBackdrop !== false`.
  - On close, restore focus to the element that had focus before opening.
  - Apply `.fade-in` class (from `animations.css`) to the dialog element for the enter transition.

  CSS header: `Documented surface: --bg-overlay (backdrop) + --bg-card-solid (dialog)`.

  **Verify**: type-check + stylelint pass. In a throwaway, mount `<Modal open onClose={() => {}}>...</Modal>` and confirm Tab trap, Esc close, and backdrop click close.

- [x] **T041** [P] [US3] Create `apps/frontend/src/components/ui/Alert.tsx` + `Alert.module.css`.

  Props per contract. Variants: `info` (sky), `success` (lime), `warn` (orange), `danger` (red). Dismissible variant renders a close button (IconClose from the icon barrel) that is focusable + activatable by Enter / Space. Applies `role="status"` for info/success, `role="alert"` for warn/danger.

  CSS header: `Documented surface: --bg-card-solid`.

  **Verify**: type-check + stylelint pass.

- [x] **T042** [P] [US3] Create `apps/frontend/src/components/ui/Avatar.tsx` + `Avatar.module.css`.

  Props per contract: `{ src?: string; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; onClick?: () => void }`. When `src` is provided, render `<img alt={name} />`. Otherwise render `name.slice(0, 2).toUpperCase()` as initials on `var(--bg-card-solid)`. Interactive avatar (has `onClick`) behaves as a button.

  CSS header: `Documented surface: any`; notes sizes in pixels per token (`--sp-6` / `--sp-8` / `--sp-10` / `--sp-12`-ish).

  **Verify**: type-check + stylelint pass.

- [x] **T043** [P] [US3] Create `apps/frontend/src/components/ui/Slider.tsx` + `Slider.module.css`.

  Props per contract. Implement as a wrapper around native `<input type="range">`. The global thumb styling from `animations.css` (T017) handles the thumb appearance — do NOT redefine `::-webkit-slider-thumb` in this primitive's CSS. Label + value readout use the same pattern as `Field`. Implement keyboard per contract: Left/Right = ±step (native); Home / End = min / max (native); Page Up / Down = ±10×step (native behavior — verify in the browser; if Firefox / WebKit differ, accept the native behavior as Phase 1 floor).

  **Verify**: type-check + stylelint pass.

- [x] **T044** [P] [US3] Create `apps/frontend/src/components/ui/SegButton.tsx` + `SegButton.module.css`.

  Props per contract: `{ options: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void; disabled?: boolean }`. Render a `<div role="radiogroup">` containing `<button role="radio" aria-checked={value === opt.value}>` per option. Arrow Left / Right moves focus between options; Enter / Space activates the focused option.

  CSS header: `Documented surface: --bg-elevated`.

  **Verify**: type-check + stylelint pass.

- [x] **T045** [P] [US3] Create `apps/frontend/src/components/ui/Chip.tsx` + `Chip.module.css`.

  Props per contract: `{ variant: 'neutral' | 'brand' | 'success' | 'warn'; interactive?: boolean; onClick?: () => void; onClose?: () => void; children: ReactNode }`. When `onClose` is provided, render `IconClose` as a **separate** focusable button (own tab-stop). When `interactive=true`, the main chip is a `<button>` with Enter/Space activation.

  CSS header: `Documented surface: --bg-card-solid`.

  **Verify**: type-check + stylelint pass.

### 5.4 Game primitive

- [x] **T046** [P] [US3] Create `apps/frontend/src/components/game/GridCell.tsx` + `GridCell.module.css`.

  Reference: [contracts/primitives.contract.md §GridCell](./contracts/primitives.contract.md). Sources: `GridCell.jsx` + `Game.jsx::Cell`.

  Create `GridCell.tsx`:

  ```tsx
  import { clsx } from 'clsx';
  import styles from './GridCell.module.css';

  export type GridCellState = 'empty' | 'hover' | 'own' | 'opponent' | 'disabled';

  export interface GridCellProps {
    state?: GridCellState;
    size?: number;
    label?: string;
    onClick?: () => void;
    /** Set true for exactly one render to play the claim-pulse animation. */
    justClaimed?: boolean;
  }

  export function GridCell({
    state = 'empty', size = 56, label, onClick, justClaimed = false,
  }: GridCellProps): JSX.Element {
    const interactive = state !== 'disabled' && Boolean(onClick);
    const Tag = interactive ? 'button' : 'div';
    return (
      <Tag
        type={interactive ? 'button' : undefined}
        onClick={interactive ? onClick : undefined}
        aria-label={label ?? `Cell ${state}`}
        aria-disabled={state === 'disabled' || undefined}
        style={{ width: size, height: size }}
        className={clsx(
          styles.cell,
          state === 'empty' && styles.empty,
          state === 'hover' && styles.hover,
          state === 'own' && styles.own,
          state === 'opponent' && styles.opponent,
          state === 'disabled' && styles.disabled,
          justClaimed && 'cell-just-claimed',
        )}
      />
    );
  }
  ```

  Create `GridCell.module.css`:

  ```css
  /* Primitive: GridCell
   * Documented surface: --bg-page
   * Consumed tokens: --cell-empty, --cell-empty-border, --cell-hover,
   *                  --cell-hover-border, --cell-own, --cell-opponent,
   *                  --cell-disabled, --radius-xs, --focus-ring
   * Consumed animations: claimPulse (class "cell-just-claimed", guarded)
   */
  .cell {
    display: block;
    border-radius: var(--radius-xs);
    border: 1px solid var(--cell-empty-border);
    background: var(--cell-empty);
    padding: 0;
    transition: background-color 120ms var(--ease-out);
  }
  button.cell { cursor: pointer; }
  button.cell:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
  .empty { background: var(--cell-empty); border-color: var(--cell-empty-border); }
  .hover { background: var(--cell-hover); border-color: var(--cell-hover-border); }
  .own { background: var(--cell-own); border-color: transparent; }
  .opponent { background: var(--cell-opponent); border-color: transparent; }
  .disabled {
    background: var(--cell-disabled);
    border-color: transparent;
    cursor: not-allowed;
  }
  ```

  **Verify**: type-check + stylelint pass.

**Checkpoint (US3 complete)**: All 19 primitives + the icons barrel are implemented. Each type-checks clean, its CSS passes stylelint, and its documented surface is recorded at the top of its `.module.css`.

---

## Phase 6: User Story 4 — Motion & reduced-motion verification (Priority: P2)

**Goal**: Prove that every handoff animation is wired up in its consumer primitive(s) and that the reduced-motion path collapses each animation while preserving its information.

**Independent Test**: Toggle the OS-level `prefers-reduced-motion` (via Chrome DevTools → Rendering panel) and confirm no animation plays; toggle it off and confirm each animation plays exactly as the handoff defines.

- [ ] **T047** [US4] Verify each animation's `no-preference` path works by running through a manual trigger sequence in the dev server.

  In the dev server (`pnpm --filter @zonite/frontend dev`), ensure DevTools → Rendering → `Emulate CSS prefers-reduced-motion` is set to **"no-preference"** (default).

  Quick harness: temporarily edit `apps/frontend/src/App.tsx` to render each animation-consuming primitive in a state where its animation fires:

  ```tsx
  import { useState, useEffect } from 'react';
  import { Shell } from './components/layout/Shell';
  import { GridCell } from './components/game/GridCell';
  import { Countdown } from './components/common/Countdown';

  export function App(): JSX.Element {
    const [seconds, setSeconds] = useState(15);
    useEffect(() => {
      const t = setInterval(() => setSeconds((s) => (s <= 0 ? 60 : s - 1)), 1000);
      return () => clearInterval(t);
    }, []);
    const [pulseKey, setPulseKey] = useState(0);
    return (
      <Shell>
        <div style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'center' }}>
          <GridCell key={pulseKey} state="own" size={72} justClaimed />
          <button type="button" onClick={() => setPulseKey((k) => k + 1)}>Trigger claim pulse</button>
        </div>
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <Countdown seconds={seconds} critical={10} warning={20} />
        </div>
      </Shell>
    );
  }
  ```

  **Verify — all must be observable**:
  - Clicking "Trigger claim pulse" makes the cell scale + brightness-pulse once (`claimPulse`).
  - As `seconds` decrements past 20, the Countdown shifts to orange.
  - Past 10, it shifts to `team-red` and begins the `timerPulse` glow.
  - The grid backdrop (from `Shell`'s `GridBg`) drifts slowly in the background.
  - The `<main>` has a gentle fade-up on mount (`fade-in` class in Shell's children; add it if missing).

  **Cleanup**: revert `App.tsx` to the Phase 2 content from T020.

- [ ] **T048** [US4] Verify every animation collapses under `prefers-reduced-motion: reduce`.

  Keep the same App.tsx harness from T047 (do the revert AFTER this task). In DevTools → Rendering, set `Emulate CSS prefers-reduced-motion` to **"reduce"**. Reload.

  **Verify — all must be observable**:
  - "Trigger claim pulse" still flips the cell color, but the scale/brightness pop does NOT play.
  - As `seconds` crosses 10, the Countdown turns red — but does not pulse.
  - The grid backdrop is static (no drift).
  - The `<main>` appears instantly (no fade-up).

  Reset the Rendering panel to "no-preference" and revert `App.tsx` to Phase 2 content.

- [ ] **T049** [US4] Confirm every `@media (prefers-reduced-motion: no-preference)` animation consumer exists for each keyframe.

  ```bash
  grep -E '^\s*@keyframes\s+\w+' apps/frontend/src/styles/animations.css
  grep -E 'animation:\s*\w+' apps/frontend/src/styles/animations.css
  ```

  **Verify**: every `@keyframes <name>` line has at least one matching `animation: <name>` entry inside the `@media (prefers-reduced-motion: no-preference)` block. If a keyframe has no consumer (e.g., `zpulse` is reserved for future use), that's acceptable — note it in a comment next to the keyframe: `/* reserved — no Phase 1 consumer */`.

**Checkpoint (US4 complete)**: Every animation plays as designed AND collapses safely when the user prefers reduced motion.

---

## Phase 7: User Story 5 — Spekit documentation + screenshots (Priority: P2)

**Goal**: Publish three new Speks and a screenshot gallery so design decisions are discoverable outside the repo.

**Independent Test**: An engineer opens the "Zonite Dev Hub" Spekit Topic and finds three Speks with the required content + 11 attached screenshots.

- [ ] **T050** [US5] Capture screenshots of the 11 handoff screens at 1280×800.

  Open `docs/design/zonite-game/project/Zonite App.html` in a Chromium browser at **1280×800 viewport** (use DevTools device mode → Responsive → set to 1280×800, zoom 100%).

  Use the dev-nav top-right widget in the prototype to jump between screens. For each screen, capture a full-page screenshot (DevTools → Cmd/Ctrl+Shift+P → "Capture full size screenshot") and save as `docs/design/screenshots/zonite-<screen>.png`:

  ```
  docs/design/screenshots/zonite-onboarding.png
  docs/design/screenshots/zonite-login.png
  docs/design/screenshots/zonite-signup.png
  docs/design/screenshots/zonite-forgot.png
  docs/design/screenshots/zonite-reset.png
  docs/design/screenshots/zonite-home.png
  docs/design/screenshots/zonite-create.png
  docs/design/screenshots/zonite-lobby.png
  docs/design/screenshots/zonite-game.png
  docs/design/screenshots/zonite-results.png
  docs/design/screenshots/zonite-profile.png
  ```

  Create the directory first: `mkdir -p docs/design/screenshots`.

  **Verify**: `ls docs/design/screenshots/*.png | wc -l` returns `11`.

- [ ] **T051** [US5] Publish Spek #1 "Zonite Design System — token sources and override policy" in the "Zonite Dev Hub" Spekit Topic.

  Required sections (the Spek body text):

  ```
  # Zonite Design System — token sources and override policy

  ## Where tokens come from
  - Tokens are delivered by the Claude Design handoff bundle at docs/design/zonite-game/.
  - The current in-repo token file is apps/frontend/src/styles/tokens.css — a verbatim copy of the bundle's colors_and_type.css, with the Google Fonts @import replaced by local @font-face declarations.
  - The adopted bundle version is recorded in docs/design/HANDOFF_VERSION.md (date + SHA256).

  ## Override policy
  [Copy the full content of docs/design/OVERRIDE_POLICY.md here, preserving section headings.]

  ## Lint enforcement
  - Stylelint rule color-no-hex blocks raw hex colors in any .css file under apps/frontend/src/** except tokens.css.
  - Custom ESLint rule zonite-local/no-hex-in-jsx blocks hex / raw font-family in JSX inline style={{ ... }} under apps/frontend/src/**.
  - Both rules name the offending file and line.

  ## How to refresh the bundle
  See Spek "Claude Design handoff bundle — what it is and how to update".

  ## Attached: handoff screens
  [Attach all 11 PNGs from docs/design/screenshots/.]
  ```

  **Verify**: the Spek is live in the "Zonite Dev Hub" Topic. All 11 screenshots are attached to this Spek.

- [ ] **T052** [US5] Publish Spek #2 "Claude Design handoff bundle — what it is and how to update".

  Required sections:

  ```
  # Claude Design handoff bundle — what it is and how to update

  ## What it is
  - A read-only reference directory at docs/design/zonite-game/ delivered by the design team.
  - Contains: handoff README (how to read the bundle), chat transcript (design intent), Zonite App.html prototype, colors_and_type.css token source, brand assets, prototype JSX components.
  - The bundle is NOT shipping code. Its role is to be the authoritative visual spec against which the Zonite frontend is built.

  ## Version manifest
  - docs/design/HANDOFF_VERSION.md records the adopted bundle's delivery date and SHA256.
  - The file is updated in lockstep with the bundle itself; no partial commits.

  ## SHA verification
  - scripts/verify-handoff.mjs recomputes the bundle tree's SHA256 deterministically (sorted paths, null-separated concatenation).
  - CI runs the script on every PR. A silent edit to the bundle fails CI.
  - Local developers can run `node scripts/verify-handoff.mjs` at any time.

  ## Refresh workflow (when design ships a new bundle)
  1. Extract the new tarball over docs/design/zonite-game/, replacing every file.
  2. Run `node scripts/verify-handoff.mjs --record` to update expected_sha256 in HANDOFF_VERSION.md.
  3. Diff the new colors_and_type.css into apps/frontend/src/styles/tokens.css — preserve the self-hosted @font-face rewire.
  4. Diff prototype components into the corresponding primitives if design changed them.
  5. Update apps/frontend/src/types/tokens.d.ts if the token set changed.
  6. Re-run the showcase + axe-core pass; fix any new failures.
  7. Open one PR that updates the bundle, the manifest, the tokens, any affected primitives, and any affected Speks.
  ```

  **Verify**: the Spek is live.

- [ ] **T053** [US5] Publish Spek #3 "Zonite typography — Gilroy vs. Mulish fallback".

  Required sections:

  ```
  # Zonite typography — Gilroy vs. Mulish fallback

  ## Intent
  - The Yalgamers brand specifies Gilroy as the primary UI font and Clash Display as the hero display font.
  - Both are proprietary and not currently licensed for Zonite use.

  ## Current stand-in
  - Mulish (OFL, Google Fonts) — closest geometric-humanist match to Gilroy. Used for --font-ui.
  - Bruno Ace SC (OFL, Google Fonts) — stand-in for Clash Display. Used for --font-display.
  - Inter — UI fallback weights.
  - All fonts are self-hosted under apps/frontend/public/fonts/ as woff2 (Latin subset) with font-display: swap. No runtime dependency on Google Fonts CDN.

  ## Single-file swap when Gilroy is licensed
  - Edit apps/frontend/src/styles/tokens.css only:
    1. Add new @font-face blocks pointing at Gilroy .woff2 files (dropped into apps/frontend/public/fonts/).
    2. Update --font-ui to lead with 'Gilroy'.
  - No other file in the frontend changes. Every primitive continues to consume --font-ui by name.

  ## Rationale
  - The constitution's Principle III requires the token file to be the single source of truth for typography.
  - Centralizing the typeface assignment in one place makes the future swap trivial and reviewable.
  ```

  **Verify**: the Spek is live.

- [ ] **T054** [US5] Link the three Speks from the repo README "Design system" section (extend T015).

  Open `README.md`. In the "Design system" section, add under the existing bullets:

  ```markdown
  - Spekit references (Zonite Dev Hub):
    - [Zonite Design System — token sources and override policy](<Spek URL 1>)
    - [Claude Design handoff bundle — what it is and how to update](<Spek URL 2>)
    - [Zonite typography — Gilroy vs. Mulish fallback](<Spek URL 3>)
  ```

  Fill in the three URLs from T051/T052/T053.

  **Verify**: `grep -A3 "Spekit references" README.md` shows the three links.

**Checkpoint (US5 complete)**: Three Speks live, 11 screenshots attached, README links updated.

---

## Phase 8: Polish — Showcase + axe-core + final exit checks

**Purpose**: Build the dev-only `/_showcase` route that renders every token and primitive + a reduced-motion toggle + an axe-core panel. Then run the full Phase 1 exit sweep.

- [ ] **T055** Update `apps/frontend/src/main.tsx` to add the dev-only `/_showcase` gate.

  Replace the body of `main.tsx` so it reads:

  ```tsx
  import './styles/tokens.css';
  import './styles/tailwind.css';
  import './styles/animations.css';

  import { StrictMode } from 'react';
  import { createRoot } from 'react-dom/client';
  import { App } from './App';

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('#root not found');
  const root = createRoot(rootEl);

  if (import.meta.env.DEV && window.location.pathname === '/_showcase') {
    void import('./showcase/Showcase').then(({ Showcase }) => {
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

  **Verify**: type-check passes. `pnpm --filter @zonite/frontend dev` still serves the landing page at `/`.

- [ ] **T056** Create `apps/frontend/src/showcase/ReducedMotionToggle.tsx`.

  Write this exact content:

  ```tsx
  import { useEffect, useState } from 'react';

  export function ReducedMotionToggle(): JSX.Element {
    const [on, setOn] = useState(false);
    useEffect(() => {
      const html = document.documentElement;
      if (on) html.setAttribute('data-reduced-motion', 'true');
      else html.removeAttribute('data-reduced-motion');
      return () => html.removeAttribute('data-reduced-motion');
    }, [on]);
    return (
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        style={{
          padding: 'var(--sp-2) var(--sp-3)',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-subtle)',
          background: on ? 'var(--accent-yellow)' : 'transparent',
          color: on ? 'var(--ink-900)' : 'var(--fg-tertiary)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--fs-xs)',
          fontWeight: 'var(--fw-bold)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        Reduced motion: {on ? 'ON' : 'OFF'}
      </button>
    );
  }
  ```

  **Verify**: type-check passes.

- [ ] **T057** Create `apps/frontend/src/showcase/AxePanel.tsx` — dev-only axe-core wiring.

  Write this exact content:

  ```tsx
  import { useEffect } from 'react';

  export function AxePanel(): JSX.Element | null {
    useEffect(() => {
      if (!import.meta.env.DEV) return;
      let cancelled = false;
      void (async () => {
        const [axe, React, ReactDOM] = await Promise.all([
          import('@axe-core/react'),
          import('react'),
          import('react-dom'),
        ]);
        if (cancelled) return;
        axe.default(React.default ?? React, ReactDOM.default ?? ReactDOM, 1000, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
        });
      })();
      return () => { cancelled = true; };
    }, []);
    if (!import.meta.env.DEV) return null;
    return (
      <aside
        aria-label="Axe-core report"
        style={{
          padding: 'var(--sp-3) var(--sp-4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card-solid)',
          color: 'var(--fg-tertiary)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--fs-sm)',
        }}
      >
        Axe-core runs on every render. Open the browser console to see reported
        WCAG 2.1 AA violations (if any).
      </aside>
    );
  }
  ```

  **Verify**: type-check passes.

- [ ] **T058** Create each showcase section file.

  Create `apps/frontend/src/showcase/sections/TokensSection.tsx` — a table/grid of every token from the category table in [contracts/tokens.contract.md §Token category table](./contracts/tokens.contract.md). For each color token: render a swatch div 48×48px with `background: var(--<name>)`; label with the variable name and the resolved value (use `getComputedStyle(document.documentElement).getPropertyValue('--<name>')`). For spacing tokens: render a bar with `width: var(--<name>)` + label. For radius: render a box with `border-radius: var(--<name>)`. For font sizes: render sample text with the size applied.

  Create `apps/frontend/src/showcase/sections/LayoutSection.tsx` — render `<Shell>` (maybe nested inside a bordered preview area) with `<TopBar>`, `<CornerBlobs intensity={0}>`, `<CornerBlobs intensity={1}>`, `<GridBg>` demos.

  Create `apps/frontend/src/showcase/sections/CommonSection.tsx` — render `<PlayerChip>` default + interactive; `<Countdown>` with three fixed seconds (30, 15, 8) to demonstrate each color band; every icon from the icon barrel in a grid.

  Create `apps/frontend/src/showcase/sections/UiSection.tsx` — render every primitive T035–T045 in every documented state (see contract). Include a button that opens the Modal.

  Create `apps/frontend/src/showcase/sections/GameSection.tsx` — render a `<GridCell>` in each of its 5 states (empty, hover, own, opponent, disabled), plus a "Trigger claim pulse" button that toggles `justClaimed` via `key` rotation on a demo cell.

  Create `apps/frontend/src/showcase/sections/AnimationsSection.tsx` — for each of the 6 animations, render a small demo element with a "play" button that applies / removes the animation class (e.g., toggle `.cell-just-claimed` on a demo div).

  **Verify**: type-check passes. Each section file exists.

- [ ] **T059** Create `apps/frontend/src/showcase/Showcase.tsx` — the top-level showcase page.

  Write this exact content:

  ```tsx
  import { ReducedMotionToggle } from './ReducedMotionToggle';
  import { AxePanel } from './AxePanel';
  import { TokensSection } from './sections/TokensSection';
  import { LayoutSection } from './sections/LayoutSection';
  import { CommonSection } from './sections/CommonSection';
  import { UiSection } from './sections/UiSection';
  import { GameSection } from './sections/GameSection';
  import { AnimationsSection } from './sections/AnimationsSection';

  export function Showcase(): JSX.Element {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--fg-primary)',
        fontFamily: 'var(--font-ui)',
        padding: 'var(--sp-8)',
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-8)',
        }}>
          <h1 className="h1">Zonite — Phase 1 Showcase</h1>
          <ReducedMotionToggle />
        </header>

        <AxePanel />

        <section id="tokens" style={{ marginTop: 'var(--sp-10)' }}>
          <h2 className="h2">Tokens</h2>
          <TokensSection />
        </section>

        <section id="layout" style={{ marginTop: 'var(--sp-10)' }}>
          <h2 className="h2">Layout</h2>
          <LayoutSection />
        </section>

        <section id="common" style={{ marginTop: 'var(--sp-10)' }}>
          <h2 className="h2">Common</h2>
          <CommonSection />
        </section>

        <section id="ui" style={{ marginTop: 'var(--sp-10)' }}>
          <h2 className="h2">UI Primitives</h2>
          <UiSection />
        </section>

        <section id="game" style={{ marginTop: 'var(--sp-10)' }}>
          <h2 className="h2">Game</h2>
          <GameSection />
        </section>

        <section id="animations" style={{ marginTop: 'var(--sp-10)' }}>
          <h2 className="h2">Animations</h2>
          <AnimationsSection />
        </section>
      </div>
    );
  }
  ```

  **Verify**: type-check passes. Navigate to <http://localhost:5173/_showcase> in dev — the full showcase renders.

- [ ] **T060** Run the axe-core contrast + keyboard audit in the showcase.

  In dev (`pnpm --filter @zonite/frontend dev`), open <http://localhost:5173/_showcase> and DevTools console.

  **Verify**:
  - Axe-core logs in console show zero WCAG 2.1 AA violations. If any appear, fix the offending primitive's surface contrast or update its `Documented surface` comment + `contracts/primitives.contract.md` entry with design approval.
  - Keyboard walk-through: Tab through the entire page. Every interactive primitive receives visible focus (yellow outline). Enter / Space activates Buttons, Chips, SegButtons, the Reduced-motion toggle. Esc closes the Modal demo. Arrow keys move between OtpField slots and adjust the Slider.
  - Toggle reduced motion ON (both via the page's toggle and via Chrome DevTools Rendering panel). Trigger each animation demo — every one collapses to an instant state change.

- [ ] **T061** Run the production build + tree-shake verification.

  ```bash
  pnpm --filter @zonite/frontend build
  pnpm --filter @zonite/frontend preview
  ```

  In the preview URL:

  **Verify**:
  - `/` renders the Phase 0 / Phase 2 landing page with tokens applied.
  - `/_showcase` does NOT render the showcase. Falls through to the default behavior (either the root `<App />` or a browser 404).
  - DevTools → Network on a full reload: zero requests to `fonts.googleapis.com` / `fonts.gstatic.com`. All `/fonts/*.woff2` are served from the local preview.
  - DevTools → Sources → inspect the built JS bundles. Files matching `src/showcase/*` are ABSENT from the production output. Run `pnpm --filter @zonite/frontend build -- --mode production && grep -rL "Showcase" apps/frontend/dist/assets/*.js` — the grep finds no matches (or returns every file as not containing "Showcase").

- [ ] **T062** Run the complete quality-gate sweep.

  From repo root:

  ```bash
  node scripts/verify-handoff.mjs
  pnpm install  # re-check lockfile is stable
  pnpm lint
  pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"
  pnpm type-check
  pnpm --filter @zonite/frontend build
  ```

  **Verify**: every command exits 0. Type-check completes in ≤ 60 seconds.

- [ ] **T063** Update the `[CLAUDE.md](../../CLAUDE.md)` "Recent Changes" section to reflect Phase 1 completion.

  Open `/media/jo/store/youssef/projects/yal-gaming/zonite/CLAUDE.md`. Find the "Recent Changes" section. Replace / prepend with:

  ```markdown
  ## Recent Changes
  - 003-design-handoff: Adopted Claude Design handoff bundle as the authoritative visual source. Tokens live in `apps/frontend/src/styles/tokens.css`; animations in `apps/frontend/src/styles/animations.css`. Component libraries shipped under `apps/frontend/src/components/{layout,ui,common,game}/`. Dev-only `/_showcase` route for visual + a11y verification. Lint-enforced no-hex / no-raw-font-family in frontend source.
  - 001-foundation-setup: Added TypeScript ^5.7 (pinned at repo root, inherited by all packages).
  ```

  **Verify**: `head -20 /media/jo/store/youssef/projects/yal-gaming/zonite/CLAUDE.md` shows the updated recent-changes entry.

- [ ] **T064** Complete the Phase 1 exit checklist (from [quickstart.md §15](./quickstart.md)) and record results in the Phase 1 PR description.

  Copy this checklist into the PR description and tick each box after confirming:

  ```
  - [ ] docs/design/zonite-game/ committed; HANDOFF_VERSION.md has non-placeholder SHA; CI step runs green.
  - [ ] apps/frontend/src/styles/tokens.css is a verbatim copy of colors_and_type.css modulo the @font-face rewire.
  - [ ] apps/frontend/src/styles/animations.css ships every keyframe + guarded consumer rules + global range thumb.
  - [ ] 4 layout + 3 common + 11 UI + 1 game primitives + icon barrel are implemented.
  - [ ] /_showcase renders in dev; tree-shaken from production.
  - [ ] Axe-core on the showcase reports zero WCAG 2.1 AA failures.
  - [ ] Manual keyboard walk-through passes.
  - [ ] Reduced-motion pass: every animation collapses while preserving information.
  - [ ] Stylelint + custom ESLint rule catch attempted hex / font-family violations.
  - [ ] pnpm type-check passes in ≤ 60s.
  - [ ] Production build: zero external font-CDN requests; /fonts/*.woff2 served locally.
  - [ ] Three Speks published; 11 screenshots attached.
  - [ ] docs/design/OVERRIDE_POLICY.md exists and matches Spek 1.
  - [ ] README links to docs/design/zonite-game/README.md and the three Speks.
  ```

  **Verify**: every checkbox is ticked in the PR description; the PR links the three Speks in its body.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001–T015)**: no dependencies. Can start immediately.
- **Foundational (Phase 2, T016–T020)**: depends on Setup. BLOCKS all user stories.
- **US1 (Phase 4)**: depends on Foundational (specifically T020). Independent of US2/US3/US4/US5.
- **US2 (Phase 3)**: depends on Setup (T011, T012, T013) + Foundational. Independent of other stories.
- **US3 (Phase 5)**: depends on Foundational (T016, T017, T018, T019). Primitives within US3 are highly parallel; the only internal order is `Input` (T036) before `Field` (T037), and the layout primitives before `Shell` (T030 after T027/T028/T029).
- **US4 (Phase 6)**: depends on US3 (primitives that use animations must exist first — specifically T034 Countdown and T046 GridCell).
- **US5 (Phase 7)**: depends on Foundational (screenshots taken against the handoff prototype, not the Zonite frontend; bundle must exist). Independent of US1–US4 otherwise.
- **Polish (Phase 8, T055–T064)**: depends on US3 (showcase sections render primitives) and US4 (axe + reduced-motion verification integrate). Can proceed in parallel with US5.

### Within Phase 5 (US3) — parallel opportunities

The `[P]` markers identify tasks that touch different files with no intra-phase dependency. Safe parallel sets:

- **Batch A (layout)**: T027, T028, T029 — all `[P]`. T030 (`Shell`) waits for all three.
- **Batch B (common)**: T031 (brand icons, all `[P]` per file if split), T033 (`PlayerChip`), T034 (`Countdown`). T032 (icon barrel) depends on T031.
- **Batch C (UI, independent primitives)**: T035, T036, T038, T039, T041, T042, T043, T044, T045 — all `[P]`.
- **Batch D (UI, internal dep)**: T037 (`Field`) after T036 (`Input`). T040 (`Modal`) can be parallel with all other UI primitives.
- **Batch E (game)**: T046 — `[P]`.

### Parallel examples

```bash
# After Foundational (T020) is done, a single developer can parallelize:
# Terminal A (US2 verification):
pnpm --filter @zonite/frontend exec stylelint "src/**/*.css"   # T021

# Terminal B (US3 layout batch):
# Write CornerBlobs.tsx + GridBg.tsx + TopBar.tsx concurrently (T027, T028, T029)

# After layout batch completes, start Shell (T030) and UI primitives batch in parallel:
# One person on T030 (Shell)
# Another on T035 (Button), T036 (Input), T038 (OtpField) simultaneously
```

---

## Implementation Strategy

### MVP (P1 slice: US1 + US2 + US3)

1. Execute Phase 1 (Setup) end-to-end.
2. Execute Phase 2 (Foundational) end-to-end.
3. Execute Phase 3 (US2) — proves the lint rules.
4. Execute Phase 4 (US1) — proves visual parity on the landing page.
5. Execute Phase 5 (US3) — the bulk of work; proves the primitive library.
6. **STOP and VALIDATE**: at this point the core constitution-mandated surface is live. Demo to stakeholders.

### Incremental delivery

1. MVP (above) → deploy / demo.
2. Add Phase 6 (US4) → motion verification pass.
3. Add Phase 7 (US5) → Spekit + screenshots.
4. Add Phase 8 (Polish) → showcase + axe + final sweep.

### Parallel team strategy

With two developers:

- Dev A: Phase 1 + Phase 2 setup / foundation work.
- Once Foundational is done:
  - Dev A: Phase 5 (primitives) batches A → B → C → D → E in parallel.
  - Dev B: Phase 3 (US2) + Phase 7 (US5 — screenshots + Speks can be done in parallel with code work).
- Both converge on Phase 6 + Phase 8 after primitives land.

---

## Notes

- Every `[P]` task is in its own file. You can run them in parallel; they do not touch shared state.
- Every [Story] tag traces the task back to its user story in [spec.md](./spec.md).
- No test tasks are generated — test tooling is deferred per [spec.md §Assumptions](./spec.md). Verification is visual + lint + type-check + axe-core runtime + manual keyboard walk-through.
- Commit after each task (or after each parallel batch). Keep commits scoped.
- If a `verify` step fails, do not move to the next task. Find the root cause.
- The contracts under [contracts/](./contracts/) are the acceptance bar. Tasks reference them; primitives ship only when their contract row is met.
