/**
 * Adaptateur Wix — SÉPARÉ du moteur générique (v0.3).
 *
 * Raison d'être : sur wix.com, les noms de plans ne sont PAS dans des titres
 * h1-h4 ; le moteur générique (association par titre) attribuait donc le même
 * `plan_name` erroné à tous les montants. Wix expose en revanche des `data-hook`
 * sémantiques stables, qu'on exploite ici via le DOM.
 *
 *   [data-hook="price-container"]                 -> une carte de prix
 *     [data-hook="display-price-currency-symbol"] -> €
 *     [data-hook="display-price-integer-price"]   -> 16
 *     [data-hook="display-price-fraction-price"]  -> 80
 *     [data-hook="display-price-cycle-label"]     -> /mois
 *     [data-hook="tax-note"]                      -> « Le prix comprend la TVA »
 *
 * Invariants :
 *  - correspondance plan<->prix UNIVOQUE, sinon `weak_claim` (jamais d'observation) ;
 *  - la page rend la grille DEUX fois (cartes + tableau comparatif) => déduplication
 *    stricte par (plan_name, amount, currency, period) ;
 *  - `pricing_unit` n'est JAMAIS déduite ici : la page ne prouve pas « par site »
 *    (« collaborateurs sur le site » ne l'établit pas) => reste null + unknown ;
 *  - aucun `approved` : l'adaptateur ne produit que des candidats `observed`.
 */

import { JSDOM } from "jsdom";

const CUR = { "€": "EUR", $: "USD", "£": "GBP" };
const txt = (n) => (n?.textContent || "").replace(/\s+/g, " ").trim();

function periodOf(label) {
  const l = (label || "").toLowerCase();
  if (/\/\s*(mois|month|mo)\b/.test(l) || /^\s*\/?\s*mois\s*$/.test(l)) return "monthly";
  if (/\/\s*(an|year|yr)\b/.test(l)) return "annual";
  return null;
}

/** Remonte au plus grand ancêtre ne contenant QU'UN SEUL price-container : la carte. */
function cardOf(priceContainer) {
  let el = priceContainer;
  while (el.parentElement && el.parentElement.querySelectorAll('[data-hook="price-container"]').length === 1) {
    el = el.parentElement;
  }
  return el;
}

/**
 * Nom de plan = premier texte court situé AVANT le prix dans la carte,
 * en EXCLUANT les badges de carte (« Recommandé »…), qui précèdent le nom réel.
 * Sur la page live, ce badge vit dans [data-hook="card-hat-container"] /
 * [data-hook="product-hat"] : sans cette exclusion, « Business » devenait
 * « Recommandé » (piège reproduit dans la fixture).
 */
const BADGE_SELECTOR = '[data-hook="card-hat-container"], [data-hook="product-hat"], [data-hook*="hat"]';
function planNameOf(card, priceContainer) {
  const candidates = [...card.querySelectorAll("span, h1, h2, h3, h4")]
    .filter((n) => n.children.length === 0)
    .filter((n) => !n.closest(BADGE_SELECTOR))                     // jamais un badge
    .filter((n) => priceContainer.compareDocumentPosition(n) & 2 /* PRECEDING */)
    .map((n) => txt(n))
    .filter((t) => t && t.length <= 40 && !/^€|^\$|^\d+$/.test(t));
  return candidates[0] || null;
}

export function extractWix({ html, url }) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const pageText = (doc.body?.textContent || "").replace(/\s+/g, " ");

  // Engagement : prouvé par la page (mention explicite), sinon null.
  // v0.3.1 — seul le PAIEMENT INTÉGRAL prouve annual_prepaid.
  // « abonnements annuels, réglés en totalité au moment de l'achat » (Wix) => preuve valide.
  // « facturé annuellement » SEUL => ambigu => null.
  const annual_prepaid_proof = /r[ée]gl[ée]s?\s+en\s+totalit[ée]|pay[ée]s?\s+en\s+totalit[ée]|paid\s+in\s+full/i.test(pageText);
  const annual_billed_weak = /factur[ée]s?\s+annuellement|billed\s+annually/i.test(pageText);
  const monthly = /factur[ée]s?\s+mensuellement|paiement\s+mensuel/i.test(pageText);
  const billing_commitment =
      annual_prepaid_proof && !monthly ? "annual_prepaid"
    : monthly && !annual_prepaid_proof && !annual_billed_weak ? "monthly"
    : null;
  const annual = annual_prepaid_proof;

  const containers = [...doc.querySelectorAll('[data-hook="price-container"]')];
  const raw = [], ambiguities = [];

  for (const pc of containers) {
    const card = cardOf(pc);
    const inCard = card.querySelectorAll('[data-hook="price-container"]').length;
    const plan_name = planNameOf(card, pc);
    const sym = txt(pc.querySelector('[data-hook="display-price-currency-symbol"]'));
    const int = txt(pc.querySelector('[data-hook="display-price-integer-price"]'));
    const frac = txt(pc.querySelector('[data-hook="display-price-fraction-price"]'));
    const cycle = txt(pc.querySelector('[data-hook="display-price-cycle-label"]'));
    const taxNote = txt(card.querySelector('[data-hook="tax-note"]'));

    const amount = int ? Number(int + (frac ? "." + frac : "")) : NaN;
    const currency = CUR[sym] || null;
    const period = periodOf(cycle);
    const evidence_excerpt = txt(card).slice(0, 200);
    const evidence_selector = '[data-hook="price-container"]';

    // Rule 5 : correspondance plan<->prix UNIVOQUE, sinon weak_claim.
    const problems = [];
    if (inCard !== 1) problems.push(`correspondance plan<->prix non univoque (${inCard} prix dans la carte)`);
    if (!plan_name) problems.push("plan_name introuvable dans la carte");
    if (!Number.isFinite(amount)) problems.push("montant illisible");
    if (!currency) problems.push("devise illisible");
    if (!period) problems.push("période illisible");
    if (!billing_commitment) problems.push("billing_commitment non prouvé par la page");

    const base = {
      plan_name, seat_type: null, native_amount: Number.isFinite(amount) ? amount : null,
      native_currency: currency, billing_period: period, billing_commitment,
      // L'unité n'est JAMAIS déduite : la page ne l'établit pas.
      pricing_unit: null,
      tax_inclusion: /TVA/i.test(taxNote) ? "ttc" : "unknown",
      evidence_excerpt, evidence_selector, tax_evidence: taxNote || null,
    };
    if (problems.length) ambiguities.push({ ...base, status: "weak_claim", confidence: "low", missing: problems,
                                            reason: `non promu : ${problems.join(", ")}` });
    else raw.push(base);
  }

  // Déduplication stricte (la grille est rendue 2x : cartes + tableau comparatif).
  const seen = new Map();
  for (const p of raw) {
    const k = `${p.plan_name}|${p.native_amount}|${p.native_currency}|${p.billing_period}`;
    if (!seen.has(k)) seen.set(k, p);
  }
  const plans = [...seen.values()];

  return {
    adapter: "wix", adapter_version: "0.3.0",
    plans, ambiguities,
    page_proof: { billing_commitment, annual_prepaid_proof, annual_billed_weak, commitment_monthly_marker: monthly,
                  price_containers_found: containers.length, deduped_to: plans.length },
    unknowns: [
      ...(billing_commitment ? [] : ["billing_commitment non prouvé par la page"]),
      "pricing_unit non prouvée par la page (« collaborateurs sur le site » n'établit pas une facturation par site) — à prouver via une source officielle liée à la même capture",
    ],
  };
}
