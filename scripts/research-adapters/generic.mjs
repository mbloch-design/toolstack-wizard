// Adaptateur GÉNÉRIQUE (Phase D). Extrait plan_name + montant natif + devise + période
// sans code par outil, en essayant dans l'ordre : 1) données structurées (JSON-LD Offer/Product),
// 2) heuristique cartes/tableaux. `pricing_unit` et `billing_commitment` restent fournis par les
// additional_sources du registre (le collecteur les estampille). Aucun prix inventé : un pairage
// incertain devient une ambiguity (needs_review), jamais une observation.
//
// Contrat de sortie identique aux adaptateurs dédiés :
//   { adapter, adapter_version, plans[], ambiguities[], page_proof{}, unknowns[] }

const SYMBOL_CCY = { "$": "USD", "€": "EUR", "£": "GBP" };
const CODE_CCY = { USD: "USD", EUR: "EUR", GBP: "GBP", "US$": "USD" };

const textOf = (html) => String(html || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&euro;/gi, "€").replace(/&pound;/gi, "£")
  .replace(/\s+/g, " ").trim();

const num = (s) => Number(String(s).replace(/[,\s]/g, ""));
const periodOf = (unit) => /yr|year|an(?:née)?|annual|annuel/i.test(unit || "") ? "annual"
  : /mo|month|mois/i.test(unit || "") ? "monthly" : null;

/* ── Tier 1 : données structurées JSON-LD ─────────────────────────────────── */
function fromJsonLd(html) {
  const plans = [];
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const seen = new Set();
  const walk = (node, name) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, name));
    const t = [].concat(node["@type"] || []).map(String);
    const nm = node.name || name || null;
    const offers = node.offers ? [].concat(node.offers) : (t.some((x) => /Offer/i.test(x)) ? [node] : []);
    for (const off of offers) {
      const price = off.price ?? off.lowPrice ?? off.priceSpecification?.price;
      const ccy = off.priceCurrency ?? off.priceSpecification?.priceCurrency;
      if (price != null && ccy && CODE_CCY[String(ccy).toUpperCase()]) {
        const amount = num(price);
        const key = `${nm}|${amount}|${ccy}`;
        if (Number.isFinite(amount) && amount > 0 && nm && !seen.has(key)) {
          seen.add(key);
          plans.push({ plan_name: String(nm).trim(), native_amount: amount,
            native_currency: CODE_CCY[String(ccy).toUpperCase()],
            billing_period: periodOf(off.priceSpecification?.billingDuration || off.priceSpecification?.unitText || ""),
            evidence_excerpt: `JSON-LD Offer: ${nm} ${amount} ${ccy}`, evidence_selector: "jsonld:Offer" });
        }
      }
    }
    for (const [k, v] of Object.entries(node)) if (v && typeof v === "object") walk(v, /name/i.test(k) ? node.name : nm);
  };
  for (const b of blocks) { try { walk(JSON.parse(b), null); } catch { /* JSON-LD invalide ignoré */ } }
  return plans;
}

/* ── Groupe les offres JSON-LD par nom ; ne qualifie un PLAN que si le pairage
 *    est NON AMBIGU (1 devise, ≤2 montants = mensuel/annuel, nom propre). Sinon ambiguïté. */
function qualifyJsonLd(raw) {
  const byName = new Map();
  for (const o of raw) {
    const k = o.plan_name;
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(o);
  }
  const GENERIC = /^(plan|pricing|offer|subscription|abonnement|forfait)s?$/i;
  const plans = [], ambiguities = [];
  for (const [name, offers] of byName) {
    const ccys = new Set(offers.map((o) => o.native_currency));
    const amounts = new Set(offers.map((o) => o.native_amount));
    const clean = name && name.length >= 2 && name.length <= 30 && !GENERIC.test(name.trim());
    if (clean && ccys.size === 1 && amounts.size <= 2) {
      for (const o of offers) plans.push(o);   // 1 devise, ≤2 montants (mensuel/annuel) : sûr
    } else {
      ambiguities.push({ plan_name: name, reason: "données structurées ambiguës (plusieurs devises/montants ou nom générique)",
        missing: ["disambiguation"], evidence_excerpt: `${name}: ${[...ccys].join("/")} ${[...amounts].join(",")}` });
    }
  }
  return { plans, ambiguities };
}

/* ── Tier 2 : heuristique — SIGNAL seulement, jamais d'observation promue.
 *    Le pairage nom↔prix hors données structurées est trop peu fiable (noms tronqués,
 *    fausses associations) : on le rapporte en ambiguïté « adaptateur dédié recommandé ». */
function heuristicSignal(text) {
  const priceRe = /([$€£])\s*(\d[\d.,]*)\s*\/\s*(mo|month|mois|yr|year|an)\b/g;
  const found = new Set(); let p;
  while ((p = priceRe.exec(text))) { const a = num(p[2]); if (a > 0) found.add(`${SYMBOL_CCY[p[1]]}${a}/${p[3]}`); }
  return [...found].slice(0, 12).map((f) => ({ plan_name: null,
    reason: "prix détecté hors données structurées — adaptateur dédié recommandé (pairage non fiable)",
    missing: ["structured_data"], evidence_excerpt: f }));
}

const dedupe = (plans) => {
  const seen = new Set();
  return plans.filter((p) => { const k = `${p.plan_name}|${p.native_amount}|${p.native_currency}|${p.billing_period}`; if (seen.has(k)) return false; seen.add(k); return true; });
};

export function extractGeneric({ html }) {
  const text = textOf(html);
  const jsonldRaw = fromJsonLd(html);
  const q = qualifyJsonLd(jsonldRaw);
  let plans = q.plans;
  let ambiguities = q.ambiguities;
  let strategy = plans.length ? "structured_data" : "none";
  if (!plans.length) {
    // Aucune donnée structurée exploitable : SIGNAL heuristique (ambiguïtés), jamais d'observation.
    const sig = heuristicSignal(text);
    ambiguities = [...ambiguities, ...sig];
    if (sig.length) strategy = "heuristic_signal_only";
  }
  plans = dedupe(plans).map((p) => ({
    plan_name: p.plan_name, native_amount: p.native_amount, native_currency: p.native_currency,
    billing_period: p.billing_period, billing_commitment: null,   // fourni par additional_sources (registre)
    pricing_unit: null, tax_inclusion: null, seat_type: null,     // idem
    plan_summary: null, feature_highlights: [],
    evidence_excerpt: p.evidence_excerpt, evidence_selector: p.evidence_selector,
  }));
  const freeProven = /\b(free|gratuit)\b[^.]{0,40}\b(plan|forever|toujours|durable)\b|\$\s*0\s*\/\s*(?:mo|month)/i.test(text);
  return {
    adapter: "generic", adapter_version: "1.0.0",
    plans, ambiguities,
    page_proof: { extraction_strategy: strategy, plans_found: plans.length, jsonld_offers: jsonldRaw.length,
      free_plan_signal: freeProven },
    unknowns: [
      ...(plans.length ? [] : ["aucun plan extractible automatiquement (données structurées + heuristique) — needs_review"]),
      "billing_commitment/pricing_unit non extraits par l'adaptateur générique : à établir via additional_sources du registre",
    ],
  };
}
