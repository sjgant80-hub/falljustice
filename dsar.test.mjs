#!/usr/bin/env node
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDSAR, deadlineTracker, escalation, ARTICLE_15_ITEMS } from './dsar.mjs';
import { SCOPE_NOTICE } from './lba.mjs';

const BASE = {
  yourName: 'Jane Smith', yourAddress: '1 High St, AN1 1AA', yourEmail: 'jane@example.com',
  controllerName: 'MegaCorp Ltd', controllerAddress: 'DPO, 99 Corporate Rd',
  identifiers: 'account 12345, jane@example.com', dateOfIssue: '15 March 2026',
};

test('buildDSAR cites UK GDPR Article 15 and the DPA 2018', () => {
  const r = buildDSAR(BASE);
  assert.ok(r.ok);
  assert.match(r.letter, /UK GDPR,? Article 15/);
  assert.match(r.letter, /Data Protection Act 2018/);
  assert.match(r.letter, /DATA SUBJECT ACCESS REQUEST/);
});

test('the letter requests all Article 15(1) supplementary items + the copy', () => {
  const r = buildDSAR(BASE);
  assert.ok(ARTICLE_15_ITEMS.length >= 7);
  assert.match(r.letter, /a copy of all personal data/);
  assert.match(r.letter, /automated decision-making/);
  assert.match(r.letter, /retention period/);
  assert.equal(r.meta.itemsRequested, ARTICLE_15_ITEMS.length);
});

test('states the one-month statutory deadline and the free-first-copy rule', () => {
  const r = buildDSAR(BASE);
  assert.match(r.letter, /within one month/);
  assert.match(r.letter, /free of charge/);
  assert.match(r.letter, /two further months/);
});

test('points to the ICO and the s.167 court route if ignored', () => {
  const r = buildDSAR(BASE);
  assert.match(r.letter, /Information Commissioner/);
  assert.match(r.letter, /section 167/);
});

test('carries the honest-scope notice', () => {
  const r = buildDSAR(BASE);
  assert.ok(r.letter.includes(SCOPE_NOTICE));
});

test('GUARDRAIL: sovereign-citizen content is refused here too', () => {
  const r = buildDSAR({ ...BASE, specificData: 'I am a freeman-on-the-land and do not consent to statute' });
  assert.equal(r.ok, false);
  assert.match(r.error, /pseudo-legal/);
});

test('markup in free-text is neutralised', () => {
  const r = buildDSAR({ ...BASE, specificData: 'my <script>alert(1)</script> records' });
  assert.ok(r.ok);
  assert.ok(!r.letter.includes('<script>'));
});

test('deadlineTracker computes one calendar month from receipt', () => {
  const t = deadlineTracker('2026-03-15');
  assert.ok(t.ok);
  assert.equal(t.dueDate, '2026-04-15');
  assert.equal(t.extendedDueDate, '2026-06-15');
});

test('deadlineTracker clamps for short months (31 Jan -> 28 Feb)', () => {
  const t = deadlineTracker('2026-01-31');
  assert.equal(t.dueDate, '2026-02-28');
});

test('deadlineTracker status reflects the injected today', () => {
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-03-20' }).status, 'on-track');
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-14' }).status, 'due-soon');
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-20' }).status, 'overdue');
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-20' }).daysRemaining < 0, true);
});

test('extended flag targets the three-month date', () => {
  const t = deadlineTracker('2026-03-15', { extended: true, today: '2026-05-01' });
  assert.equal(t.status, 'on-track', 'still within the 3-month extension');
});

test('escalation ladder only appears when overdue, and points to the ICO', () => {
  assert.equal(escalation('on-track'), null);
  const steps = escalation('overdue');
  assert.ok(Array.isArray(steps) && steps.length === 3);
  assert.match(steps.join(' '), /ico\.org\.uk/);
  assert.match(steps.join(' '), /section 167/);
});

test('a bad received date is rejected', () => {
  assert.equal(deadlineTracker('not-a-date').ok, false);
});

// ── mutation-designed tests: pin the exact boundaries/branches the gate flips ──

test('deadlineTracker status boundaries: 0 days is due-soon (not overdue), 3 days is due-soon', () => {
  // daysRemaining < 0 (not <= 0): exactly on the due date is still "due-soon", not "overdue"
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-15' }).daysRemaining, 0);
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-15' }).status, 'due-soon');
  // daysRemaining <= 3 (not < 3): exactly 3 days out is still "due-soon", not "on-track"
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-12' }).daysRemaining, 3);
  assert.equal(deadlineTracker('2026-03-15', { today: '2026-04-12' }).status, 'due-soon');
});

test('the requested response format honours "by post" exactly', () => {
  const post = buildDSAR({ ...BASE, format: 'by post' });
  assert.match(post.letter, /Please provide the response by post\./); // format === 'by post'
  const elec = buildDSAR({ ...BASE, format: 'electronically' });
  assert.match(elec.letter, /Please provide the response electronically/); // default branch
});

test('esc maps < to ‹ and > to › (not swapped) and never drops the content', () => {
  const r = buildDSAR({ ...BASE, specificData: 'files where value ‹placeholder› was < 100' });
  assert.ok(r.ok);
  // == null guard preserves the text; === '<' mapping turns a lone '<' into '‹'
  assert.match(r.letter, /interested in: files where value ‹placeholder› was ‹ 100/);
});

test('the header, identity line and signature use the supplied details verbatim', () => {
  const r = buildDSAR(BASE);
  assert.ok(r.letter.includes('15 March 2026'));                    // dateOfIssue ||
  assert.ok(r.letter.includes('1 High St, AN1 1AA'));               // yourAddress ||
  // yourEmail || null: the email sits on its own header line right after the address
  assert.match(r.letter, /1 High St, AN1 1AA\njane@example\.com/);
  assert.ok(r.letter.includes('MegaCorp Ltd'));                     // controllerName ||
  assert.ok(r.letter.includes('DPO, 99 Corporate Rd'));             // controllerAddress ||
  assert.match(r.letter, /identify my records by: account 12345, jane@example\.com/); // identifiers ||
  // yourName appears in BOTH header and signature — pin both occurrences
  assert.equal((r.letter.match(/Jane Smith/g) || []).length, 2);
});
