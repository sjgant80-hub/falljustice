import { dsarDeadline, isOverdue } from './deadline.mjs';

// ════════════════════════════════════════════════════════════════
// falljustice · dsar.mjs — the Data Subject Access Request engine (UK GDPR Article 15)
//
// A person's right to get a copy of the personal data an organisation holds on them, plus the
// deadline tracker that holds the organisation to the law. This is the individual right of access —
// NOT a "cannon" for mass-bombarding a target. One person, one well-founded request.
//
// HONEST SCOPE (same as the LBA engine): self-help drafting, not legal advice, no guaranteed outcome.
// Statute references are hand-authored + verified — never model-sourced. Reuses the shared pseudo-law
// guardrail and scope notice from lba.mjs. Zero dependencies; pure + testable.
//
// Verified grounding:
//   • UK GDPR Article 15(1) — confirmation of processing + a copy + supplementary information
//     (purposes; categories; recipients; retention; rights; source; automated decision-making).
//   • UK GDPR Article 15(3) — a copy of the personal data, free for the first copy.
//   • Data Protection Act 2018 — the domestic framework; s.167 court order route if ignored.
//   • Time limit: without undue delay and within ONE MONTH of receipt; extendable by up to TWO
//     further months for complex/numerous requests, but only if the controller tells you within the
//     first month, with reasons. (ICO guidance, ico.org.uk.)
//   • Free, unless the request is manifestly unfounded or excessive (then a reasonable fee / refusal).
//   • The controller may ask for reasonable ID verification, and may redact third parties' data and
//     apply DPA 2018 exemptions (e.g. legal privilege) — so a DSAR does not guarantee every record.
// ════════════════════════════════════════════════════════════════

import { detectPseudoLaw, SCOPE_NOTICE } from './lba.mjs';

// The Article 15(1) supplementary information a data subject is entitled to ask for.
export const ARTICLE_15_ITEMS = [
  'confirmation of whether you are processing my personal data',
  'a copy of all personal data you hold about me (Article 15(3))',
  'the purposes of the processing',
  'the categories of personal data concerned',
  'the recipients or categories of recipient the data has been or will be disclosed to',
  'the retention period, or the criteria used to determine it',
  'the source of the data, where it was not collected from me',
  'whether you carry out automated decision-making or profiling about me, and if so, meaningful information about the logic involved',
];

// Build a compliant Data Subject Access Request letter.
// facts: { yourName, yourAddress, yourEmail, controllerName, controllerAddress, identifiers,
//          specificData, dateOfIssue, format }  (format: 'electronically' | 'by post')
export function buildDSAR(facts = {}) {
  const scan = detectPseudoLaw([facts.specificData, facts.identifiers, facts.extra].filter(Boolean).join(' '));
  if (scan.flagged) return { ok: false, error: 'pseudo-legal content detected', guidance: scan.guidance, patterns: scan.patterns };

  const today = facts.dateOfIssue || '[date]';
  const fmt = facts.format === 'by post' ? 'by post' : 'electronically, in a commonly-used electronic format';

  const header = [
    facts.yourName || '[Your name]',
    facts.yourAddress || '[Your address]',
    facts.yourEmail || null,
    '',
    today,
    '',
    facts.controllerName || '[Organisation name]',
    facts.controllerAddress || '[Organisation address / Data Protection Officer]',
    '',
    'Dear Data Protection Officer',
    '',
    'RE: DATA SUBJECT ACCESS REQUEST (UK GDPR, Article 15)',
  ].filter(x => x !== null).join('\n');

  const body = [
    'I am making a subject access request under Article 15 of the UK GDPR and the Data Protection Act 2018. I am the data subject.',
    '',
    'IDENTITY',
    `You can identify my records by: ${esc(facts.identifiers || '[your account number / email / customer reference / date of birth]')}. If you need reasonable further information to confirm my identity, please tell me promptly and the time limit will run from when I provide it.`,
    '',
    'WHAT I REQUIRE',
    'Please provide:',
    ...ARTICLE_15_ITEMS.map(i => `  • ${i}`),
    facts.specificData ? `\nIn particular, I am interested in: ${esc(facts.specificData)}. (This does not limit the request — I am entitled to all of my personal data.)` : '',
    '',
    `Please provide the response ${fmt}.`,
    '',
    'TIME LIMIT',
    'The UK GDPR requires you to respond without undue delay and within one month of receiving this request. If you consider the request complex and intend to extend that period by up to two further months, you must tell me within the first month and give your reasons. The first copy of my data must be provided free of charge.',
    '',
    'If you do not respond within the statutory period, I may complain to the Information Commissioner’s Office (ico.org.uk) and may apply to the court for an order under section 167 of the Data Protection Act 2018.',
    '',
    'Yours faithfully',
    '',
    facts.yourName || '[Your name]',
  ].filter(x => x !== '').join('\n');

  const letter = `${header}\n\n${body}\n\n---\n${SCOPE_NOTICE}`;

  return {
    ok: true,
    letter,
    meta: {
      article: 'UK GDPR Article 15',
      itemsRequested: ARTICLE_15_ITEMS.length,
      responseMonths: 1,
      maxExtensionMonths: 3,
      wordCount: letter.split(/\s+/).filter(Boolean).length,
    },
  };
}

