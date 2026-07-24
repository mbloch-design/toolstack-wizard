# Repasse éditoriale sourcée — spec agent

Tu produis des fiches éditoriales SOURCÉES pour une liste d'outils SaaS (site ToolTrim, FR-first).

## Entrée
Ton bloc = un fichier JSON `scripts/repass/blocks/<nom>.json` : liste de `{slug, name, url}`. Traite CHAQUE outil.

## Pour chaque outil
1. **Recherche sourcée** (obligatoire, ne JAMAIS inventer) :
   - Cherche la page officielle (prix + description). Utilise WebSearch puis, si possible, WebFetch de la page tarifaire officielle.
   - **Contrôle fermeture** : si le site officiel affiche « winding down / shutting down / discontinued / sunset / service ended » ou redirige vers une page de fermeture → NE PAS remplir. Ajoute l'outil à ta liste `flagged` (raison: "fermé").
   - **Contrôle doublon** : si deux slugs du bloc sont clairement le même produit (ex. `adcreative` et `adcreative-ai`), remplis le plus « propre » et signale l'autre dans `flagged` (raison: "doublon de X").
   - Si le site ne répond pas / n'est pas un vrai produit → `flagged` (raison: "URL morte/pas un produit").
2. **Écris** `research/bundle-editorial/<slug>.json` au format ci-dessous.

## Format EXACT (copie la structure de `research/bundle-editorial/ableton-live.json`)
```json
{
  "slug": "<slug>",
  "author": "ToolTrim — Mike",
  "verified_on": "2026-07-24",
  "sources": [{ "label": "<libellé> (site officiel)", "url": "<url officielle>" }],
  "facts": {
    "what": "<description FR factuelle, 1-2 phrases>",
    "what_en": "<même description en anglais>",
    "pricing_model": "<modèle : gratuit / abonnement / licence…>",
    "free_tier": { "exists": true/false, "detail": "<détail>" },
    "plans": [{ "name": "<plan>", "price": "<prix — AUTORISÉ ICI>" }],
    "key_features": ["…", "…", "…", "…"]
  },
  "fr": {
    "verdict": { "keepIf": ["…","…","…"], "avoidIf": ["…","…","…"], "threshold": "<phrase de bascule>" },
    "pros": ["…","…","…","…"], "cons": ["…","…","…"],
    "use_cases": ["…","…","…"], "relevant_for": ["…","…","…"]
  },
  "en": {
    "verdict": { "keepIf": ["…","…","…"], "avoidIf": ["…","…","…"], "threshold": "…" },
    "pros": ["…","…","…","…"], "cons": ["…","…","…"], "use_cases": ["…","…","…"]
  }
}
```

## RÈGLES DURES
- **Les prix/€/$/% UNIQUEMENT dans `facts`** (plans, pricing_model, free_tier). **JAMAIS dans la prose** `fr`/`en` (verdict/pros/cons/use_cases). Pas de « 100 % », pas de « 9€/mois » dans la prose. Reformule (« entièrement », « payant »).
- `verified_on` = "2026-07-24".
- `facts.what` en FR, `facts.what_en` en anglais (les deux obligatoires).
- Ne rien inventer : si un prix est incertain, écris « montants sur la page officielle » plutôt qu'un chiffre inventé.
- **N'écris QUE** des fichiers `research/bundle-editorial/<slug>.json`. Ne touche à AUCUN autre fichier (surtout pas `research/what-en.json`, ni git). Ne commit/push pas.

## Sortie (ton message final)
Rends un récap : `filled: [slugs remplis]`, `flagged: [{slug, raison}]`. Rien d'autre.
