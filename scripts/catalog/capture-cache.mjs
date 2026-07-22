// Cache de collecte ancré sur content_hash. Une capture inchangée n'est ni relue ni retraitée.
// Ne JAMAIS écraser l'historique/les conflits : ce cache stocke uniquement une empreinte de captures
// dans research/cache/<slug>.json (séparé du dossier research et du ledger).
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CACHE_DIR = path.join(ROOT, "research", "cache");
const dossierPath = (slug) => path.join(ROOT, "research", "tool-pages", `${slug}.json`);
const cachePath = (slug) => path.join(CACHE_DIR, `${slug}.json`);

/** Empreinte déterministe des content_hash de toutes les captures d'un dossier (triés). */
export function captureDigest(slug) {
  const doc = JSON.parse(readFileSync(dossierPath(slug), "utf8"));
  const hashes = (doc.collector?.sources || []).flatMap((s) => (s.captures || []).map((c) => c.content_hash))
    .filter(Boolean).sort();
  return { count: hashes.length, digest: createHash("sha256").update(hashes.join("|")).digest("hex") };
}

/** true si le dossier est identique à la dernière empreinte connue (=> aucun retraitement requis). */
export function isUnchanged(slug) {
  if (!existsSync(cachePath(slug))) return false;
  const prev = JSON.parse(readFileSync(cachePath(slug), "utf8"));
  return prev.digest === captureDigest(slug).digest;
}

/** Enregistre l'empreinte courante (n'écrase QUE le fichier de cache, jamais le dossier/ledger). */
export function recordDigest(slug) {
  mkdirSync(CACHE_DIR, { recursive: true });
  const d = captureDigest(slug);
  const tmp = `${cachePath(slug)}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify({ slug, ...d, recorded_at: new Date().toISOString() }, null, 2) + "\n");
  renameSync(tmp, cachePath(slug));
  return d;
}

/** No-op si inchangé : { noop:true }. Sinon enregistre et signale le retraitement. */
export function refreshIfChanged(slug) {
  if (isUnchanged(slug)) return { slug, noop: true };
  const d = recordDigest(slug);
  return { slug, noop: false, ...d };
}

/** Extraits STRICTEMENT nécessaires pour un sous-agent : {claim_key -> excerpt}, uniquement les clés demandées. */
export function excerptsFor(slug, claimKeys = []) {
  const doc = JSON.parse(readFileSync(dossierPath(slug), "utf8"));
  const want = new Set(claimKeys);
  const out = {};
  for (const o of doc.collector?.observations || []) {
    const ev = o.billing_commitment_evidence;
    if (ev && want.has(ev.claim_key) && !out[ev.claim_key]) out[ev.claim_key] = { excerpt: ev.excerpt, content_hash: ev.content_hash };
  }
  return out;
}
