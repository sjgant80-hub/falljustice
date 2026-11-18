// cite.test.mjs — the citation checker: it vouches only for the hand-verified table, in every way people write a
// citation, and never for anything else.
import test from 'node:test';
import assert from 'node:assert/strict';
import C, { CITE_SCOPE, ALIASES, buildTable, TABLE, readCitations, vouch, checkLetter } from './cite.mjs';
import { CLAIM_TYPES, SCOPE_NOTICE } from './lba.mjs';
import { allPrecedents } from './precedents.mjs';

const keys = (t) => readCitations(t).map((c) => c.key);

test('the table is built from the hand-authored strings, and holds every citation they make', () => {
  assert.equal(TABLE.units.size, 11);
  assert.deepEqual([...TABLE.instruments.keys()], ['consumer rights act 2015', 'consumer contracts (information, cancellation and additional charges) regulations 2013', 'uk gdpr', 'data protection act 2018', 'consumer protection from unfair trading regulations 2008', 'misrepresentation act 1967']);
  assert.equal(TABLE.cases.size, allPrecedents().length);
  // every statutory basis line that names a provision is vouched in its own words
  for (const t of Object.values(CLAIM_TYPES)) for (const b of t.basis) {
    if (!/, (s\.|reg\.|Article) ?\d/.test(b)) continue;
    const r = checkLetter(b);
    assert.equal(r.verdict, 'vouched', b);
    assert.equal(r.citations.length, 1, b);
  }
  for (const p of allPrecedents()) assert.equal(checkLetter(`as held in ${p.citation}`).verdict, 'vouched', p.citation);
  assert.deepEqual(TABLE.units.get('consumer rights act 2015|s|9'), { text: 'Consumer Rights Act 2015, s.9 (goods must be of satisfactory quality)', from: 'CLAIM_TYPES.goods_faulty' });
  assert.equal(TABLE.instruments.get('misrepresentation act 1967').from, 'STATUTORY_WEAVES.misled-purchase');
  assert.equal(TABLE.instruments.get('data protection act 2018').from, 'CLAIM_TYPES.data_breach');
  assert.equal(TABLE.cases.get('[2015] uksc 67').name, 'ParkingEye Ltd v Beavis');
  const again = buildTable();
  assert.deepEqual([...again.units.keys()], [...TABLE.units.keys()]);
  assert.ok(Object.isFrozen(ALIASES));
});

test('reading: each way people write a provision', () => {
  assert.deepEqual(keys('Consumer Rights Act 2015, s.9'), ['consumer rights act 2015|s|9']);
  assert.deepEqual(keys('the Consumer Rights Act 2015 s 11'), ['consumer rights act 2015|s|11']);
  assert.deepEqual(keys('section 23 of the Consumer Rights Act 2015'), ['consumer rights act 2015|s|23']);
  assert.deepEqual(keys('s.24 Consumer Rights Act 2015'), ['consumer rights act 2015|s|24']);
  assert.deepEqual(keys('Consumer Rights Act 2015 (section 49)'), ['consumer rights act 2015|s|49']);
  assert.deepEqual(keys('CRA 2015 s.52'), ['consumer rights act 2015|s|52']);
  assert.deepEqual(keys('regulation 34 of the Consumer Contracts Regulations 2013'), ['consumer contracts (information, cancellation and additional charges) regulations 2013|reg|34']);
  assert.deepEqual(keys('Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, reg. 29'), ['consumer contracts (information, cancellation and additional charges) regulations 2013|reg|29']);
  assert.deepEqual(keys('UK GDPR, Article 5'), ['uk gdpr|art|5']);
  assert.deepEqual(keys('Article 5 of the UK GDPR'), ['uk gdpr|art|5']);
  assert.deepEqual(keys('GDPR art. 5'), ['uk gdpr|art|5']);
  assert.deepEqual(keys('the DPA 2018'), ['data protection act 2018']);
  assert.deepEqual(keys('Under the Misrepresentation Act 1967'), ['misrepresentation act 1967']);
  // a word ending in s is not a section
  assert.deepEqual(keys('the claims 9 of the Consumer Rights Act 2015'), ['consumer rights act 2015']);
  // the same citation twice is read once; two provisions of one Act are two
  assert.deepEqual(keys('CRA 2015 s.9 and CRA 2015 s.9'), ['consumer rights act 2015|s|9']);
  assert.deepEqual(keys('CRA 2015 s.9, and later CRA 2015 s.11'), ['consumer rights act 2015|s|9', 'consumer rights act 2015|s|11']);
  assert.deepEqual(readCitations('Consumer Rights Act 2015, s.9').map((c) => c.shown), ['Consumer Rights Act 2015, s.9']);
  assert.deepEqual(readCitations('the Consumer Rights Act 2015').map((c) => c.shown), ['Consumer Rights Act 2015']);
  assert.deepEqual(readCitations('UK GDPR art 5').map((c) => c.shown), ['UK GDPR, Article 5']);
  assert.deepEqual(readCitations('reg 29 of the Consumer Contracts Regulations 2013').map((c) => c.shown), ['Consumer Contracts Regulations 2013, reg. 29']);
  assert.deepEqual(readCitations(42), []);
});

