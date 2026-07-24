// ════════════════════════════════════════════════════════════════
// falljustice · evidence.mjs — the Evidentiary Vault (encrypted, hashed, chronological)
//
// In a dispute, the side with the best-organised evidence wins. This turns dropped files (emails,
// screenshots, receipts, photos) and typed notes into an immutable, content-addressed exhibit index:
//   • each exhibit is SHA-256 hashed on the way in (a tamper-evident fingerprint you can quote),
//   • exhibits are ordered chronologically and numbered E1, E2, E3… for a court bundle,
//   • everything is stored through the konomium-vault (AES-GCM 256 at rest) — the ledger of your case
//     is ciphertext on the disk, decryptable only with your master seed.
//
// The engine is storage-agnostic and pure where it can be: hashing + ordering + numbering are
// deterministic and testable without a browser; persistence goes through an injected vault.
// ════════════════════════════════════════════════════════════════

const subtle = globalThis.crypto?.subtle;

// SHA-256 of a string or byte array → lowercase hex. The content address / tamper fingerprint.
export async function sha256Hex(input) {
  if (!subtle) throw new Error('falljustice/evidence: Web Crypto (crypto.subtle) unavailable — needs a browser or Node >= 20');
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  const digest = new Uint8Array(await subtle.digest('SHA-256', bytes));
  return [...digest].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Build an exhibit record from raw input. `when` is an ISO date/datetime string (the date the event
// happened, NOT the date it was added) so the bundle sorts by the real timeline. `content` is the
// text/base64 payload used for the hash; `meta` carries filename, mime, note, source.
export async function makeExhibit({ when, title, content, mime, note, source } = {}) {
  const hash = await sha256Hex(content == null ? (title || '') : String(content));
  return {
    when: normaliseWhen(when),
    title: title || '(untitled)',
    mime: mime || 'text/plain',
    note: note || '',
    source: source || '',
    hash,
    size: content == null ? 0 : String(content).length,
    content,
  };
}

// Deterministically order + number a set of exhibits for a bundle. Chronological by `when`, ties
// broken by hash for stability. Returns exhibits tagged E1, E2, … — never mutates the input.
export function buildBundle(exhibits) {
  const sorted = [...exhibits].sort((a, b) => {
    const w = String(a.when || '').localeCompare(String(b.when || ''));
    return w !== 0 ? w : String(a.hash || '').localeCompare(String(b.hash || ''));
  });
  return sorted.map((e, i) => ({ ...e, exhibitNo: `E${i + 1}` }));
}

// A plain-text exhibit index for the court bundle / to paste under a Letter Before Action.
export function bundleIndex(bundle) {
  const rows = bundle.map(e =>
    `${e.exhibitNo}\t${e.when || '[date]'}\t${e.title}\tsha256:${(e.hash || '').slice(0, 16)}…`
  );
  return ['EXHIBIT INDEX', 'No.\tDate\tDescription\tFingerprint', ...rows].join('\n');
}

// ── the persistent, encrypted evidence store (wraps an injected konomium Vault) ──
// The vault is opened by the caller with the user's master seed. We only ever hand it exhibit
// records, which it encrypts before writing. Keys are non-sensitive (exhibit-<hash>).
export class EvidenceVault {
  constructor(vault) {
    if (!vault) throw new Error('EvidenceVault requires an opened konomium Vault');
    this.vault = vault;
  }

  async add(input) {
    const ex = await makeExhibit(input);
    await this.vault.put(`exhibit-${ex.hash}`, ex);   // content-addressed → identical files dedupe
    return ex;
  }

  async all() {
    const keys = (await this.vault.keys()).filter(k => k.startsWith('exhibit-'));
    const out = [];
    for (const k of keys) { const e = await this.vault.get(k); if (e) out.push(e); }
    return out;
  }

  async bundle() {
    return buildBundle(await this.all());
  }

  async remove(hash) {
    await this.vault.erase(`exhibit-${hash}`);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
// Coerce a user-supplied date to a sortable string. Accepts ISO (kept), UK dd/mm/yyyy (converted),
// or anything else (kept verbatim so nothing is lost — it just sorts lexically).
function normaliseWhen(when) {
  if (!when) return '';
  const s = String(when).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s;
  const uk = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
  if (uk) return `${uk[3]}-${uk[2].padStart(2, '0')}-${uk[1].padStart(2, '0')}`;
  return s;
}

export default EvidenceVault;
