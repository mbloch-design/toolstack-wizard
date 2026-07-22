// Matrice éditoriale STRUCTURÉE et COMPACTE — état intermédiaire avant génération FR/EN.
// Objectif token : Claude reçoit/produit cette matrice une fois, puis la prose finale est générée
// une seule fois depuis elle. AUCUN montant/devise dans la matrice — les faits tarifaires restent
// exclusivement dans les observations structurées.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const MONEY = /(?:[$€£]\s?\d|\d[\d.,]*\s?(?:€|\$|£|USD|EUR|GBP|\/\s?mo|\/\s?mois|par mois))/i;
const dossierPath = (slug) => path.join(ROOT, "research", "tool-pages", `${slug}.json`);

export const MATRIX_FIELDS = Object.freeze([
  "positioning", "best_for", "strengths", "limits", "use_cases",
  "avoid_if", "ai_stance", "pricing_model", "deployment", "sources",
]);

/** Dérive une matrice compacte depuis un dossier research (langue de travail par défaut : fr). */
export function buildMatrix(slug, lang = "fr") {
  if (!existsSync(dossierPath(slug))) throw new Error(`dossier absent: ${slug}`);
  const doc = JSON.parse(readFileSync(dossierPath(slug), "utf8"));
  const d = doc.editorial_drafts?.[lang] || {};
  const c = doc.collector || {};
  const obs = c.observations || [];
  // pricing_model : forme SANS montants (unité + engagement + existence d'un palier gratuit).
  const units = [...new Set(obs.map((o) => o.pricing_unit).filter(Boolean))];
  const commits = [...new Set(obs.map((o) => o.billing_commitment).filter(Boolean))];
  const hasFree = obs.some((o) => Number(o.native_amount) === 0);
  const sources = (c.sources || []).filter((s) => s.is_official).map((s) => s.url);
  return {
    slug,
    positioning: d.short_description || "",
    best_for: d.relevant_for || d.personas || [],
    strengths: d.pros || [],
    limits: d.cons || [],
    use_cases: d.use_cases || [],
    avoid_if: d.verdict?.avoidIf || [],
    ai_stance: d.ai_angle || "",
    pricing_model: { unit: units, billing_commitment: commits, free_tier: hasFree },
    deployment: deriveDeployment(doc),
    sources,
  };
}

function deriveDeployment(doc) {
  const hay = JSON.stringify(doc.claims || doc.collector?.claims || []).toLowerCase();
  const modes = [];
  if (/self-?host|on-?prem|open source|docker/.test(hay)) modes.push("self_hosted");
  if (/cloud|saas|hosted|web app/.test(hay)) modes.push("cloud");
  return modes.length ? modes : ["cloud"];
}

/** Valide la matrice : champs présents, AUCUN montant/devise nulle part. */
export function validateMatrix(m) {
  const e = [];
  for (const f of MATRIX_FIELDS) if (m[f] == null) e.push(`champ manquant: ${f}`);
  const flat = JSON.stringify({ ...m, pricing_model: { ...m.pricing_model, unit: undefined, billing_commitment: undefined } });
  const hit = flat.match(MONEY);
  if (hit) e.push(`montant/devise dans la matrice (interdit): ${hit[0]}`);
  return { ok: e.length === 0, errors: e };
}
