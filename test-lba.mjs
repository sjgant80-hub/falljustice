#!/usr/bin/env node
// Real tests for the Letter Before Action engine. The load-bearing ones: the correct MODERN statute
// is cited for each claim type, and the pseudo-law guardrail actually refuses sovereign-citizen input.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleLBA, detectPseudoLaw, smallClaimsBand, CLAIM_TYPES, SCOPE_NOTICE } from './lba.mjs';

const BASE = {
  yourName: 'Jane Smith', yourAddress: '1 High St, Anytown, AN1 1AA', yourEmail: 'jane@example.com',
  theirName: 'MegaCorp Ltd', theirAddress: '99 Corporate Rd, London, EC1 1AA',
  amount: 450, dateOfIssue: '15 March 2026',
};

test('every claim type carries a verified, non-empty statutory basis', () => {
  for (const [key, t] of Object.entries(CLAIM_TYPES)) {
    assert.ok(Array.isArray(t.basis) && t.basis.length > 0, `${key} has statutory basis`);
    assert.ok(t.label && t.protocol, `${key} has label + protocol`);
    assert.equal(typeof t.demand, 'function', `${key} has a demand builder`);
  }
});

test('faulty goods letter cites the Consumer Rights Act 2015 sections', () => {
  const r = assembleLBA({ ...BASE, claimType: 'goods_faulty', item: 'laptop', faultDesc: 'it overheats and shuts down', remedy: 'a full refund' });
  assert.ok(r.ok);
  assert.match(r.letter, /Consumer Rights Act 2015, s\.9/);
  assert.match(r.letter, /Consumer Rights Act 2015, s\.24/);
  assert.match(r.letter, /LETTER BEFORE ACTION/);
  assert.match(r.letter, /£450\.00/);
  assert.equal(r.meta.claimType, 'goods_faulty');
  assert.ok(r.meta.statutesCited >= 3);
});

test('poor service letter cites CRA 2015 s.49 (reasonable care and skill)', () => {
  const r = assembleLBA({ ...BASE, claimType: 'service_poor', item: 'kitchen fitting', faultDesc: 'the units were fitted crooked' });
  assert.ok(r.ok);
  assert.match(r.letter, /s\.49/);
  assert.match(r.letter, /reasonable care and skill/);
});

test('distance purchase letter cites the Consumer Contracts Regulations 2013', () => {
  const r = assembleLBA({ ...BASE, claimType: 'distance_cancel', cancelDate: '10 March 2026' });
  assert.ok(r.ok);
  assert.match(r.letter, /Consumer Contracts.*Regulations 2013/);
  assert.match(r.letter, /14-day right to cancel/);
});

test('data-misuse letter cites UK GDPR + DPA 2018 and points to the ICO', () => {
  const r = assembleLBA({ ...BASE, claimType: 'data_breach', faultDesc: 'you shared my email with third parties without consent', remedy: 'stop the processing and confirm erasure', amount: 0 });
  assert.ok(r.ok);
  assert.match(r.letter, /UK GDPR/);
  assert.match(r.letter, /Data Protection Act 2018/);
  assert.match(r.letter, /Information Commissioner/);
});

test('every letter carries the honest-scope notice and a response deadline', () => {
  const r = assembleLBA({ ...BASE, claimType: 'contract_breach', obligation: 'you agreed to deliver by 1 March', faultDesc: 'nothing was delivered' });
  assert.ok(r.ok);
  assert.ok(r.letter.includes(SCOPE_NOTICE));
  assert.match(r.letter, /not legal advice/);
  assert.match(r.letter, /respond within 14 days/i);
  assert.match(r.letter, /costs/);
});

test('GUARDRAIL: sovereign-citizen / Freeman input is refused, not dressed up', () => {
  const attempts = [
    'I invoke Article 61 of Magna Carta and my right to lawful rebellion',
    'As a freeman-on-the-land I do not consent to any statute',
    'This is my strawman and under the UCC I reserve all rights',
    'I am not a legal person and cestui que trust applies',
  ];
  for (const bad of attempts) {
    const r = assembleLBA({ ...BASE, claimType: 'goods_faulty', faultDesc: bad });
    assert.equal(r.ok, false, `refused: ${bad.slice(0, 30)}`);
    assert.match(r.error, /pseudo-legal/);
    assert.ok(r.guidance && /reject/i.test(r.guidance));
  }
});

test('detectPseudoLaw passes ordinary grievances through cleanly', () => {
  const ok = detectPseudoLaw('The washing machine leaked and flooded my kitchen; the retailer refuses a refund.');
  assert.equal(ok.flagged, false);
  assert.equal(ok.guidance, null);
});

test('unknown claim type is rejected with the list of known types', () => {
  const r = assembleLBA({ ...BASE, claimType: 'not_a_real_type' });
  assert.equal(r.ok, false);
  assert.ok(Array.isArray(r.known) && r.known.includes('goods_faulty'));
});

test('smallClaimsBand maps amounts to the right County Court track', () => {
  assert.equal(smallClaimsBand(450).band, 'small-claims');
  assert.equal(smallClaimsBand(9999).band, 'small-claims');
  assert.equal(smallClaimsBand(15000).band, 'fast-track');
  assert.equal(smallClaimsBand(50000).band, 'multi-track');
  assert.match(smallClaimsBand(450).note, /Money Claim Online/);
});

test('free-text is markup-stripped so a pasted grievance cannot inject into the page', () => {
  const r = assembleLBA({ ...BASE, claimType: 'goods_faulty', faultDesc: 'the <script>alert(1)</script> item broke' });
  assert.ok(r.ok);
  assert.ok(!r.letter.includes('<script>'), 'angle brackets are neutralised');
});
