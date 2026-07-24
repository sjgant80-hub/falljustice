#!/usr/bin/env node
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, makeExhibit, buildBundle, bundleIndex, EvidenceVault } from './evidence.mjs';
import { Vault, memoryAdapter } from './vault.mjs';

const SEED = 'correct horse battery staple';

test('sha256Hex is a real, stable 64-char hex digest', async () => {
  const h = await sha256Hex('hello');
  assert.equal(h, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  assert.equal(await sha256Hex('hello'), h, 'deterministic');
  assert.notEqual(await sha256Hex('hello '), h, 'sensitive to input');
});

test('makeExhibit hashes content and normalises a UK date', async () => {
  const ex = await makeExhibit({ when: '15/03/2026', title: 'Refund refusal email', content: 'We will not refund you.', mime: 'text/plain' });
  assert.equal(ex.when, '2026-03-15');
  assert.equal(ex.hash.length, 64);
  assert.equal(ex.title, 'Refund refusal email');
});

test('buildBundle orders chronologically and numbers E1..En without mutating input', async () => {
  const a = await makeExhibit({ when: '2026-03-16', title: 'B', content: 'b' });
  const b = await makeExhibit({ when: '2026-03-15', title: 'A', content: 'a' });
  const input = [a, b];
  const bundle = buildBundle(input);
  assert.equal(bundle[0].exhibitNo, 'E1');
  assert.equal(bundle[0].title, 'A', 'earliest date first');
  assert.equal(bundle[1].exhibitNo, 'E2');
  assert.equal(input[0].exhibitNo, undefined, 'input not mutated');
});

test('bundleIndex renders a court-style exhibit index', async () => {
  const bundle = buildBundle([await makeExhibit({ when: '2026-03-15', title: 'Receipt', content: 'x' })]);
  const idx = bundleIndex(bundle);
  assert.match(idx, /EXHIBIT INDEX/);
  assert.match(idx, /E1\t2026-03-15\tReceipt\tsha256:/);
});

test('EvidenceVault stores exhibits encrypted and returns a bundle', async () => {
  const adapter = memoryAdapter();
  const vault = await new Vault({ adapter }).open(SEED);
  const ev = new EvidenceVault(vault);
  await ev.add({ when: '2026-03-16', title: 'Chaser', content: 'Please refund. Confidential-Ref-XYZ' });
  await ev.add({ when: '2026-03-15', title: 'Invoice', content: 'Invoice 4400' });

  const bundle = await ev.bundle();
  assert.equal(bundle.length, 2);
  assert.equal(bundle[0].title, 'Invoice', 'chronological');
  assert.equal(bundle[0].exhibitNo, 'E1');

  // confidentiality: the raw stored bytes must not leak the exhibit content
  const rawKey = (await adapter.keys()).find(k => k.startsWith('exhibit-'));
  const stored = JSON.stringify(await adapter.get(rawKey));
  assert.ok(!stored.includes('Confidential-Ref-XYZ') && !stored.includes('Invoice 4400'), 'exhibits are ciphertext at rest');
});

test('identical content dedupes by content-address', async () => {
  const vault = await new Vault().open(SEED);
  const ev = new EvidenceVault(vault);
  await ev.add({ when: '2026-03-15', title: 'Same', content: 'identical bytes' });
  await ev.add({ when: '2026-03-16', title: 'Same again', content: 'identical bytes' });
  assert.equal((await ev.all()).length, 1, 'same content → same key → one exhibit');
});

test('remove erases an exhibit by hash', async () => {
  const vault = await new Vault().open(SEED);
  const ev = new EvidenceVault(vault);
  const ex = await ev.add({ when: '2026-03-15', title: 'Delete me', content: 'gone' });
  await ev.remove(ex.hash);
  assert.equal((await ev.all()).length, 0);
});

test('EvidenceVault refuses to construct without an opened vault', () => {
  assert.throws(() => new EvidenceVault(null), /requires an opened/);
});
