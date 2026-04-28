# Zonite Design Handoff — Version Manifest

adopted_at: 2026-04-21
bundle_source: Claude Design (claude.ai/design) — export 53AOnvUnv452coICdMiQ_w
expected_sha256: 080efe2e60db8d411cf15cd68d2726ef937791b74897342c7bee30d05bf9e34e

## Refresh workflow

When the design team publishes a new bundle:

1. Extract the new tarball over `docs/design/zonite-game/`, replacing every file.
2. Run `node scripts/verify-handoff.mjs --record` to update `expected_sha256` above.
3. Diff the new `colors_and_type.css` into `apps/frontend/src/styles/tokens.css` — preserve the self-hosted `@font-face` rewire from Phase 1.
4. Diff prototype components into the corresponding primitives if design changed them.
5. Update `tokens.d.ts` if the token set changed.
6. Re-run the showcase + axe-core pass; fix any new failures.
7. Open one PR that updates the bundle, the manifest, the tokens, any affected primitives, and any affected Speks.
