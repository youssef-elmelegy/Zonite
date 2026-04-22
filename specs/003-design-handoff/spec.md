# Feature Specification: Design Handoff Adoption (Phase 1 — Style Extraction)

**Feature Branch**: `003-design-handoff`
**Created**: 2026-04-20
**Status**: Draft
**Input**: User description: "read @PLAN.md and create a specification for Phase 1 — Style Extraction (Yalgamers Design System)"

## Clarifications

### Session 2026-04-20

- Q: What accessibility baseline MUST the Phase 1 primitives meet? → A: WCAG AA + reduced motion — every primitive meets WCAG AA color contrast on its documented surface, respects `prefers-reduced-motion` (animations collapse to instant state changes), and is keyboard-operable by default.
- Q: Where does the Phase 1 showcase view live so engineers can reach it but end users don't stumble into it in production? → A: Dev-only route — a `/_showcase` route registered only in development builds (gated by an env flag); production builds tree-shake the route and its components away entirely.
- Q: How are web fonts loaded in the production Zonite build? → A: Self-host `.woff2` files — ship Mulish and the display-font stand-in as local font assets; replace the handoff's Google Fonts `@import` with `@font-face` declarations in the token file. No third-party CDN dependency on page load.
- Q: Where does the Zonite icon set come from, and what happens when a later phase needs an icon the handoff didn't draw? → A: Handoff + one community library — ship the handoff's custom brand icons verbatim AND adopt a single community icon library (Lucide or similar) as the fallback for generic glyphs. The override policy names which icons must be drawn custom (brand-specific) vs. pulled from the library (generic UI glyphs).
- Q: How do we track which version of the handoff bundle the repository has adopted, and when is a refresh required? → A: Date + SHA256 — record the delivery date AND the SHA256 of the original tarball in `docs/design/HANDOFF_VERSION.md`. A CI check recomputes the SHA over the committed bundle tree and fails if it drifts from the recorded value. A refresh PR updates both the bundle contents and the recorded SHA in a single commit.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Zonite matches the design prototype from the first screen (Priority: P1)

A designer, product owner, or brand reviewer opens the Zonite frontend for the first time after Phase 1 lands. The visible surface — the dark ink-purple canvas, the fire-gradient hero headline, the electric-yellow primary action, the rounded glass card surfaces, the Mulish type, the wide-tracked eyebrow label — is indistinguishable from the prototype they signed off on in the design handoff. They do not need to toggle screens or hunt for parity; it is immediate on the first render.

**Why this priority**: The entire rationale for Phase 1 is look-and-feel parity with the delivered design. Every subsequent phase layers screens and behavior on top of whatever Phase 1 ships. If the first render diverges from the prototype, every downstream screen inherits the divergence and the rework is wider than the fix.

**Independent Test**: Place the rendered Zonite frontend next to the handoff prototype for the same screen (e.g., the logged-in home view, or any auth view), captured at the same viewport size. A reviewer who has both open compares brand colors, typeface, spacing rhythm, corner radii, shadows, and motion feel at a glance. The reviewer sees no salient difference and does not need a styleguide to confirm the match.

**Acceptance Scenarios**:

1. **Given** the Zonite frontend is running locally and a reference screen from the design handoff is open, **When** a reviewer compares the two side-by-side at a common viewport, **Then** colors, typeface, spacing, and radii visibly match with no obvious divergence (no missing fonts, no off-palette colors, no wrong corner radii).
2. **Given** any element in the live app, **When** a reviewer inspects it in the browser, **Then** every color, font, spacing, radius, and shadow resolves through a design token (a CSS custom property or a theme key that wraps one), not a hard-coded literal.
3. **Given** the designer updates a single token value in the handoff bundle (e.g., the brand accent shifts one step), **When** that updated value is diffed into the Zonite token file, **Then** every place in the frontend that used the token reflects the new value without any additional per-component edit.

---

