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
