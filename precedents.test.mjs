#!/usr/bin/env node
// The load-bearing test for the precedent corpus: EVERY entry must be a real, sourced citation. This
// is the structural anti-hallucination gate — a case with no verifiable source cannot pass.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACCESS_TO_JUSTICE, CONSUMER_CASES, LOSING_USES, STATUTORY_WEAVES, magnaCartaReality, allPrecedents } from './precedents.mjs';

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

test('magnaCartaReality tells the truth: 1297 instrument, winning vs losing use', () => {
  const r = magnaCartaReality();
  assert.match(r.instrument, /1297/, 'cites the 1297 statute, not 1215');
  assert.match(r.instrument, /NOT the 1215/, 'explicitly warns off the annulled 1215 charter');
  assert.ok(r.inForce.some(c => /XXIX/.test(c)), 'names chapter XXIX as the surviving due-process clause');
  assert.match(r.theWinningUse, /Raymond v Honey|UNISON/);
  assert.match(r.theLosingUse, /clause 61|sovereign|Freeman/i);
  assert.match(r.theLosingUse, /Samede|Kofa|ABQB/, 'backs the warning with a real losing case');
  assert.match(r.source, /^https?:\/\//);
});

test('consumer cases: Salt v Stratstone is a real sourced WIN; ParkingEye is honest doctrine', () => {
  assert.ok(CONSUMER_CASES.length >= 2);
  const salt = CONSUMER_CASES.find(c => c.id === 'salt-stratstone-2015');
  assert.equal(salt.citation, '[2015] EWCA Civ 745');
  assert.match(salt.outcome, /WON/);
  const pe = CONSUMER_CASES.find(c => c.id === 'parkingeye-beavis-2015');
  assert.match(pe.outcome, /LOST/, 'ParkingEye outcome stated honestly — Beavis lost');
  for (const c of CONSUMER_CASES) assert.match(c.source, /^https?:\/\//, `${c.id} sourced`);
});

test('losing-uses: every pseudo-law warning names a REAL, sourced case', () => {
  assert.ok(LOSING_USES.length >= 3);
  const ids = LOSING_USES.map(c => c.id);
  assert.ok(ids.includes('samede-2012') && ids.includes('kofa-2024') && ids.includes('avi-mhvb-2020'));
  for (const c of LOSING_USES) {
    assert.match(c.citation, /\[\d{4}\]|\d{4} ABQB/, `${c.id} has a real citation`);
    assert.match(c.source, /^https?:\/\//, `${c.id} sourced`);
  }
});

test('allPrecedents flattens all three tiers and never drops the source', () => {
  const all = allPrecedents();
  assert.ok(all.length >= 7);
  const tiers = new Set(all.map(c => c.tier));
  assert.ok(tiers.has('access-to-justice') && tiers.has('consumer') && tiers.has('losing-use'));
  for (const c of all) assert.match(c.source, /^https?:\/\//, 'no citation without a source');
});
