# FallJustice · Clause 40

**Live:** [sjgant80-hub.github.io/falljustice](https://sjgant80-hub.github.io/falljustice/)

> *"To no one will we sell, to no one will we deny or delay right or justice."* — Magna Carta, 1215.

An offline, single-file tool that helps an ordinary person draft a **Letter Before Action** on the
**correct modern statute**, with an encrypted evidence vault. Your machine, your key, no cloud.

A fork of the solicitor tool `falllegal`, repurposed for people who can't afford £300/hour and just
want to write the right letter to a company that has wronged them.

## What it does

- **Letter Before Action engine** — pick your dispute (faulty goods, poor service, breach of
  contract, online cancellation, data misuse); it drafts a procedurally-correct letter citing the
  real statute (Consumer Rights Act 2015, UK GDPR / DPA 2018, Consumer Contracts Regs 2013) and
  following the Pre-Action Protocol, with a response deadline and a costs warning.
- **Evidence vault** — drop emails, screenshots, receipts; each is SHA-256 hashed and ordered into a
  numbered, chronological exhibit index (E1, E2…), encrypted at rest with AES-GCM 256.
- **Optional local assistant** — if a local model is connected, it reshapes your messy story into the
  form. It never sources the law.

## What it is NOT

- **Not legal advice, and not a solicitor.** It produces a draft you review. It guarantees nothing.
  For a complex or high-value dispute, see a solicitor or Citizens Advice (citizensadvice.org.uk).
- **Not a "sovereign citizen" tool.** It refuses Freeman-on-the-Land / Article-61 pseudo-law — that
  gets real claims struck out. It cites what a court actually enforces.

## Use

```
npm test          # verify the engine
```
Open `index.html` in a modern browser (Chrome/Edge 113+). Set a master seed, draft your letter, build
your evidence bundle, export an encrypted backup.

`lba.mjs` and `evidence.mjs` are the importable engine (SDK surface). Zero dependencies.
