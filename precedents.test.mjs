#!/usr/bin/env node
// The load-bearing test for the precedent corpus: EVERY entry must be a real, sourced citation. This
// is the structural anti-hallucination gate — a case with no verifiable source cannot pass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACCESS_TO_JUSTICE, STATUTORY_WEAVES, magnaCartaReality, allPrecedents } from './precedents.mjs';

test('every access-to-justice case carries name, neutral citation, court, outcome and a source URL', () => {
  assert.ok(ACCESS_TO_JUSTICE.length >= 3);
  for (const c of ACCESS_TO_JUSTICE) {
    assert.ok(c.name && c.citation && c.court, `${c.id} identified`);
    assert.match(c.citation, /\[\d{4}\]|\(\d{4}\)|\d{4}/, `${c.id} has a year/citation`);
    assert.match(c.outcome, /WON/, `${c.id} is a won case`);
    assert.match(c.source, /^https?:\/\//, `${c.id} has a verifiable source URL`);
    assert.ok(c.principle && c.whenToUse, `${c.id} explains the principle + when to use`);
  }
});

test('UNISON is present as the landmark, correctly cited', () => {
  const u = ACCESS_TO_JUSTICE.find(c => c.id === 'unison-2017');
  assert.ok(u);
  assert.equal(u.citation, '[2017] UKSC 51');
  assert.match(u.principle, /Magna Carta 1215/);
  assert.match(u.principle, /chapter 29 of the\s*1297/);
});

test('every statutory weave lists real stacked rights and a source', () => {
  assert.ok(STATUTORY_WEAVES.length >= 2);
  for (const w of STATUTORY_WEAVES) {
    assert.ok(Array.isArray(w.stack) && w.stack.length >= 2, `${w.id} stacks >=2 rights`);
    assert.match(w.source, /^https?:\/\//, `${w.id} sourced`);
    assert.ok(w.whyItWorks, `${w.id} explains why`);
  }
});

test('magnaCartaReality tells the truth: winning use vs losing use', () => {
  const r = magnaCartaReality();
  assert.ok(r.inForce.some(c => /29/.test(c)), 'names clause 29 as the surviving due-process clause');
  assert.match(r.theWinningUse, /UNISON/);
  assert.match(r.theLosingUse, /clause 61|sovereign|Freeman/i);
  assert.match(r.source, /^https?:\/\//);
});

test('allPrecedents flattens with a tier and never drops the source', () => {
  const all = allPrecedents();
  assert.ok(all.length >= 3);
  for (const c of all) {
    assert.equal(c.tier, 'access-to-justice');
    assert.match(c.source, /^https?:\/\//, 'no citation without a source');
  }
});
