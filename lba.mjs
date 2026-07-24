// ════════════════════════════════════════════════════════════════
// falllegal · lba.mjs — the Clause-40 Letter Before Action engine
//
// Turns a structured grievance into a procedurally-correct Letter Before Action (LBA) that follows
// the real modern process — the Practice Direction on Pre-Action Conduct and Protocols, and where it
// applies, a named Pre-Action Protocol — citing the correct MODERN statute (Consumer Rights Act 2015,
// UK GDPR / Data Protection Act 2018, etc.). It does NOT compile 1215 Latin: Magna Carta Clause 40
// ("to no one will we delay or deny justice") is the SPIRIT; the modern statutory API is the syntax a
// 2026 court and a corporation are actually forced to recognise.
//
// HONEST SCOPE — read this, it shapes the whole design:
//   • This is a SELF-HELP DRAFTING tool. It assembles a first draft from facts YOU supply and legal
//     templates authored + verified by a human. It is NOT legal advice, it is NOT a solicitor, and it
//     does NOT guarantee any outcome. You review every word; a complex or high-value matter still
//     wants a solicitor or Citizens Advice.
//   • The statute citations here are hand-authored and verified. No language model — local or cloud —
//     is ever the source of a statute reference (a model inventing "CRA 2015 s.99" is the exact
//     fabricated-statute failure this estate exists to reject). A local LLM may reshape YOUR prose
//     into the facts; it never sources the law.
//   • It refuses to generate pseudo-legal / "sovereign citizen" / Freeman-on-the-Land content, which
//     gets real people sanctioned. See detectPseudoLaw().
//
// Zero dependencies. Pure functions — fully testable without a browser.
// ════════════════════════════════════════════════════════════════

export const SCOPE_NOTICE =
  'This letter is a self-help draft, not legal advice, and gives no guarantee of any outcome. ' +
  'Check every fact and figure before you send it. For a complex or high-value dispute, take advice ' +
  'from a solicitor or Citizens Advice (citizensadvice.org.uk).';

// ── The claim registry ───────────────────────────────────────────────────────
// Each entry is a category of dispute mapped to its VERIFIED statutory basis, the operative demand
// language, and the response window the relevant protocol expects. Kept deliberately general — this
// covers the common consumer/contract situations, not every case in English law.
export const CLAIM_TYPES = {
  goods_faulty: {
    label: 'Faulty or not-as-described goods',
    protocol: 'Practice Direction on Pre-Action Conduct and Protocols',
    basis: [
      'Consumer Rights Act 2015, s.9 (goods must be of satisfactory quality)',
      'Consumer Rights Act 2015, s.11 (goods must be as described)',
      'Consumer Rights Act 2015, s.23 (right to repair or replacement)',
      'Consumer Rights Act 2015, s.24 (right to a price reduction or the final right to reject)',
    ],
    remedyOptions: ['repair', 'replacement', 'refund', 'price reduction'],
    responseDays: 14,
    demand: f => `Under the Consumer Rights Act 2015, goods must be of satisfactory quality, fit for purpose and as described. The ${esc(f.item || 'goods')} supplied ${f.faultDesc ? 'were not, in that ' + esc(f.faultDesc) : 'did not meet this standard'}. I am entitled to ${esc(f.remedy || 'a repair, replacement or refund')} and I require ${esc(f.remedy || 'a full refund')} of ${money(f.amount)}.`,
  },
  service_poor: {
    label: 'Poor or unfinished service',
    protocol: 'Practice Direction on Pre-Action Conduct and Protocols',
    basis: [
      'Consumer Rights Act 2015, s.49 (service to be performed with reasonable care and skill)',
      'Consumer Rights Act 2015, s.52 (service to be performed within a reasonable time)',
      'Consumer Rights Act 2015, s.55 (right to require repeat performance)',
      'Consumer Rights Act 2015, s.56 (right to a price reduction)',
    ],
    remedyOptions: ['repeat performance', 'price reduction', 'refund'],
    responseDays: 14,
    demand: f => `Under the Consumer Rights Act 2015, a service must be carried out with reasonable care and skill and within a reasonable time. The ${esc(f.item || 'service')} ${f.faultDesc ? 'fell short, in that ' + esc(f.faultDesc) : 'was not performed to that standard'}. I require ${esc(f.remedy || 'a price reduction or refund')} of ${money(f.amount)}.`,
  },
  contract_breach: {
    label: 'Breach of contract / money owed to you',
    protocol: 'Practice Direction on Pre-Action Conduct and Protocols',
    basis: [
      'Breach of the express/implied terms of the contract between us',
      'The claimant is entitled to damages putting them in the position performance would have',
    ],
    remedyOptions: ['payment', 'performance', 'damages'],
    responseDays: 14,
    demand: f => `We entered a contract under which ${esc(f.obligation || 'you agreed to perform')}. You are in breach because ${esc(f.faultDesc || 'the agreed obligation was not met')}. I require payment of ${money(f.amount)} in respect of that breach.`,
  },
  distance_cancel: {
    label: 'Online / distance purchase — right to cancel',
    protocol: 'Practice Direction on Pre-Action Conduct and Protocols',
    basis: [
      'Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, reg. 29 (14-day right to cancel a distance contract)',
      'Consumer Contracts Regulations 2013, reg. 34 (refund on cancellation)',
    ],
    remedyOptions: ['refund'],
    responseDays: 14,
    demand: f => `This was a distance contract. Under the Consumer Contracts Regulations 2013 I have a 14-day right to cancel and to a refund. I cancelled on ${esc(f.cancelDate || 'the date stated above')} and require a full refund of ${money(f.amount)}.`,
  },
  data_breach: {
    label: 'Misuse of your personal data',
    protocol: 'Practice Direction on Pre-Action Conduct and Protocols',
    basis: [
      'UK GDPR, Article 5 (principles of processing)',
      'Data Protection Act 2018',
      'A complaint may also be made to the Information Commissioner’s Office (ico.org.uk)',
    ],
    remedyOptions: ['cease processing', 'erasure', 'compensation'],
    responseDays: 14,
    demand: f => `You have processed my personal data in a way that breaches the UK GDPR and the Data Protection Act 2018, in that ${esc(f.faultDesc || 'my data was used without a lawful basis')}. I require you to ${esc(f.remedy || 'stop the processing and confirm erasure')}${f.amount ? ' and to compensate me ' + money(f.amount) : ''}. I may also complain to the Information Commissioner’s Office.`,
  },
};

