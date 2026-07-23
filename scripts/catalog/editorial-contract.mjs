// Phase F — validateur du contrat éditorial (docs/editorial-contract.md).
// Réutilisable : garde automatique du pipeline (accepte/rejette un editorial_drafts avant staging).
// Aucun réseau, déterministe.
const REQUIRED = ["short_description", "long_description", "verdict", "pros", "cons", "use_cases",
  "covers", "relevant_for", "personas", "functional_needs", "verticals",
  "solo_relevance", "team_relevance", "ai_angle", "seo", "pricing_guidance"];
const MIN = { short_description: 40, long_description: 120 };
const PLACEHOLDER = /\b(lorem ipsum|todo|tbd|placeholder|xxx|à compléter|à rédiger)\b/i;
// Montant/devise/quota tarifaire : interdit dans la prose ET pricing_guidance.
// Frontière de mot sur les codes devise : évite « moteur 3D » (mot-EUR-3) faussement pris pour un prix.
const MONEY = /(?:€|\$|£|\b(?:USD|EUR|GBP))\s?\d|\d[\d.,]*\s?(?:€|\$|£|\b(?:USD|EUR|GBP)\b|\/mo\b|\/mois\b|\/yr\b|\/an\b|%)/i;
const PRICE_KEYS = /native_amount|compare_price_monthly|native_currency|normalized_monthly/i;

const isEmpty = (v) => v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

/** Valide un objet editorial_drafts complet. Retourne { ok, errors[] }. */
export function validateEditorial(drafts, { slug = "?" } = {}) {
  const e = [];
  if (!drafts) return { ok: false, errors: [`${slug}: editorial_drafts absent`] };
  if (drafts.author == null || drafts.author === "") e.push("author requis");
  if (drafts.status !== "draft") e.push(`status doit être 'draft' (reçu ${drafts.status})`);
  for (const lang of ["fr", "en"]) {
    const d = drafts[lang];
    if (!d) { e.push(`langue ${lang} absente`); continue; }
    if (d.reviewed_by) e.push(`${lang}.reviewed_by ne doit pas être présent avant revue`);
    for (const k of REQUIRED) if (isEmpty(d[k])) e.push(`${lang}.${k} manquant/vide`);
    for (const [k, min] of Object.entries(MIN)) if (typeof d[k] === "string" && d[k].trim().length < min) e.push(`${lang}.${k} trop court (<${min})`);
    if (d.verdict && (isEmpty(d.verdict.keepIf) || isEmpty(d.verdict.avoidIf) || !d.verdict.threshold)) e.push(`${lang}.verdict incomplet (keepIf/avoidIf/threshold)`);
    for (const arr of ["pros", "cons", "use_cases"]) if (Array.isArray(d[arr]) && d[arr].length < 3) e.push(`${lang}.${arr} < 3 éléments`);
    // Prose : aucun montant/devise, aucun placeholder.
    const prose = [d.short_description, d.long_description, ...(d.pros || []), ...(d.cons || []),
      ...(d.use_cases || []), d.verdict?.threshold, ...(d.verdict?.keepIf || []), ...(d.verdict?.avoidIf || [])]
      .filter((x) => typeof x === "string").join("  ");
    if (PLACEHOLDER.test(prose)) e.push(`${lang}: chaîne placeholder détectée`);
    if (MONEY.test(prose)) e.push(`${lang}: montant/devise dans la prose (interdit)`);
    // pricing_guidance : aucun fait tarifaire faisant autorité.
    const g = JSON.stringify(d.pricing_guidance ?? {});
    if (PRICE_KEYS.test(g)) e.push(`${lang}: clé de fait tarifaire dans pricing_guidance`);
    if (MONEY.test(g)) e.push(`${lang}: montant/devise dans pricing_guidance`);
  }
  return { ok: e.length === 0, errors: e };
}