### User Story 2 - Exactly one token source of truth, traceable to the handoff (Priority: P1)

A frontend engineer working on any later phase needs a color, a spacing step, a font size, a radius, a shadow, or a breakpoint. They find the value in the single authoritative token file that came from the design handoff, import it by name, and use it. They cannot introduce a raw hex color, a raw font-family string, or a second parallel scale — the quality gates block the commit before it can merge.

**Why this priority**: The project's constitution (Principle III — Yalgamers Fidelity) forbids hard-coded hex/fonts outside the token file. That guarantee is only meaningful if (a) the token file is the one delivered by design, (b) it is the *only* token file, and (c) any attempt to bypass it fails a mechanical check.

**Independent Test**: An engineer writes a component that references a token by name (e.g., a color like `--accent-yellow`, or a theme key that wraps it) and verifies the style renders as expected. A second engineer opens a pull request that introduces a literal hex color or raw font-family string in frontend source outside the token file; the automated checks fail the PR, naming the offending file and line.

**Acceptance Scenarios**:

1. **Given** the token file adopted from the handoff exists in the frontend, **When** an engineer imports any token category (color, spacing, type, radius, shadow, breakpoint, motion, blur) by name, **Then** the value resolves and is applied without further wiring.
2. **Given** the repository quality gates, **When** a pull request introduces a hard-coded hex color or raw font-family string in frontend source outside the token file, **Then** the gate blocks the merge with a message that names the offending file and line.
3. **Given** the repository, **When** an engineer searches the frontend source tree for color or font declarations, **Then** the only match of record is the one token file adopted from the handoff; no second palette, second type scale, or parallel tailwind theme with inline values exists.
4. **Given** a token is renamed or removed at the design source, **When** an engineer updates the local token file, **Then** any consumer that referenced the old name surfaces an error at the consumer's own file (so renames never silently flip to defaults).

---

### User Story 3 - Base UI primitives from the handoff are available and reusable (Priority: P1)

A frontend engineer starting Phase 7 work (home, create room, lobby, game, results, onboarding, login, signup, forgot, reset, profile) needs the primitives the prototype already draws — a button, a text input, a form field with inline error, a six-digit OTP field, a badge, a modal/dialog, an alert, an avatar, a slider, a segmented-button group, a chip, plus the page-level shell (top bar, corner blobs, grid backdrop), the player chip, the animated countdown, the claim-pulse grid cell, and the shared icon set. They find these in the frontend's component library, already styled to the handoff tokens, and compose them into new screens without reinventing or restyling.

**Why this priority**: The prototype is prototype-grade JSX; Phase 7 has to rebuild the screens in the production stack. If the primitives don't exist at Phase 7 start, every screen re-implements the same visual rules inline and drift becomes inevitable. It is P1 — on the same tier as the tokens themselves — because primitives without tokens are useless *and* tokens without primitives leave every screen doing its own styling.

**Independent Test**: An engineer imports each named primitive into a throwaway showcase view and renders a representative example of each visual state (primary / secondary / disabled, empty / focused / error, open / closed, etc.). Each primitive renders with handoff styling applied, without console warnings and without needing any per-usage CSS to look on-brand.

**Acceptance Scenarios**:

1. **Given** the primitive library exists, **When** an engineer imports the button, text input, form field, OTP field, badge, modal/dialog, alert, avatar, slider, segmented-button, and chip primitives, **Then** each renders styled to the handoff without ad-hoc CSS.
2. **Given** the layout library exists, **When** an engineer composes the page shell (top bar + decorative layers + content slot) and drops the player chip and countdown into it, **Then** the rendered result matches the prototype's page chrome.
3. **Given** the game-specific primitive set, **When** an engineer renders the grid cell primitive in each of its states (empty / hover / own / opponent / disabled), **Then** each state matches the prototype's cell styling, including the claim-pulse transition.
4. **Given** any primitive's visual must change brand-wide, **When** an engineer updates the underlying token, **Then** every use of the primitive reflects the change without touching the component's own source.