test('reading: unknown titles keep their own name, without the words that lead into them', () => {
  assert.deepEqual(readCitations('Under the Fake Protection Act 2019 I win').map((c) => c.shown), ['Fake Protection Act 2019']);
  assert.deepEqual(readCitations('As my landlord knows, the Housing Act 1988 s.21 applies').map((c) => [c.shown, c.key]), [['Housing Act 1988, s.21', 'housing act 1988|s|21']]);
  assert.deepEqual(readCitations('The Act 2015').map((c) => c.shown), ['The Act 2015']);
});

test('reading cases: the neutral and the law-report forms, in order of appearance', () => {
  assert.deepEqual(readCitations('[2017] UKSC 51 then [1983] 1 AC 1 then [2024] EWHC 685 (Admin) then [2015] EWCA Civ 745 then 2020 ABQB 489').map((c) => c.shown),
    ['[2017] UKSC 51', '[1983] 1 AC 1', '[2024] EWHC 685 (Admin)', '[2015] EWCA Civ 745', '2020 ABQB 489']);
  assert.deepEqual(readCitations('CRA 2015 s.9, as in [2015] UKSC 67').map((c) => c.kind), ['unit', 'case']);
  assert.deepEqual(readCitations('[2015] UKSC 67, then CRA 2015 s.9').map((c) => c.kind), ['case', 'unit']);
});

test('vouching: in the table, a provision outside it, a wrong year, an unknown instrument, an unknown case', () => {
  assert.deepEqual(vouch({ kind: 'unit', key: 'consumer rights act 2015|s|9' }), { vouched: true, why: 'Consumer Rights Act 2015, s.9 (goods must be of satisfactory quality)' });
  assert.deepEqual(vouch({ kind: 'unit', key: 'consumer rights act 2015|s|99' }), { vouched: false, why: 'the instrument is in the verified table, but this provision of it is not' });
  assert.deepEqual(vouch({ kind: 'instrument', key: 'consumer rights act 2016' }), { vouched: false, why: 'the verified table has this instrument as Consumer Rights Act 2015' });
  assert.deepEqual(vouch({ kind: 'unit', key: 'consumer rights act 2016|s|9' }), { vouched: false, why: 'the verified table has this instrument as Consumer Rights Act 2015' });
  assert.deepEqual(vouch({ kind: 'instrument', key: 'fake protection act 2019' }), { vouched: false, why: 'this instrument is not in the verified table' });
  assert.deepEqual(vouch({ kind: 'unit', key: 'housing act 1988|s|21' }), { vouched: false, why: 'this instrument is not in the verified table' });
  assert.deepEqual(vouch({ kind: 'instrument', key: 'uk gdpr' }), { vouched: true, why: 'in the verified table (CLAIM_TYPES.data_breach)' });
  assert.deepEqual(vouch({ kind: 'instrument', key: 'gdpr' }), { vouched: false, why: 'this instrument is not in the verified table' });
  const c = vouch({ kind: 'case', key: '[2015] uksc 67' });
  assert.deepEqual(c, { vouched: true, why: 'ParkingEye Ltd v Beavis, UK Supreme Court', source: 'https://www.bailii.org/uk/cases/UKSC/2015/67.html' });
  assert.deepEqual(vouch({ kind: 'case', key: '[2019] uksc 12' }), { vouched: false, why: 'this case citation is not in the verified table' });
  assert.deepEqual(vouch(null), { vouched: false, why: 'not a citation' });
  assert.deepEqual(vouch({ kind: 'unit', key: 7 }), { vouched: false, why: 'not a citation' });
});

test('checkLetter: the four verdicts, the counts, the scope and the guardrail', () => {
  const ok = checkLetter('Under the Consumer Rights Act 2015, s.9 and section 24 of the Consumer Rights Act 2015.');
  assert.equal(ok.ok, true);
  assert.equal(ok.verdict, 'vouched');
  assert.equal(ok.vouched, 2);
  assert.equal(ok.unvouched, 0);
  assert.equal(ok.pseudo, false);
  assert.equal(ok.guidance, null);
  assert.equal(ok.scope, CITE_SCOPE);
  assert.equal(ok.notice, SCOPE_NOTICE);
  assert.match(CITE_SCOPE, /Not legal advice/);
  const mixed = checkLetter('CRA 2015 s.9 and CRA 2015 s.99.');
  assert.deepEqual([mixed.verdict, mixed.vouched, mixed.unvouched], ['unvouched', 1, 1]);
  assert.deepEqual(mixed.citations.map((x) => x.vouched), [true, false]);
  const pseudo = checkLetter('I am a freeman on the land. CRA 2015 s.9 applies.');
  assert.equal(pseudo.verdict, 'pseudo-law');
  assert.equal(pseudo.pseudo, true);
  assert.match(pseudo.guidance, /sovereign citizen/);
  assert.equal(checkLetter('My boiler is broken and I want a refund.').verdict, 'none');
  for (const bad of [null, 5, '', '   ', {}]) assert.deepEqual(checkLetter(bad), { ok: false, why: 'paste the letter or the passage that cites the law' });
  assert.equal(C.checkLetter, checkLetter);
});

test('hostile text never throws', () => {
  const nasty = ['[', '[2015]', 'Act 2015', '(((( Act 2015', 'X'.repeat(5000) + ' Act 2015 s.', '\u0000 Regulations 9999 reg.', 'a'.repeat(20000)];
  for (const t of nasty) assert.equal(typeof checkLetter(t).ok, 'boolean');
});
