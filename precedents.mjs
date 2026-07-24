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
//   Only three clauses remain in force in England & Wales — clause 1 (part), clause 9 (City of London
//   liberties), and clause 29 of the 1297 statute (the reissued combination of 1215's clauses 39 and
//   40: due process + "to no one will we sell, deny or delay right or justice"). Magna Carta is almost
//   never the WINNING argument on its own today. What wins is its descendant: the constitutional right
//   of access to justice, which the courts DID uphold in the cases below. Quoting "clause 61 / lawful
//   rebellion" (stripped out in 1215) is the sovereign-citizen error — it loses. Use the real line.
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
      'unimpeded access to the courts. Subordinate rules (there, a Prison Rule) cannot override that ' +
      'right without express statutory authority.',
    magnaCarta: 'the access-to-justice principle (Magna Carta descendant)',
    whenToUse:
      'When someone in authority is physically or procedurally obstructing you from reaching a court.',
    source: 'https://www.casemine.com/judgement/uk/5a8ff8c960d03e7f57ecd6d2',
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
    inForce: ['clause 1 (part)', 'clause 9 (City of London liberties)', 'clause 29 (1297) = 1215 clauses 39 + 40'],
    theWinningUse:
      'The constitutional right of access to justice (see R (UNISON) v Lord Chancellor [2017] UKSC 51). ' +
      'That is Magna Carta’s living descendant and it has actually won in the Supreme Court.',
    theLosingUse:
      'Citing clause 61 ("lawful rebellion"), claiming you "do not consent to statute", or reciting the ' +
      '1215 Latin as a defence. Clause 61 was stripped out within months in 1215 and is not law. Courts ' +
      'reject this ("Freeman on the Land" / sovereign citizen) and it can get you penalised.',
    source: 'https://commonslibrary.parliament.uk/magna-carta-does-it-still-matter/',
  };
}

// Every entry, flattened, for search/verification. A citation with no source is a bug, not a case.
export function allPrecedents() {
  return [...ACCESS_TO_JUSTICE].map(c => ({ ...c, tier: 'access-to-justice' }));
}

export default { ACCESS_TO_JUSTICE, STATUTORY_WEAVES, magnaCartaReality, allPrecedents };
