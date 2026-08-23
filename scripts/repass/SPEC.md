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

## CAS PARTICULIER — plugins, librairies et serveurs MCP

Une fiche rattachée à un logiciel hôte (`host_app` renseigné) ne se rédige pas comme une fiche d'outil autonome. Un plugin After Effects à 40 € n'a aucun sens sans les ~300 €/an d'After Effects derrière : le lecteur ne choisit pas entre ce plugin et un autre outil, il choisit de l'ajouter ou non à un logiciel qu'il possède déjà.

**Le verdict répond à « faut-il l'ajouter à X ? », jamais à « est-ce un bon outil ? »**
- `keepIf` : « Vous utilisez déjà After Effects et vous animez des logos chaque semaine. »
- `avoidIf` : « Vous n'avez pas After Effects — le plugin ne s'utilise pas seul. »
- `threshold` : formule l'arbitrage par rapport à l'hôte, pas par rapport au marché.

**Ne jamais reprendre la tarification de l'hôte** dans `facts.plans`. On y met le prix du plugin seul. Le coût de l'hôte se mentionne en prose, sans chiffre : « suppose une licence After Effects active ».

**Nommer l'hôte explicitement** dans `facts.what` et `facts.what_en`. Une fiche plugin qui ne dit pas dans quoi elle s'exécute est inutilisable.

**Ne pas comparer un plugin à un logiciel autonome** dans les `cons`. Reprocher à Bodymovin de ne pas faire de montage vidéo n'a pas de sens.

**Règle du produit autonome** : si l'outil s'utilise SEUL et sait *aussi* se brancher dans un logiciel (Luminar Neo, Nik Collection, Topaz Gigapixel), ce n'est **pas** un plugin. Il se rédige comme un outil normal, et la compatibilité se mentionne en prose. Signale-le en `flagged` plutôt que de le traiter en plugin.

**Librairies et serveurs MCP** suivent la même logique : le verdict porte sur l'ajout à une base de code ou à un assistant existant, pas sur une valeur absolue.

## Sortie (ton message final)
Rends un récap : `filled: [slugs remplis]`, `flagged: [{slug, raison}]`. Rien d'autre.
