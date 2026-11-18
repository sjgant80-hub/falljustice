// ════════════════════════════════════════════════════════════════
// falljustice · cite.mjs — check the law a letter cites, against the hand-verified table
//
// Paste a letter (one you drafted, or one you were sent) and this reads every law it cites: Acts and their sections,
// Regulations and their regulations, UK GDPR articles, and case citations like [2015] UKSC 67. It then says, for each
// one, whether it is in the table a person wrote and checked for this engine (the claim types, the statutory weaves,
// the precedents). It VOUCHES only for those. Anything else is "not in the verified table": this checker cannot vouch
// for it. That is NOT the same as saying it is false — the table is small on purpose, and a real section missing from
// it is still real. It also flags pseudo-law with the same guardrail the letter engine uses (detectPseudoLaw).
//
// HONEST SCOPE: not legal advice, not a solicitor. It checks citations against a table; it does not judge whether the
// law applies to your facts. No language model is ever the source of anything this file vouches for.
// Pure functions, no I/O. Garbage in returns { ok: false, why }, never a throw.
// ════════════════════════════════════════════════════════════════

import { CLAIM_TYPES, detectPseudoLaw, SCOPE_NOTICE } from './lba.mjs';
import { allPrecedents, STATUTORY_WEAVES } from './precedents.mjs';

export const CITE_SCOPE = 'This checks the citations against a table of law a person verified for this engine. Not legal advice. ' +
  'A citation it cannot vouch for may still be real; check it at legislation.gov.uk or caselaw.nationalarchives.gov.uk.';

const squash = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();

/** short names people use, each for one instrument in the table (written by hand, like the table) */
export const ALIASES = Object.freeze({
  'cra 2015': 'consumer rights act 2015',
  'consumer contracts regulations 2013': 'consumer contracts (information, cancellation and additional charges) regulations 2013',
  'dpa 2018': 'data protection act 2018',
  'cputrs 2008': 'consumer protection from unfair trading regulations 2008',
  'cprs 2008': 'consumer protection from unfair trading regulations 2008',
  gdpr: 'uk gdpr',
});
const canon = (title) => { const t = squash(title).replace(/^the /, ''); return ALIASES[t] || t; };

const UNIT = { 's.': 's', 'reg.': 'reg', article: 'art' };
const BASIS = /^(.+?), (s\.|reg\.|Article) ?(\d+)\b/;
const WHOLE = /^(.+? (?:Act|Regulations) \d{4})(?:\s+—\s+.*)?$/;

/** the verified table, built from the hand-authored strings themselves: { units: Map, instruments: Map, cases: Map } */
export function buildTable() {
  const units = new Map(), instruments = new Map(), cases = new Map();
  const addInstrument = (title, from) => { const k = canon(title); if (!instruments.has(k)) instruments.set(k, { title: title.trim(), from }); };
  for (const [type, t] of Object.entries(CLAIM_TYPES)) {
    for (const b of t.basis) {
      const m = b.match(BASIS);
      if (m) {
        const inst = canon(m[1]);
        addInstrument(m[1], `CLAIM_TYPES.${type}`);
        units.set(`${inst}|${UNIT[m[2].toLowerCase()]}|${m[3]}`, { text: b, from: `CLAIM_TYPES.${type}` });
        continue;
      }
      const w = b.match(WHOLE);
      if (w) addInstrument(w[1], `CLAIM_TYPES.${type}`);
    }
  }
  for (const weave of STATUTORY_WEAVES) for (const line of weave.stack) { const w = line.match(WHOLE); if (w) addInstrument(w[1], `STATUTORY_WEAVES.${weave.id}`); }
  for (const p of allPrecedents()) cases.set(squash(p.citation), { name: p.name, court: p.court, citation: p.citation, source: p.source, tier: p.tier });
  return { units, instruments, cases };
}
export const TABLE = buildTable();