// Deterministic deadline math. received: ISO 'YYYY-MM-DD'. Returns the statutory due date (one
// calendar month), the extended date (three months), and — given a reference date `today` — how many
// days remain and the status. `today` is injectable so this is testable without a clock.
export function deadlineTracker(received, { extended = false, today = null, holidays = null } = {}) {
  // ⚑ THIS FILE USED TO STATE A RULE IT DID NOT APPLY. Every answer carried the sentence "if the due
  // date is not a working day, the next working day applies (ICO guidance)" — and nothing computed
  // it. A request received 7 Feb 2026 came back due Saturday 7 March, and on the Sunday this tracker
  // reported the controller OVERDUE, two days early, with an escalation ladder pointing at the ICO.
  const r = dsarDeadline(received, { extended, today, holidays });
  if (!r.ok) return { ok: false, error: r.error };

  return {
    ok: true,
    received: r.received,
    dueDate: r.dueDate,
    statutoryDate: r.statutoryDate,
    movedForWorkingDay: r.movedForWorkingDay,
    extendedDueDate: dsarDeadline(received, { extended: true, holidays }).dueDate,
    daysRemaining: r.daysRemaining,
    status: r.status,
    // ⚑ The verdict that sends somebody to the regulator is kept separate, and refuses to be
    // certain when the deadline itself could still move.
    overdue: isOverdue(r),
    bankHolidaysApplied: r.bankHolidaysApplied,
    note: 'One calendar month from receipt. If the corresponding date does not exist in the next ' +
      'month, the last day of that month applies; if the due date is not a working day, the next ' +
      'working day applies (ICO guidance). Complex requests may be extended to three months with ' +
      'notice. ' + r.caveat,
  };
}

// What to do when the deadline passes — the honest escalation ladder.
export function escalation(status) {
  if (status !== 'overdue') return null;
  return [
    'Send a short chaser referring to your original request and the passed deadline.',
    'Complain to the Information Commissioner’s Office at ico.org.uk (free) — include your request and any reply.',
    'As a last resort, you may apply to the County Court for an order under section 167 of the Data Protection Act 2018. Consider advice from a solicitor or Citizens Advice first.',
  ];
}

// ── date helpers (UTC, no locale) ────────────────────────────────────────────
function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}
function addMonths(d, n) {
  const y = d.getUTCFullYear(), mo = d.getUTCMonth(), day = d.getUTCDate();
  const target = new Date(Date.UTC(y, mo + n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay)); // clamp for short months
  return target;
}
function toISO(d) { return d.toISOString().slice(0, 10); }
function esc(s) { return String(s == null ? '' : s).replace(/[<>]/g, c => (c === '<' ? '‹' : '›')); }

export default buildDSAR;
