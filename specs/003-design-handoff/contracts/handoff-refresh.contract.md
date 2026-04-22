# Contract: Handoff Bundle Refresh Workflow

**Artifacts**: `docs/design/zonite-game/`, `docs/design/HANDOFF_VERSION.md`, `scripts/verify-handoff.mjs`, CI workflow step
**Role**: Defines how the design handoff bundle enters the repo, how its integrity is proven on every PR, and how the team refreshes it when design ships a new version.
**Owning phase**: 003-design-handoff

## Purpose

Makes "what version of the design are we on?" answerable mechanically. Without this contract, silent bundle drift (an engineer edits `colors_and_type.css` in the bundle tree directly, or the bundle gets out-of-sync with what design last reviewed) is undetectable until something visibly breaks. The contract gives CI a single hash to enforce.

## Artifact: `docs/design/HANDOFF_VERSION.md`

Structure (filled in at Phase 1 adoption and on every refresh):

```markdown
# Zonite Design Handoff — Version Manifest

adopted_at: 2026-04-20
bundle_source: Claude Design (claude.ai/design) — export 53AOnvUnv452coICdMiQ_w
expected_sha256: <64 lowercase hex characters>

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

The manifest file has exactly one of each field. Parsers can rely on regex `/^expected_sha256:\s+([0-9a-f]{64})$/m`.

## Artifact: `scripts/verify-handoff.mjs`

A zero-dependency Node ESM script. Runs in both verify mode (default) and record mode (`--record`).

### Verify mode

```
$ node scripts/verify-handoff.mjs
✓ docs/design/zonite-game matches expected_sha256=<hex>
```

Algorithm:

1. Read `docs/design/HANDOFF_VERSION.md` and extract `expected_sha256`. If missing / malformed, exit non-zero with code 2 and message "HANDOFF_VERSION.md is missing or unparseable".
2. Walk `docs/design/zonite-game/` recursively. Collect every file (not directory).
3. Sort the file list by relative path, lexicographic ASCII order.
4. Initialize a `sha256` hash.
5. For each file, in sorted order:
   - Update the hash with `<relative-path>` (UTF-8 bytes).
   - Update the hash with a single null byte (`0x00`).
   - Update the hash with the file's raw byte contents.
   - Update the hash with a single null byte (`0x00`).
6. Finalize the hash to a lowercase hex digest.
7. Compare to `expected_sha256`. If they match, exit 0. If not, exit non-zero with code 3 and a summary:
   ```
   ✗ Bundle hash mismatch
     expected: <hex from manifest>
     actual:   <hex computed>
     Refresh the manifest with `node scripts/verify-handoff.mjs --record`
     or restore the bundle to the committed version.
   ```

### Record mode (`--record`)

Same as verify, except step 7 **rewrites** the `expected_sha256` line in `HANDOFF_VERSION.md` with the newly-computed digest, and also updates `adopted_at` to today's date in ISO format. Exits 0 and prints:

```
✓ Recorded expected_sha256=<hex>, adopted_at=<YYYY-MM-DD>
```

### Exit codes

- 0 — match (verify), or recorded (record)
- 1 — unexpected error (I/O, permission)
- 2 — manifest missing or unparseable
- 3 — hash mismatch in verify mode

### Determinism guarantees

- **Cross-platform**: the script reads files as raw bytes via `fs.readFileSync` with no encoding argument. No line-ending normalization; the repo's `.gitattributes` is expected to preserve the bundle's original line endings (the committed bundle's files are used as-is, never checked out with CRLF conversion).
- **Ordering**: lexicographic sort on the relative path string. Identical on macOS, Linux, WSL.
- **Null-byte separator**: prevents a theoretical path-content boundary collision.

## CI integration

Add a step to the existing CI workflow (`.github/workflows/ci.yml`) that runs **before** the lint / type-check steps (fail fast):

```yaml
- name: Verify design handoff bundle integrity
  run: node scripts/verify-handoff.mjs
```

A PR that changes any file under `docs/design/zonite-game/` without updating `HANDOFF_VERSION.md`'s `expected_sha256` in the same commit fails this step.

## Adoption procedure (Phase 1 — one-time)

1. Copy the already-extracted bundle (from the Claude Design fetch during PLAN.md drafting) into `docs/design/zonite-game/`.
2. Create `docs/design/HANDOFF_VERSION.md` with `adopted_at: 2026-04-20` and `bundle_source: Claude Design (claude.ai/design) — export 53AOnvUnv452coICdMiQ_w`.
3. Run `node scripts/verify-handoff.mjs --record` — this fills in `expected_sha256`.
4. Commit the bundle tree + the manifest + the script + the CI workflow step in one commit.

## Refresh procedure (later phases / ongoing)

The manifest's "Refresh workflow" section (quoted above) is the canonical procedure. It is reproduced in the Spekit Spek "Claude Design handoff bundle — what it is and how to update" (FR-024) so engineers hit the workflow whether they start from the repo or from Spekit.

## Guarantees to downstream phases

- **Identity**: any file under `docs/design/zonite-game/` can be cited by path and will be the same bytes as the design team delivered (modulo explicit refresh).
- **Detectability**: any mutation of the bundle — including accidental edits, merge-conflict corruptions, and intentional tampering — fails CI.
- **Reversibility**: a bad refresh is reverted by restoring the previous `expected_sha256` + bundle from git history. No special tooling beyond git.
- **No performance cost to end users**: the bundle lives under `docs/`, not `apps/frontend/public/` or `apps/frontend/src/`. It is not shipped in any production bundle; Vite does not see it.

## Non-goals

- **Semver on the bundle**: not adopted. The bundle's identity is the SHA + adoption date, not a version number. If design wants to communicate a semantic version, that's layered on top in the Spek; the manifest remains SHA-anchored.
- **Partial refreshes** (refresh only `colors_and_type.css` without the rest of the bundle): not supported. The bundle is atomic: refresh the whole tree or don't.
- **Runtime hash verification**: the hash is a design-time / CI-time integrity check. The running app doesn't consult it.