---

### User Story 4 - Prototype motion and interaction details survive the port (Priority: P2)

A player using the Zonite frontend experiences the prototype's motion vocabulary: claimed grid cells pop with the "claim-pulse" animation, the countdown pulses red when critical, the decorative backdrop drifts at its slow cadence, and pages fade up on route transition. A designer watching the rendered app recognizes the motion feel from the handoff without naming specific animations.

**Why this priority**: Motion is part of the product, not a decorative afterthought. The prototype's `@keyframes` are how cells "feel claimed" and how the timer communicates urgency. Dropping them collapses the game's tension. It is P2 only because the tokens and primitives (P1) unblock engineers and P2 motion can follow closely without gating — it MUST still ship in Phase 1.

**Independent Test**: On the throwaway showcase view, trigger each motion: claim a cell (pulse plays), hover an empty cell (hover state animates), watch the countdown step past the 20s and 10s thresholds (color transitions + critical pulse), watch the decorative grid backdrop drift. Each matches the prototype.

**Acceptance Scenarios**:

1. **Given** the handoff defines keyframe animations (cell-claim, cell-pulse, timer critical pulse, grid-drift, z-pulse, fade-up) and a custom slider-thumb treatment, **When** the frontend initializes, **Then** these animations and styles are registered globally and any consuming primitive uses them without redefining them.
2. **Given** a cell is claimed during a live game (or in the showcase), **When** the claim is reflected, **Then** the cell plays the claim-pulse animation exactly as defined by the handoff.
3. **Given** the countdown crosses the warning and critical thresholds, **When** the thresholds are crossed, **Then** the color transitions and critical pulse play as the handoff defines.
4. **Given** the user's OS-level "reduce motion" setting is enabled, **When** any Phase 1 animation would trigger, **Then** the animation collapses to an instant state change and the underlying information (e.g., claim occurred, timer is critical) is still conveyed.

---

### User Story 5 - Design decisions are discoverable in Spekit (Priority: P2)

An engineer (new or existing) encounters a styling question — "where do tokens come from?", "can I override a token locally?", "what happens when the design team ships a new version?", "why is the font Mulish and not Gilroy?" — and finds the answer in a Spek in the "Zonite Dev Hub" Topic, linked from the repository. They do not need to ask a maintainer or read PR history.

**Why this priority**: Constitution Principle V makes Spekit the system of record for "why" decisions. The handoff bundle, the token source, the override policy, the Mulish-vs-Gilroy stand-in, and the "how to refresh the bundle" process are exactly the kind of decisions that otherwise rot into tribal knowledge.

**Independent Test**: An engineer opens the "Zonite Dev Hub" Topic and finds a Spek that explains where tokens come from and how to override, a Spek that explains the handoff bundle and how to refresh it, and a Spek that records the typeface stand-in decision. Each is linked from the repository README.

**Acceptance Scenarios**:

1. **Given** Phase 1 is complete, **When** an engineer opens the Spekit Topic, **Then** they find at least these Speks: "token sources and override policy", "Claude Design handoff bundle — what it is and how to update", "Zonite typography — Gilroy vs. Mulish fallback".
2. **Given** the same Topic, **When** the engineer looks for visual references, **Then** they find screenshots of every handoff screen (onboarding, login, signup, forgot, reset, home, create, lobby, game, results, profile) attached to the design-system Spek.
3. **Given** a design-system decision is revised after Phase 1 lands, **When** the PR that revises it merges, **Then** the corresponding Spek is updated in the same PR.

---

### Edge Cases