// ── reading the citations in a text ──
const CASE = /\[(\d{4})\]\s+(\d+\s+)?([A-Z][A-Za-z]{1,5}(?:\s(?:Civ|Crim))?)\s+(\d+)(?:\s*\((Admin|QB|KB|Ch|Fam|Comm|TCC|Pat|IPEC)\))?|\b(\d{4})\s+(ABQB|ONCA|SCC|BCSC|ONSC|ABCA)\s+(\d+)\b/g;
const INSTRUMENT = /((?:[A-Z][A-Za-z]*|\([^)]{1,80}\))(?:\s+(?:[A-Z][A-Za-z]*|of|and|for|from|the|on|to|in|\([^)]{1,80}\)))*)\s+(Act|Regulations)\s+(\d{4})/g;
const SHORT = /\b(CRA 2015|DPA 2018|CPUTRs 2008|CPRs 2008|UK GDPR|GDPR)\b/g;
const LEAD = new Set(['under', 'in', 'by', 'as', 'the', 'see', 'per', 'pursuant', 'according', 'section', 'sections', 'regulation', 'regulations', 'reg', 'article', 'and', 'of', 'to', 'from', 'on', 'for', 'with', 'my', 'your', 'our', 'their', 'this', 'that', 'i', 'we', 'you', 'it', 'a', 'an']);
const UNIT_AFTER = /^,?\s*(?:\(|,)?\s*\b(s\.|s|ss\.|section|sections|reg\.|reg|regulation|art\.|article|art)\s*(\d+)/i;
const UNIT_BEFORE = /\b(s\.|s|section|reg\.|reg|regulation|art\.|article|art)\s*(\d+)\s+(?:of\s+)?(?:the\s+)?$/i;
const unitKind = (u) => { const x = u.toLowerCase(); return x.startsWith('reg') ? 'reg' : x.startsWith('art') ? 'art' : 's'; };

/** trim a captured title to where the instrument's name starts, preferring the longest known instrument it ends with */
function titleOf(words, kind, year) {
  const known = words.map((_, cut) => `${words.slice(cut).join(' ')} ${kind} ${year}`).find((t) => TABLE.instruments.has(canon(t)));
  if (known) return known.replace(/^the\s+/i, '');
  const start = words.findIndex((w) => !LEAD.has(w.toLowerCase()));
  return `${words.slice(Math.max(0, start)).join(' ')} ${kind} ${year}`;
}

/** readCitations(text) → [{ kind: 'case'|'unit'|'instrument', key, shown }] in the order they appear, each once */
export function readCitations(text) {
  if (typeof text !== 'string') return [];
  const found = [];
  const seen = new Set();
  const add = (at, c) => { if (!seen.has(c.key)) { seen.add(c.key); found.push({ at, ...c }); } };
  for (const m of text.matchAll(CASE)) {
    const shown = m[1] ? `[${m[1]}] ${m[2] ? m[2].trim() + ' ' : ''}${m[3]} ${m[4]}${m[5] ? ` (${m[5]})` : ''}` : `${m[6]} ${m[7]} ${m[8]}`;
    add(m.index, { kind: 'case', key: squash(shown), shown });
  }
  const instruments = [];
  for (const m of text.matchAll(INSTRUMENT)) instruments.push({ at: m.index, end: m.index + m[0].length, title: titleOf(m[1].split(/\s+/), m[2], m[3]) });
  for (const m of text.matchAll(SHORT)) instruments.push({ at: m.index, end: m.index + m[0].length, title: m[1] });
  for (const ins of instruments) {
    const inst = canon(ins.title);
    const after = text.slice(ins.end, ins.end + 24).match(UNIT_AFTER);
    const before = text.slice(Math.max(0, ins.at - 40), ins.at).match(UNIT_BEFORE);
    const unit = after || before;
    if (unit) add(ins.at, { kind: 'unit', key: `${inst}|${unitKind(unit[1])}|${unit[2]}`, shown: `${ins.title}, ${unitKind(unit[1]) === 's' ? 's.' : unitKind(unit[1]) === 'reg' ? 'reg. ' : 'Article '}${unit[2]}` });
    else add(ins.at, { kind: 'instrument', key: inst, shown: ins.title });
  }
  return found.sort((a, b) => a.at - b.at).map(({ at, ...c }) => c);
}

/** vouch(citation) — is it in the verified table? { vouched, why, source? } */
export function vouch(c) {
  if (!c || typeof c.key !== 'string') return { vouched: false, why: 'not a citation' };
  if (c.kind === 'case') {
    const hit = TABLE.cases.get(c.key);
    return hit ? { vouched: true, why: `${hit.name}, ${hit.court}`, source: hit.source } : { vouched: false, why: 'this case citation is not in the verified table' };
  }
  const inst = c.key.split('|')[0];
  const known = TABLE.instruments.get(inst);
  if (c.kind === 'instrument') {
    if (known) return { vouched: true, why: `in the verified table (${known.from})` };
    return { vouched: false, why: yearNote(inst) || 'this instrument is not in the verified table' };
  }
  const unit = TABLE.units.get(c.key);
  if (unit) return { vouched: true, why: unit.text };
  if (known) return { vouched: false, why: 'the instrument is in the verified table, but this provision of it is not' };
  return { vouched: false, why: yearNote(inst) || 'this instrument is not in the verified table' };
}

/** when the title is known under a different year, say so (a wrong year is the commonest invented citation) */
function yearNote(inst) {
  const bare = inst.replace(/ \d{4}$/, '');
  if (bare === inst) return '';
  const other = [...TABLE.instruments.keys()].find((k) => k.replace(/ \d{4}$/, '') === bare);
  return other ? `the verified table has this instrument as ${TABLE.instruments.get(other).title}` : '';
}

/** checkLetter(text) — every citation in it, vouched or not, and the pseudo-law check */
export function checkLetter(text) {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, why: 'paste the letter or the passage that cites the law' };
  const pseudo = detectPseudoLaw(text);
  const citations = readCitations(text).map((c) => ({ ...c, ...vouch(c) }));
  const unvouched = citations.filter((c) => !c.vouched).length;
  const verdict = pseudo.flagged ? 'pseudo-law' : citations.length === 0 ? 'none' : unvouched ? 'unvouched' : 'vouched';
  return { ok: true, verdict, citations, vouched: citations.length - unvouched, unvouched, pseudo: pseudo.flagged, guidance: pseudo.guidance, scope: CITE_SCOPE, notice: SCOPE_NOTICE };
}

export default { CITE_SCOPE, ALIASES, buildTable, TABLE, readCitations, vouch, checkLetter };
