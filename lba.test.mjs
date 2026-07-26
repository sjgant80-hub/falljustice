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

// ── mutation-designed tests: pin the exact boundaries/branches the gate flips ──

test('smallClaimsBand boundaries are inclusive at 0, 10000 and 25000', () => {
  // n <= 0  (not n < 0): zero is "unknown", not small-claims
  assert.equal(smallClaimsBand(0).band, 'unknown');
  // n <= 10000 (not < 10000): exactly £10,000 stays in the small claims track
  assert.equal(smallClaimsBand(10000).band, 'small-claims');
  assert.equal(smallClaimsBand(10001).band, 'fast-track');
  // n <= 25000 (not < 25000): exactly £25,000 is still fast-track
  assert.equal(smallClaimsBand(25000).band, 'fast-track');
  assert.equal(smallClaimsBand(25001).band, 'multi-track');
});

test('a numeric deadline date is used verbatim; a wordy one falls back to N days', () => {
  // deadlineDate with a digit -> used as-is (pins `=== 'string' && /\d/`, and deadline `||`)
  const withDate = assembleLBA({ ...BASE, claimType: 'goods_faulty', deadlineDate: '1 January 2027' });
  assert.match(withDate.letter, /respond within 1 January 2027\./);
  // deadlineDate with NO digit -> the `&&` guard rejects it and we fall back to "14 days"
  const wordy = assembleLBA({ ...BASE, claimType: 'goods_faulty', deadlineDate: 'as soon as possible' });
  assert.match(wordy.letter, /respond within 14 days\./);
  assert.ok(!wordy.letter.includes('as soon as possible'));
});

test('esc maps < to ‹ and > to › (not swapped) and never drops the content', () => {
  const r = assembleLBA({ ...BASE, claimType: 'contract_breach', obligation: 'you would deliver', faultDesc: 'the gap was < 2mm and unacceptable' });
  assert.ok(r.ok);
  // == null guard: content is preserved, not blanked
  assert.match(r.letter, /the gap was ‹ 2mm and unacceptable/);
  // === '<' mapping: a lone '<' becomes '‹', never '›'
  assert.ok(!r.letter.includes('›'));
});

test('header and signature use the supplied names, addresses and date verbatim', () => {
  const r = assembleLBA({ ...BASE, claimType: 'goods_faulty' });
  assert.ok(r.letter.includes('15 March 2026'));                     // dateOfIssue ||
  assert.ok(r.letter.includes('1 High St, Anytown, AN1 1AA'));       // yourAddress ||
  assert.ok(r.letter.includes('MegaCorp Ltd'));                      // theirName ||
  assert.ok(r.letter.includes('99 Corporate Rd, London, EC1 1AA'));  // theirAddress ||
  // yourName appears in BOTH header and signature — pin both occurrences
  assert.equal((r.letter.match(/Jane Smith/g) || []).length, 2);
});

test('goods letter names the actual item and requested remedy, not the defaults', () => {
  const r = assembleLBA({ ...BASE, claimType: 'goods_faulty', item: 'laptop', faultDesc: 'it overheats', remedy: 'a price reduction' });
  assert.match(r.letter, /The laptop supplied/);              // item ||
  assert.match(r.letter, /entitled to a price reduction and/);// remedy || (entitlement)
  assert.match(r.letter, /require a price reduction of/);     // remedy || (requirement)
  assert.match(r.letter, /If I do not receive a price reduction/); // remedy || (action)
});

test('service letter names the actual service and remedy', () => {
  const r = assembleLBA({ ...BASE, claimType: 'service_poor', item: 'boiler service', remedy: 'a refund', faultDesc: 'left it leaking' });
  assert.match(r.letter, /The boiler service/);   // item ||
  assert.match(r.letter, /I require a refund of/); // remedy ||
});

test('contract letter states the actual obligation and breach', () => {
  const r = assembleLBA({ ...BASE, claimType: 'contract_breach', obligation: 'you would install the fence by 1 May', faultDesc: 'no work was done' });
  assert.match(r.letter, /contract under which you would install the fence by 1 May/); // obligation ||
  assert.match(r.letter, /in breach because no work was done/);                        // faultDesc ||
});

test('distance-cancel letter uses the supplied cancellation date', () => {
  const r = assembleLBA({ ...BASE, claimType: 'distance_cancel', cancelDate: '3 April 2026' });
  assert.match(r.letter, /I cancelled on 3 April 2026/); // cancelDate ||
});

test('data-breach letter states the actual misuse and required remedy', () => {
  const r = assembleLBA({ ...BASE, claimType: 'data_breach', faultDesc: 'you sold my email to advertisers', remedy: 'erase all my records', amount: 0 });
  assert.match(r.letter, /in that you sold my email to advertisers/); // faultDesc || (in demand, not just THE FACTS)
  assert.match(r.letter, /require you to erase all my records/);      // remedy ||
});

test('with no narrative override, THE FACTS uses the supplied event date and fault description', () => {
  const r = assembleLBA({ ...BASE, claimType: 'goods_faulty', eventDate: '2 February 2026', faultDesc: 'the screen cracked on first use' });
  assert.match(r.letter, /On or about 2 February 2026, the screen cracked on first use\./); // eventDate || and faultDesc ||
});

test('a zero or missing amount renders as the [amount] placeholder, not £0.00', () => {
  const r = assembleLBA({ ...BASE, claimType: 'goods_faulty', amount: 0, item: 'phone', remedy: 'a refund' });
  assert.match(r.letter, /of \[amount\]\./); // money(): n === 0 -> placeholder
  assert.ok(!r.letter.includes('£0.00'));
});