- The design team delivers a new version of the handoff bundle. The documented refresh process (diff the new `colors_and_type.css` into the project's token file, update primitives only if the bundle changed them) runs in a single PR without a hand-mutation of the bundle itself. The bundle in the repo stays read-only — edits live in the project, not in the archived handoff.
- The Gilroy typeface becomes licensed later. Only the typography definition inside the token file changes (one `@import` swapped for a `@font-face`); no other file in the frontend is touched, and no component is restyled.
- The prototype implies behavior that the bundle does not spell out (e.g., focus-trap inside a modal, keyboard navigation for the OTP field). Phase 1 ships the visible styling and structure; behavior that a later phase needs is marked in the component as an intentional gap and a follow-up Spek is filed rather than invented inline.
- A primitive in the prototype is drawn inline inside a screen (e.g., a field with label + error text appears inside `Auth.jsx`). Phase 1 extracts it into the primitive library with a single API, rather than letting the same primitive drift separately inside each screen.
- A prior frontend commit pushed a hard-coded hex color or raw font-family. The lint rule surfaces it at Phase 1 adoption; the cleanup is part of Phase 1 exit so the rule passes on the main branch before other phases build on top.
- Decorative layers (corner blobs, grid backdrop) are tweakable on/off per the prototype's tweaks panel. Phase 1 preserves the ability to toggle them; the default ships whatever the handoff's delivered default is. The tweaks panel itself is prototype-only and does not ship in production.
- The handoff prototype uses `localStorage` directly for state. Phase 1 imports visual tokens and primitives only; it does NOT import or rely on the prototype's state mechanism. Any persistence decisions are Phase 6 concerns.

## Requirements _(mandatory)_

### Functional Requirements

**Design Handoff Bundle (Authoritative Source)**

- **FR-001**: The repository MUST contain the Claude Design handoff bundle committed as read-only reference material. The bundle includes: the handoff README, the chat transcript that captured design intent, the primary prototype HTML, the token CSS file, brand assets, and every prototype component file.
- **FR-002**: The bundle MUST NOT be hand-mutated. When the design team publishes a new version, the refresh is a diff-and-merge operation (changes flow into the project's token file and primitives) — the archived bundle in the repository is replaced as a whole or left as-is, but never edited in place.
- **FR-002a**: The repository MUST contain a version manifest at `docs/design/HANDOFF_VERSION.md` (or equivalent single file) recording, at minimum: (a) the delivery date of the currently-adopted handoff bundle and (b) the SHA256 of the original tarball as shipped by design. A CI check MUST recompute a deterministic hash over the committed bundle tree on every pull request and fail the check if the computed value does not match the recorded SHA. A refresh PR updates the bundle contents and the recorded SHA in the same commit.
- **FR-003**: The repository README MUST link to the handoff README so an engineer lands on the handoff before writing UI code.

**Token Source of Truth (Single File)**

- **FR-004**: The frontend MUST contain exactly one authoritative token file, sourced verbatim from the handoff's token CSS, and imported once at the application root so every token variable is live at the document root. Any other file that duplicates a color, font, spacing, radius, shadow, breakpoint, motion, or blur value is a violation.
- **FR-005**: The token file MUST preserve the handoff's token names unchanged (brand palette, semantic roles, team/cell-state tokens, gradients, radii, 4-point spacing, type stack and scale, motion, breakpoints, blur). Zonite-specific semantic aliases (e.g., grid-cell states that reference team colors) MAY be layered on top and MUST reference the underlying brand token rather than re-declare values.
- **FR-006**: Every styling value applied in frontend source MUST resolve to a token from the authoritative file. Hard-coded hex colors, literal font-family strings, raw pixel spacing that bypasses the scale, inline shadow/radius values, and tailwind-theme values that re-declare (rather than wrap) token variables are prohibited.
- **FR-007**: The token file's type category MUST ship the handoff's typography stand-in (Mulish + display-family stand-in + monospace fallback). When the licensed primary typeface (Gilroy) becomes available, the swap MUST be a single-location change in the token file with no other file edits.
- **FR-007a**: Web fonts MUST be **self-hosted** in the Zonite frontend. The handoff's Google Fonts `@import` statements are replaced at Phase 1 adoption with `@font-face` declarations that point at local `.woff2` files shipped as frontend static assets. The production build MUST NOT make any runtime request to Google Fonts (or any other font CDN) for Mulish, the display-font stand-in, or the monospace fallback. The `font-display` strategy chosen for each face MUST be documented next to its `@font-face` rule.

**Base Component Inventory (Ported from Handoff)**

- **FR-008**: The frontend MUST ship a layout library containing the page shell (top bar + decorative layers + content slot), the top bar component itself, and the decorative corner-blobs and grid-backdrop layers from the handoff prototype.
- **FR-009**: The frontend MUST ship a shared-primitives set adapted from the handoff prototype: button, text input, form field (label + input + inline error + optional hint + right-slot), six-digit OTP field, badge, modal/dialog surface, alert/notice, avatar, slider, segmented-button group, chip. Each primitive MUST render on-brand with no ad-hoc CSS at the call site.
- **FR-010**: The frontend MUST ship the common components used across the prototype's pages: player chip (used in the top bar), animated countdown, and a re-exportable icon set.
- **FR-010a**: The icon set MUST combine two sources with clear ownership:
  - **Brand icons** — every icon the handoff prototype's `Icons.jsx` defines is shipped verbatim as a custom-drawn glyph. These are brand-owned and MUST NOT be swapped for a library equivalent.
  - **Generic icons** — a single community icon library (e.g., Lucide) is adopted as the fallback for generic UI glyphs (copy, close, chevron, check, search, info, warning, arrow, etc.). Picking more than one generic library is a violation — there is exactly one.
  - The icon export surface presents brand and generic icons through the same consumer API, so a caller imports `<IconFoo />` without knowing or caring which source it came from.
- **FR-010b**: The override policy (FR-019) MUST specify (a) which icon categories stay brand-custom (the handoff-drawn set plus any future icon design explicitly ships), and (b) which categories come from the generic library. A reviewer MUST block a PR that re-draws a generic glyph that the library already provides, and MUST block a PR that swaps a brand icon for a library equivalent.
- **FR-011**: The frontend MUST ship the game-specific primitive `GridCell` with the handoff's state set (empty, hover, own, opponent, disabled) and the claim-pulse animation.
- **FR-012**: Screen-specific primitives (e.g., mode-card, section-header, summary-item, player-row, setting-row, stat-card, board-thumbnail) are intentionally NOT promoted into the shared primitive library. They stay co-located with the screen that consumes them (Phase 7 work), so the shared library does not bloat with one-off helpers.
- **FR-013**: Each shipped primitive MUST be a port of the handoff prototype's visual output, not a lift of the prototype's JSX structure. Behavior that later phases require and is not covered by the Phase 1 accessibility baseline (FR-013a) MAY be deferred with an in-code marker and a Spek entry rather than invented in Phase 1.
- **FR-013a**: Every Phase 1 primitive MUST meet this accessibility baseline on shipment:
  - **Color contrast**: the primitive's documented default surface meets WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text and non-text UI). Contrast is audited against the handoff token values; if the handoff's documented combination fails AA, the primitive is not shipped until the finding is raised with design.
  - **Reduced motion**: every animation consumed by the primitive (claim-pulse, cell-pulse idle, timer critical pulse, grid-drift, z-pulse, fade-up, and any custom primitive animation) is gated on `prefers-reduced-motion: no-preference`. When the user prefers reduced motion, the primitive collapses the animation to an instant state change that preserves the information (e.g., claimed cell still flips color, just without the pulse).
  - **Keyboard operability**: every interactive primitive (button, text input, form field, OTP field, slider, segmented-button, chip, modal/dialog, alert dismissal, avatar when interactive) is reachable by keyboard, operable by the expected keys (Enter/Space for activation, Esc to close a modal, arrow keys for OTP and slider), and presents a visible focus state via the handoff's focus-ring token.

**Animations & Global Interaction Tokens**

- **FR-014**: The frontend MUST register globally every animation the handoff prototype defines: claim-cell pulse, cell-pulse idle, timer critical pulse, grid-drift, z-pulse, fade-up on route transition. These are consumed by primitives by name — no primitive MAY redefine a keyframe that already exists.
- **FR-015**: The frontend MUST ship the handoff's custom range-input thumb styling (the yellow-glow thumb used for sliders) as a global style, so every slider — including future ones — inherits it without per-component restyling.

**Quality Gates**

- **FR-016**: The repository quality gates MUST block a pull request that introduces a hard-coded hex color or a raw font-family declaration in frontend source outside the token file. The failing gate MUST name the offending file and line.
- **FR-017**: The monorepo type-check MUST continue to pass with Phase 1 changes in place, in line with Phase 0's existing performance target, and MUST fail when a frontend module references a token name that does not exist in the token file.
- **FR-018**: Before Phase 1 is declared complete, a visual-diff pass MUST compare each rendered representative screen (a token/primitive showcase plus any implemented handoff views) against the prototype captured in Spekit. Divergences are either fixed, or documented in a follow-up with explicit approval.

**Override Policy (Enforced by Review + Lint)**

- **FR-019**: The project MUST publish a written override policy that specifies (a) when a new token is added (the value is brand-wide and will be reused), (b) when a local style exception is permissible (the value is one-off and justified in an adjacent comment), and (c) what reviewers block outright. The policy lives with the tokens in the repository and is mirrored into Spekit.

**Scope Boundaries**

- **FR-020**: Game screens (home, create, lobby, game, results), account screens (onboarding, login, signup, forgot, reset, profile), room CRUD, socket wiring, game logic, authentication backend, and database work are explicitly **out of scope** for Phase 1. Phase 1 ships the substrate; later phases assemble screens on top of it.
- **FR-021**: The prototype's state mechanism (direct `localStorage` reads, tweaks panel, dev-nav) is prototype-only and MUST NOT be ported. Phase 1 ports visuals; the production app uses the state patterns introduced in Phase 6.
- **FR-022**: A production end-to-end screen is NOT a Phase 1 deliverable. A token-and-primitive showcase view (renders each primitive in each of its states and each animation in play) is the visible Phase 1 exit artifact and is acceptable as the only rendered surface in Phase 1.
- **FR-022a**: The showcase view MUST ship as a **development-only route** at `/_showcase` in the frontend app. It is registered only when the app is built or served in development mode; production builds MUST tree-shake the route and every component reachable only from it out of the final bundle. End users of a production build MUST NOT be able to reach the showcase, and navigating to `/_showcase` in production MUST fall through to the app's normal not-found handling (no 500, no broken render). The gating mechanism is a build-time flag consulted by the router — not a runtime auth check.
- **FR-022b**: The showcase view MUST render the complete Phase 1 surface in one page (or one page per category, linked from a shared index): every token category as swatches with names and resolved values, every layout / ui / common / game primitive in each documented visual state, and a trigger for every global animation so reviewers can observe the motion live. It MUST also expose a one-click toggle to simulate `prefers-reduced-motion` locally (in addition to the real OS setting), so reviewers can verify the reduced-motion path without leaving the showcase.

**Spekit Documentation**

- **FR-023**: The "Zonite Dev Hub" Topic MUST contain a Spek titled "Zonite Design System — token sources and override policy" covering where tokens come from, the override policy, the enforcing quality gate, and pointers to the handoff bundle.
- **FR-024**: The same Topic MUST contain a Spek titled "Claude Design handoff bundle — what it is and how to update" covering how to refresh the bundle when design ships a new version and how to diff token deltas into the project token file.
- **FR-025**: The same Topic MUST contain a Spek titled "Zonite typography — Gilroy vs. Mulish fallback" recording the stand-in decision and the single-file swap when Gilroy is licensed.
- **FR-026**: The design-system Spek MUST attach screenshots of every handoff screen (onboarding, login, signup, forgot, reset, home, create, lobby, game, results, profile) for future visual-diff reference.
- **FR-027**: Subsequent design-system decisions (new tokens, revised override policy, inventory changes) MUST be recorded in the same Topic in the same PR that introduces the change.

### Key Entities _(include if feature involves data)_

- **Design Handoff Bundle**: The archived artifact delivered by the design team — handoff README, chat transcript, primary prototype file, token CSS file, brand assets, prototype components. Attributes: delivery date, SHA256 of the original tarball, set of files. Read-only in the repository; integrity verified on every PR by a CI-recomputed hash against the recorded SHA256.
- **Handoff Version Manifest**: A single repository file (e.g., `docs/design/HANDOFF_VERSION.md`) recording the delivery date and SHA256 of the currently-adopted Design Handoff Bundle. Updated in lockstep with any bundle-refresh PR.
- **Token**: A named, reusable styling value sourced from the handoff bundle. Attributes: category (brand / semantic / team / cell-state / gradient / radius / spacing / type / motion / breakpoint / blur), name, value, optional Zonite-specific alias. Relationships: many Primitives consume many Tokens; aliases reference a base Token rather than re-declare its value.
- **Token Source File**: The single authoritative file that declares every token the frontend is allowed to use. Attributes: location, import surface, ownership rules.
- **UI Primitive**: An adapted, handoff-styled component in the shared layout / ui / common / game libraries. Attributes: name, category (layout / ui / common / game), conceptual inputs (props at the design level, not code), visual states, consumed tokens, consumed animations. Relationships: consumes Tokens and Animations; consumed by later-phase screens.
- **Animation**: A named keyframe defined globally and consumed by primitives (cell-claim, cell-pulse, timer critical pulse, grid-drift, z-pulse, fade-up). Attributes: name, duration, easing, target property class.
- **Override Policy**: The written ruleset that governs when a new token is added, when a local exception is allowed, and what reviewers block. Attributes: rules, examples (acceptable and unacceptable), enforcement surface (reviewer + lint).
- **Spekit Topic Entry**: A named Spek in the "Zonite Dev Hub" Topic that documents a design-system decision. Attributes: title, body, attached screenshots, last-updated date.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A designer or brand reviewer identifies the rendered Zonite frontend as the handoff design at a glance, without being told. Verified at Phase 1 exit by one reviewer comparing the rendered showcase view against the prototype.
- **SC-002**: 100% of styling values applied in frontend source resolve to tokens from the single authoritative token file. A repository-wide scan at Phase 1 exit finds zero hard-coded hex colors and zero raw font-family strings in frontend source outside that file.
- **SC-003**: Flipping a single token value (e.g., the brand accent) propagates to every consumer with no per-component edit. Verified by a one-token spot-check at exit.
- **SC-004**: The shared primitive library exports the full Phase 1 set — layout shell and its parts, common components (player chip, countdown, icons), shared primitives (button, text input, field, OTP field, badge, modal/dialog, alert, avatar, slider, segmented-button, chip), and the game grid cell. Each primitive renders on-brand with no ad-hoc CSS at a representative call site. Verified on the showcase view.
- **SC-005**: A pull request that introduces a hard-coded hex color or raw font-family in frontend source (outside the token file) is blocked by the repository's automated checks in 100% of attempts, with a message naming the offending file and line. Verified at exit by creating one such PR and observing the block.
- **SC-006**: Every animation the handoff defines plays in the showcase: claim-cell pulse, cell-pulse idle, timer critical pulse, grid-drift, z-pulse, fade-up. Verified by triggering each interaction in the showcase and observing the expected motion.
- **SC-007**: The "Zonite Dev Hub" Spekit Topic contains the three Phase-1 Speks (token sources and override policy, handoff bundle management, typography stand-in), plus screenshots of every handoff screen attached to the design-system Spek. Verified by opening the Topic.
- **SC-008**: Phase 0's existing quality gates (monorepo lint, monorepo type-check) continue to pass on the Phase 1 branch. The gates still complete within the Phase 0 performance target on a typical development laptop. Phase 1 does not regress Phase 0.
- **SC-009**: Every shipped primitive passes the Phase 1 accessibility baseline (FR-013a). Verified at exit by: (a) an automated contrast audit over the showcase view showing zero WCAG AA failures on documented surfaces; (b) a manual keyboard walk-through of the showcase operating every interactive primitive without a mouse; (c) toggling the OS-level "reduce motion" setting (and the showcase's own reduced-motion toggle) and confirming every animation collapses to an instant state change while still conveying its information.
- **SC-010**: In a production build of the frontend, navigating to `/_showcase` does not reach the showcase view (falls through to normal not-found handling), and the production bundle's size does not include the showcase or its dedicated token-swatch/primitive-catalog code. Verified by a size/source-map check on a prod build at Phase 1 exit.
- **SC-011**: A production build of the frontend, loaded on a test network with all third-party font CDNs blocked, renders the landing view with the correct Mulish and display-font faces — no fallback to a system font. Verified at Phase 1 exit with the browser's devtools Network panel showing zero requests to `fonts.googleapis.com` or `fonts.gstatic.com`.
- **SC-012**: The icon export surface ships the handoff's brand icons and exactly one generic icon library. A repository-wide scan at Phase 1 exit finds no duplicate generic-library dependencies and no ad-hoc inline SVGs outside the icon export (brand icons excepted). The override policy in Spekit names which icons come from which source.
- **SC-013**: The handoff version manifest (`HANDOFF_VERSION.md`) records the delivery date and SHA256 of the adopted bundle. A CI check recomputes the hash on every PR and matches the recorded value; a PR that mutates the bundle without also updating the recorded SHA is blocked in 100% of attempts. Verified at Phase 1 exit by creating one such PR and observing the block.

## Assumptions

- Phase 0 (Foundation) has already shipped: the monorepo exists with the frontend, backend, and shared packages; the frontend boots via the documented local-dev command; the repo-wide lint and type-check commands exist and pass. Phase 1 extends these gates rather than creating them.
- The Claude Design handoff bundle is the authoritative visual and UX source, committed into the repository under a documented reference path. It supersedes a free-form audit of the Yalgamers frontend. Any later handoff version is handled via the documented refresh process, not a one-time audit.
- Board geometry is always a square; a single size dimension governs both edges. This is a product decision locked in with the handoff and is reflected in the prototype's configuration screens.
- Token categories delivered by the handoff (brand, semantic, team/cell-state, gradients, radii, 4-point spacing, type stack and scale, motion, breakpoints, blur) are the complete Phase 1 surface. New categories invented after the handoff require a new Spek and the override-policy process.
- The primary typeface (Gilroy) is proprietary and not yet licensed; the handoff ships Mulish as the stand-in. Phase 1 adopts the stand-in. When Gilroy is licensed, the swap is a single-location change in the token file.
- The handoff prototype's state mechanism (direct `localStorage` reads, tweaks panel, dev nav) is prototype-only and explicitly excluded from the Phase 1 port. The production stack's state patterns are introduced in Phase 6 and are not a Phase 1 concern.
- Motion systems outside the handoff's own animations (e.g., additional marketing animations, third-party motion libraries) are out of scope for Phase 1.
- Test coverage for primitives is out of scope for Phase 1, aligned with Phase 0's decision to defer test tooling. Phase 1 verifies visually via the showcase view plus the Phase 0 lint and type-check gates. Tests land in the first later phase that writes one.
- Game screens, account screens, game logic, room CRUD, socket wiring, and backend work are explicitly out of scope for Phase 1.
