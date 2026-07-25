// ════════════════════════════════════════════════════════════════
// falljustice · precedents.mjs — a VERIFIED corpus of won cases + statutory weaves
//
// The rule for this file, without exception: nothing goes in unless it is a real, decided case (or a
// real, in-force statute) that was checked against a public source, and each entry carries that
// `source` URL so any citation can be independently verified. AI-hallucinated case law is how real
// lawyers get sanctioned (the Mata v Avianca affair); this corpus exists precisely to make that
// impossible — if it isn't sourced, it isn't here.
//
// THE HONEST TRUTH ABOUT MAGNA CARTA (read magnaCartaReality() before you cite it):
//   The citable instrument is Magna Carta (1297), 1297 c. 9 (25 Edw 1) — the 1215 charter was
//   papally annulled within months and is NOT on the statute roll, so never cite "Magna Carta 1215"
//   as live law. Only three chapters of the 1297 statute remain in force in England & Wales: I
//   (freedom of the Church), IX (liberties of the City of London), and XXIX (due process + access to
//   justice — the reissued combination of the 1215 charter's clauses 39 and 40). Magna Carta is
//   almost never the WINNING argument on its own today; what wins is its descendant, the
//   constitutional right of access to justice (the cases below). Quoting "clause 61 / lawful
//   rebellion" (removed in 1215, never statute) is the sovereign-citizen error — it loses in real
//   courts (Samede, Kofa, AVI v MHVB below). Verified via the deep-research pass, 2026-07-25.
// ════════════════════════════════════════════════════════════════

// Tier A — the access-to-justice constitutional line (the real, winning descendant of Magna Carta).
export const ACCESS_TO_JUSTICE = [
  {
    id: 'unison-2017',
    name: 'R (UNISON) v Lord Chancellor',
    citation: '[2017] UKSC 51',
    court: 'UK Supreme Court',
    year: 2017,
    outcome: 'WON — appeal allowed unanimously; the Employment Tribunals Fees Order 2013 quashed as unlawful ab initio.',
    principle:
      'The constitutional right of access to the courts is inherent in the rule of law and long ' +
      'established in English law — traceable to chapter 40 of Magna Carta 1215 and chapter 29 of the ' +
      '1297 statute. Fees that effectively prevent access to justice are unlawful, and a statutory ' +
      'power will not be read as authorising that unless Parliament said so in the clearest terms.',
    magnaCarta: 'chapter 40 (1215) / chapter 29 (1297) — cited by Lord Reed',
    whenToUse:
      'When the BARRIER itself is the wrong: a fee, a charge, or a rule that stops you being heard. ' +
      'This is the landmark. It does not decide your underlying dispute — it protects your right to ' +
      'bring it.',
    source: 'https://en.wikipedia.org/wiki/R_(UNISON)_v_Lord_Chancellor',
  },
  {
    id: 'witham-1998',
    name: 'R v Lord Chancellor, ex parte Witham',
    citation: '[1998] QB 575',
    court: 'Queen’s Bench Divisional Court',
    year: 1998,
    outcome: 'WON — the order removing court-fee exemption for a litigant in person on income support was unlawful.',
    principle:
      'Access to the court is a constitutional right which can only be denied by the government if ' +
      'Parliament passes legislation that, by express provision, permits people to be turned away from ' +
      'the court door. General words are not enough.',
    magnaCarta: 'the access-to-justice principle (Magna Carta descendant)',
    whenToUse:
      'When a fee or cost you cannot afford is being used to shut you out of a court or tribunal.',
    source: 'https://www.casemine.com/judgement/uk/5a8ff8d060d03e7f57ecdc3b',
  },
  {
    id: 'raymond-honey-1983',
    name: 'Raymond v Honey',
    citation: '[1983] 1 AC 1',
    court: 'House of Lords',
    year: 1983,
    outcome: 'WON — the prison governor who blocked a prisoner’s court application was in contempt.',
    principle:
      'A person retains all civil rights not expressly taken away, including the basic right of ' +
      'unimpeded access to the courts. Subordinate rules (there, s.47 Prison Act 1952) cannot ' +
      'override that right without express statutory authority — Lord Wilberforce held the general ' +
      'power "quite insufficient to authorise hindrance or interference with so basic a right".',
    magnaCarta: 'the access-to-justice principle (Magna Carta descendant) — 3-0 adversarially verified',
    whenToUse:
      'When someone in authority is physically or procedurally obstructing you from reaching a court.',
    source: 'https://swarb.co.uk/raymond-v-honey-hl-4-mar-1981/',
  },
];

