# CLAUDE.md · falljustice

Instructions for any agent working in this repository. A **fork** of the solicitor tool `falllegal`,
repurposed for a different audience: ordinary people with no lawyer. `falllegal` (SRA-regulated firms)
is left intact on its own track — do not merge the two. See `SPEC.md`.

## What this is

The **Clause-40 engine**: turns a person's plain grievance into a procedurally-correct Letter Before
Action citing the correct MODERN statute, with an encrypted, hashed, chronological evidence vault.
Magna Carta Clause 40 ("to no one will we delay or deny justice") is the *spirit*; the modern
statutory API (Consumer Rights Act 2015, UK GDPR / DPA 2018, Pre-Action Protocols) is the *syntax*.

## Invariants you must preserve — these are load-bearing, not stylistic

1. **Not legal advice, not a solicitor.** Every generated document carries `SCOPE_NOTICE`. The tool
   assembles a self-help DRAFT the user reviews; it guarantees no outcome. Never add "legally
   binding", "flawless", "you will win", or any claim that it acts as a lawyer. That is unauthorised
   practice of law and it harms users.
2. **The law is hand-authored and verified — never model-sourced.** Statute citations live in
   `CLAIM_TYPES` and are written + checked by a human. No language model (local cascade or cloud) may
   ever be the source of a statute reference. A model inventing "CRA 2015 s.99" is the exact
   fabricated-statute failure this estate exists to reject. The cascade may only reshape the user's
   own prose into facts (`structureStory`), never the legal basis.
3. **The pseudo-law guardrail must bite.** `detectPseudoLaw` refuses sovereign-citizen /
   Freeman-on-the-Land content (Article 61, "lawful rebellion", strawman, UCC, "I do not consent to
   statute"). Those get real claims struck out. Never weaken or bypass it; `assembleLBA` must reject
   flagged input before building anything.
4. **Individual use, not a vexatious cannon.** This helps a person make one well-founded request or
   claim. Do not add features that coordinate mass identical filings or bombard a target — that reads
   as vexatious/abusive litigation.
5. **Local + encrypted.** Evidence and letters are AES-GCM-256 at rest (via the konomium-vault) keyed
   from the user's master seed. Deletion is local + user-initiated. No remote wipe, no cloud upload,
   no telemetry.
6. **Tests stay green and real.** `test-lba.mjs` / `test-evidence.mjs` import the real modules and
   assert the correct statute is cited and the guardrail refuses pseudo-law. A change that reddens
   `npm test` or removes a guardrail assertion does not ship.

## Run
```
npm test
```
CI runs `npm test` on every push. `lba.mjs` and `evidence.mjs` are the importable engine (SDK/API/npm
surface); `index.html` is the browser canvas.

## Seam
Consumer-facing. Plain-English legal help + honest scope only. Do NOT introduce the project's private internal taxonomy or notation. Do NOT reintroduce solicitor/SRA framing — that belongs
to `falllegal`, not here.
