# falljustice · design note

> Spec: **falljustice-spec-v1**. The engineering + scope contract of the Clause-40 engine.

## What it is

A fork of `falllegal` (solicitor tool) repurposed for laypeople: an offline, single-file self-help
tool that drafts a Letter Before Action on the correct modern statute, with an encrypted evidence
vault. `falllegal` stays intact for SRA-regulated firms; this is a separate audience and product.

## Surface

- `lba.mjs` — the Letter Before Action engine. `assembleLBA(facts)`, `detectPseudoLaw(text)`,
  `smallClaimsBand(amount)`, `CLAIM_TYPES`, `SCOPE_NOTICE`. Pure, zero-dep, importable.
- `evidence.mjs` — the Evidentiary Vault. `sha256Hex`, `makeExhibit`, `buildBundle`, `bundleIndex`,
  `EvidenceVault` (wraps an injected konomium Vault). Content-addressed, chronological, encrypted.
- `vault.mjs` / `idb-adapter.mjs` — reused verbatim from konomium-vault (AES-GCM 256, proven).
- `index.html` — the browser canvas wiring the above + an optional local-cascade prose helper.

## Invariants

1. **Verified law only.** Statute citations are hand-authored in `CLAIM_TYPES`; no model sources law.
2. **Pseudo-law refused.** `detectPseudoLaw` blocks sovereign-citizen / Freeman content; `assembleLBA`
   rejects flagged input before assembling.
3. **Honest scope.** Every letter carries `SCOPE_NOTICE`: self-help draft, not legal advice, no
   guarantee, review before sending.
4. **Encrypted at rest.** Exhibits + letters are AES-GCM-256 via the vault; local + user-initiated
   deletion only; no cloud.
5. **Deterministic engine.** Same facts → same letter; hashing + bundle ordering are deterministic.
6. **Individual use.** No mass-filing / bombardment coordination.

## Legal grounding (hand-verified)

- Faulty goods → Consumer Rights Act 2015 ss.9, 11, 23, 24.
- Poor service → Consumer Rights Act 2015 ss.49, 52, 55, 56.
- Distance purchase → Consumer Contracts (Information, Cancellation and Additional Charges)
  Regulations 2013, regs 29, 34.
- Data misuse → UK GDPR Art.5, Data Protection Act 2018; ICO complaint route.
- Process → Practice Direction on Pre-Action Conduct and Protocols; small claims track ≤ £10,000 via
  Money Claim Online. Debt-from-individual uses the Pre-Action Protocol for Debt Claims 2017 (noted).

## Verification

`npm test` — `test-lba.mjs` (correct statute per claim type, guardrail refuses pseudo-law, scope
notice present, markup stripped) + `test-evidence.mjs` (real SHA-256, chronological bundle,
ciphertext-at-rest, content-address dedupe). CI runs it on every push.

## Roadmap (logged, not built)

- **DSAR module** — UK GDPR Art.15 Data Subject Access Request builder + 1-month deadline tracker.
- **Swarm precedent (WebRTC mesh)** — nodes share anonymised winning arguments/templates P2P over
  konomium-vault's `sync.mjs`. Individual, opt-in, no personal-data sharing.