// Tier B — substantive consumer WINS + the doctrine you argue with. Verified in the deep-research pass.
export const CONSUMER_CASES = [
  {
    id: 'salt-stratstone-2015',
    name: 'Salt v Stratstone Specialist Ltd',
    citation: '[2015] EWCA Civ 745',
    court: 'Court of Appeal (Civil Division)',
    year: 2015,
    outcome: 'WON — the buyer rescinded the sale and recovered the FULL £21,895 price (not just damages).',
    principle:
      'A "brand new" car was in fact a repaired, previously crash-damaged vehicle — a misrepresentation. ' +
      'Rescission (money back) is the NORMAL remedy for misrepresentation and should be granted wherever ' +
      '"practical justice" can be done; neither registration, depreciation, use nor delay barred it. ' +
      'Misrepresentation Act 1967, s.2.',
    whenToUse:
      'When a seller’s false statement induced you to buy — you can aim for a full refund (rescission), ' +
      'not merely a partial damages figure. The cleanest consumer "weave" of a statute + common law.',
    source: 'https://swarb.co.uk/salt-v-stratstone-specialist-ltd-ca-16-jul-2015/',
  },
  {
    id: 'parkingeye-beavis-2015',
    name: 'ParkingEye Ltd v Beavis',
    citation: '[2015] UKSC 67',
    court: 'UK Supreme Court',
    year: 2015,
    outcome: 'The consumer LOST — but it is THE test for penalty + unfair-terms challenges.',
    principle:
      'The £85 overstay charge was held NOT an unenforceable penalty and NOT unfair. The modern test: ' +
      'a term is penal only if it imposes a detriment "out of all proportion to any legitimate ' +
      'interest" of the innocent party. Read the outcome honestly — cite it to argue a charge IS ' +
      'disproportionate where the other side has no legitimate interest beyond punishing you.',
    whenToUse:
      'Challenging a fee/charge as an unenforceable penalty or an unfair term — this is the framework ' +
      'a court will apply. Do not claim it as a consumer victory; it is the rulebook, and Beavis lost.',
    source: 'https://www.bailii.org/uk/cases/UKSC/2015/67.html',
  },
];

// Tier C — the LOSING uses, with real citations, so the tool can warn users off pseudo-law by name.
export const LOSING_USES = [
  {
    id: 'samede-2012',
    name: 'City of London v Samede (Occupy London)',
    citation: '[2012] EWCA Civ 160',
    court: 'Court of Appeal (Civil Division)',
    year: 2012,
    outcome: 'The pseudo-legal Magna Carta argument was rejected; the protestors lost.',
    principle:
      'A litigant’s claim to be exempt as a "Magna Carta heir", and that "constitutional and superior ' +
      'law" beats statute, was "a concept unknown to the law" and "simply wrong — at least in a court ' +
      'of law". The court confirmed only chapters 1, 9 and 29 of Magna Carta (1297) survive and that ' +
      'chapter 29 "had no bearing" on the case.',
    source: 'https://www.bailii.org/ew/cases/EWCA/Civ/2012/160.html',
  },
  {
    id: 'kofa-2024',
    name: 'R (Kofa) v Oldham MBC',
    citation: '[2024] EWHC 685 (Admin)',
    court: 'High Court (Administrative Court)',
    year: 2024,
    outcome: 'The "I did not consent to the statute" argument was rejected; permission for review refused.',
    principle:
      'The claim that council-tax law cannot bind an individual without personal consent fails: consent ' +
      'is given democratically through elected representatives, not individually (Ashby v White / Holt ' +
      'CJ). Taxing statutes "secure rather than undermine the rule of law". A current English authority ' +
      'against the sovereign-citizen "no consent" theory.',
    source: 'https://caselaw.nationalarchives.gov.uk/ewhc/admin/2024/685',
  },
  {
    id: 'avi-mhvb-2020',
    name: 'AVI v MHVB (Alberta — persuasive only)',
    citation: '2020 ABQB 489',
    court: 'Alberta Court of Queen’s Bench (Canada)',
    year: 2020,
    outcome: 'The Article 61 "lawful rebellion" argument was demolished on the merits.',
    principle:
      'Article 61 of the 1215 Magna Carta conferred no rights on individuals — it empowered only a ' +
      'council of 25 barons, and it lapsed when King John died in 1216. The court called it an ' +
      '"Organized Pseudolegal Commercial Argument" pretence "to get things for free, ignore the law… ' +
      'and excuse criminal misconduct". Persuasive (not binding in England), but squarely on point.',
    source: 'https://www.canlii.org/en/ab/abqb/doc/2020/2020abqb489/2020abqb489.html',
  },
];