// Debt Pre-Action Protocol is a distinct, stricter track when a BUSINESS claims from an INDIVIDUAL.
export const DEBT_PROTOCOL_NOTE =
  'If you are a business claiming a debt from an individual, the Pre-Action Protocol for Debt Claims ' +
  '2017 applies instead: it requires a specific Letter of Claim with a Reply Form and Information ' +
  'Sheet, and a 30-day response window. This engine produces a general Letter Before Action; use the ' +
  'debt-protocol template for that situation.';

// ── The pseudo-law guardrail ─────────────────────────────────────────────────
// The single most important safety feature. "Sovereign citizen" / Freeman-on-the-Land arguments
// (Magna Carta Art.61 "lawful rebellion", "I do not consent", strawman/UCC theories) are rejected by
// every real court and get the user crushed or sanctioned. The engine refuses to dress them up.
const PSEUDO_LAW_PATTERNS = [
  /\bfreeman(?:[- ]on[- ]the[- ]land)?\b/i,
  /\bsovereign citizen\b/i,
  /\blawful rebellion\b/i,
  /\barticle 61\b/i,
  /\bstraw ?man\b/i,
  /\bucc\b|\buniform commercial code\b/i,
  /\bdo not consent\b.*\bstatute/i,
  /\bnot a (?:legal )?person\b/i,
  /\bcestui que\b/i,
  /\bunder duress\b.*\bwithout prejudice\b.*\ball rights reserved\b/i,
];

export function detectPseudoLaw(text) {
  const s = String(text || '');
  const hits = PSEUDO_LAW_PATTERNS.filter(re => re.test(s)).map(re => re.source);
  return {
    flagged: hits.length > 0,
    patterns: hits,
    guidance: hits.length
      ? 'This reads like "sovereign citizen" / Freeman-on-the-Land argument. Real courts reject it ' +
        'and it can get your claim struck out or you penalised. Drop it. State your facts plainly and ' +
        'rely on the actual statute (e.g. the Consumer Rights Act 2015) — that is what a court enforces.'
      : null,
  };
}

