// Limites anti-boucle de la factory. État borné par lot dans research/batches/<id>.loops.json
// (séparé de la machine d'états, jamais destructif). Règles :
//   - max 1 génération éditoriale complète par langue ;
//   - max 1 correction automatique ;
//   - après 2 échecs IDENTIQUES (même signature) : blocked, sans nouvelle relance ;
//   - pas d'audits narratifs répétés (les rapports compacts sont idempotents par construction).
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const loopPath = (batchId) => path.join(ROOT, "research", "batches", `${batchId}.loops.json`);

export const MAX_EDITORIAL_PER_LANG = 1;
export const MAX_AUTOFIX = 1;
export const MAX_IDENTICAL_FAILURES = 2;

/** Signature stable d'un échec (message normalisé) : deux échecs "identiques" partagent la signature. */
export function failureSignature(message) {
  const norm = String(message).toLowerCase().replace(/[0-9a-f]{16,}/g, "#").replace(/\s+/g, " ").trim();
  return createHash("sha256").update(norm).digest("hex").slice(0, 16);
}

function load(batchId) {
  if (!existsSync(loopPath(batchId))) return {};
  return JSON.parse(readFileSync(loopPath(batchId), "utf8"));
}
function save(batchId, state) {
  mkdirSync(path.dirname(loopPath(batchId)), { recursive: true });
  const tmp = `${loopPath(batchId)}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  renameSync(tmp, loopPath(batchId));
}
const slot = (state, slug) => (state[slug] ??= { editorial: {}, autofix: 0, failures: {} });

/** Peut-on (encore) générer l'éditorial pour cette langue ? Incrémente le compteur si autorisé. */
export function tryEditorial(batchId, slug, lang) {
  const state = load(batchId); const s = slot(state, slug);
  if ((s.editorial[lang] || 0) >= MAX_EDITORIAL_PER_LANG) return { allowed: false, reason: `génération ${lang} déjà effectuée` };
  s.editorial[lang] = (s.editorial[lang] || 0) + 1; save(batchId, state);
  return { allowed: true };
}

/** Peut-on (encore) tenter une correction automatique ? Incrémente si autorisé. */
export function tryAutofix(batchId, slug) {
  const state = load(batchId); const s = slot(state, slug);
  if (s.autofix >= MAX_AUTOFIX) return { allowed: false, reason: "correction automatique déjà tentée" };
  s.autofix += 1; save(batchId, state);
  return { allowed: true };
}

/** Enregistre un échec. Renvoie block:true dès que la MÊME signature atteint MAX_IDENTICAL_FAILURES. */
export function registerFailure(batchId, slug, message) {
  const sig = failureSignature(message);
  const state = load(batchId); const s = slot(state, slug);
  s.failures[sig] = (s.failures[sig] || 0) + 1; save(batchId, state);
  return { signature: sig, count: s.failures[sig], block: s.failures[sig] >= MAX_IDENTICAL_FAILURES };
}

export function loopState(batchId, slug) {
  const s = load(batchId)[slug];
  return s || { editorial: {}, autofix: 0, failures: {} };
}
export { loopPath };