// Tier B — the substantive statutory weaves that actually win a consumer dispute. "Weaving" = stacking
// independent, in-force rights so the other side has to answer all of them. Each right is real and
// citable; combine the ones that fit the facts.
export const STATUTORY_WEAVES = [
  {
    id: 'misled-purchase',
    name: 'The misled-into-buying weave',
    facts: 'You bought because the trader said something untrue or used pressure.',
    stack: [
      'Consumer Rights Act 2015 — the goods/service must be as described, satisfactory, fit for purpose.',
      'Consumer Protection from Unfair Trading Regulations 2008 — since Oct 2014 a consumer misled or ' +
        'pressured into a contract has a private right to redress: unwind the contract, a discount, and/or damages. This is IN ADDITION to CRA 2015.',
      'Misrepresentation Act 1967 — a false statement of fact that induced the contract can give rescission and damages.',
    ],
    whyItWorks:
      'Three independent routes to the same remedy. The trader cannot dispose of the claim by beating ' +
      'one of them — you only need one to succeed.',
    source: 'https://en.wikipedia.org/wiki/Consumer_Protection_from_Unfair_Trading_Regulations_2008',
  },
  {
    id: 'online-faulty',
    name: 'The online-purchase weave',
    facts: 'You bought at a distance (online / phone) and it is faulty or you changed your mind in time.',
    stack: [
      'Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013 — a 14-day right to cancel a distance contract and get a refund.',
      'Consumer Rights Act 2015 — separately, the short-term right to reject faulty goods within 30 days.',
    ],
    whyItWorks:
      'The cancellation right does not even require a fault; the CRA right covers you if the goods are ' +
      'defective. Different triggers, so one usually lands.',
    source: 'https://www.legislation.gov.uk/ukpga/2015/15/contents',
  },
];

// The honest guardrail note on Magna Carta — surfaced in the UI so no one repeats the losing move.
export function magnaCartaReality() {
  return {
    instrument: 'Magna Carta (1297), 1297 c. 9 (25 Edw 1) — NOT the 1215 charter, which was annulled and is not statute',
    inForce: ['chapter I (freedom of the Church)', 'chapter IX (City of London liberties)', 'chapter XXIX (due process / access to justice) = 1215 clauses 39 + 40'],
    theWinningUse:
      'The constitutional right of access to justice — Magna Carta’s living descendant — which has ' +
      'actually won: Raymond v Honey [1983] 1 AC 1, and R (UNISON) v Lord Chancellor [2017] UKSC 51 ' +
      'where the Supreme Court quashed tribunal fees, tracing the right to chapter 29.',
    theLosingUse:
      'Citing clause 61 ("lawful rebellion"), claiming you "do not consent to statute", or reciting the ' +
      '1215 Latin as a defence. Real courts reject it and it can get you penalised — Samede [2012] ' +
      'EWCA Civ 160 ("a concept unknown to the law"), Kofa [2024] EWHC 685 (Admin), AVI v MHVB 2020 ' +
      'ABQB 489. A salon owner who tried clause 61 to dodge lockdown law was fined ~£17,000.',
    source: 'https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/section/XXIX',
  };
}

// Every entry, flattened, for search/verification. A citation with no source is a bug, not a case.
export function allPrecedents() {
  return [
    ...ACCESS_TO_JUSTICE.map(c => ({ ...c, tier: 'access-to-justice' })),
    ...CONSUMER_CASES.map(c => ({ ...c, tier: 'consumer' })),
    ...LOSING_USES.map(c => ({ ...c, tier: 'losing-use' })),
  ];
}

export default { ACCESS_TO_JUSTICE, CONSUMER_CASES, LOSING_USES, STATUTORY_WEAVES, magnaCartaReality, allPrecedents };