// ── The assembler ────────────────────────────────────────────────────────────
// facts: { claimType, yourName, yourAddress, yourEmail, theirName, theirAddress, item, faultDesc,
//          amount, remedy, obligation, cancelDate, dateOfIssue, responseDays }
// Returns { ok, letter, meta } or { ok:false, error, guidance } if pseudo-law is detected.
export function assembleLBA(facts = {}) {
  const type = CLAIM_TYPES[facts.claimType];
  if (!type) return { ok: false, error: `unknown claim type "${facts.claimType}"`, known: Object.keys(CLAIM_TYPES) };

  // guardrail: scan the free-text fields for pseudo-law before we build anything
  const scan = detectPseudoLaw([facts.faultDesc, facts.obligation, facts.extra].filter(Boolean).join(' '));
  if (scan.flagged) return { ok: false, error: 'pseudo-legal content detected', guidance: scan.guidance, patterns: scan.patterns };

  const days = Number.isFinite(facts.responseDays) ? facts.responseDays : type.responseDays;
  const today = facts.dateOfIssue || '[date]';
  const deadline = facts.deadlineDate || `${days} days from the date of this letter`;

  const header = [
    `${facts.yourName || '[Your name]'}`,
    `${facts.yourAddress || '[Your address]'}`,
    facts.yourEmail ? `${facts.yourEmail}` : null,
    '',
    today,
    '',
    `${facts.theirName || '[Recipient name]'}`,
    `${facts.theirAddress || '[Recipient address]'}`,
    '',
    'Dear Sir or Madam',
    '',
    'RE: LETTER BEFORE ACTION',
  ].filter(x => x !== null).join('\n');

  const body = [
    `I am writing to you under the ${type.protocol} before commencing court proceedings. I hope this can be resolved without the need for a claim.`,
    '',
    'THE FACTS',
    facts.factsNarrative ? esc(facts.factsNarrative) : `On or about ${esc(facts.eventDate || '[date]')}, ${esc(facts.faultDesc || '[set out what happened]')}.`,
    '',
    'THE LEGAL BASIS',
    'I rely on:',
    ...type.basis.map(b => `  • ${b}`),
    '',
    'WHAT I REQUIRE',
    type.demand(facts),
    '',
    'ACTION REQUIRED',
    `Please respond within ${typeof deadline === 'string' && /\d/.test(deadline) ? deadline : days + ' days'}. If I do not receive ${esc(facts.remedy || 'the remedy set out above')} or a satisfactory response by then, I may issue proceedings in the County Court without further notice, and I will bring this letter to the court’s attention on the question of costs.`,
    '',
    'I confirm I would consider a reasonable proposal to resolve this. Please treat this letter, and any reply, as open correspondence.',
    '',
    'Yours faithfully',
    '',
    `${facts.yourName || '[Your name]'}`,
  ].join('\n');

  const letter = `${header}\n\n${body}\n\n---\n${SCOPE_NOTICE}`;

  return {
    ok: true,
    letter,
    meta: {
      claimType: facts.claimType,
      label: type.label,
      protocol: type.protocol,
      statutesCited: type.basis.length,
      responseDays: days,
      amount: facts.amount ?? null,
      wordCount: letter.split(/\s+/).filter(Boolean).length,
    },
  };
}

// Small claims track (County Court) is for claims up to £10,000. A quick eligibility read for the UI.
export function smallClaimsBand(amount) {
  const n = Number(amount) || 0;
  if (n <= 0) return { band: 'unknown', note: 'Enter the amount in dispute.' };
  if (n <= 10000) return { band: 'small-claims', note: 'Within the small claims track (up to £10,000). You can issue via Money Claim Online (moneyclaim.gov.uk).' };
  if (n <= 25000) return { band: 'fast-track', note: 'Likely the fast track (£10,000–£25,000). Legal advice is strongly recommended.' };
  return { band: 'multi-track', note: 'Likely the multi/intermediate track (over £25,000). Take legal advice before proceeding.' };
}

// ── helpers ──────────────────────────────────────────────────────────────────
function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n === 0) return '[amount]';
  return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// Plain-text field guard: LBA output is text, but the browser canvas renders it — strip anything that
// could become markup so a pasted grievance can never inject into the page or a generated PDF.
function esc(s) {
  return String(s == null ? '' : s).replace(/[<>]/g, c => (c === '<' ? '‹' : '›'));
}

export default assembleLBA;
