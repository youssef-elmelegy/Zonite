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
