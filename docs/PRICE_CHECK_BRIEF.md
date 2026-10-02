# Brief : vérification manuelle des prix retenus

Pour les dossiers `research/dossiers/<slug>.json` au statut `needs_review` que
`scripts/research/merge.mjs` retient : champ `hold`, ou « compared price has
no official source ». Le but est de les rendre publiables avec un prix tiré de
la **page officielle de l'éditeur**, ou de dire précisément pourquoi ce n'est
pas possible.

## Pour chaque slug

1. Lis le dossier : `hold`, `reviewNotes`, `conflicts`, `unknowns`,
   `pricing`, `sources`. Ce sont les doutes à lever.
2. Ouvre la page tarifs officielle (WebFetch ; si elle est rendue en JS ou
   bloquée, essaie l'URL régionale `/en-us/`, la page d'aide officielle des
   tarifs, ou la fiche App Store / Mac App Store de l'éditeur, qui comptent
   comme officielles). Un agrégateur, un blog ou un revendeur ne compte pas.
3. Corrige `pricing` selon la section 5 de `docs/CLOUD_RESEARCH_BRIEF.md`
   (modèle, `monthly` contre `annualPerMonth`, promo dans `promoPrice`,
   `comparePlanKey` règle 5.4). Ajoute ou mets à jour la source dans
   `sources` (tier 1, URL, `checkedOn` = date du jour) et relie les plans
   par `sourceIds`.
4. Si des montants changent, mets à jour **tous les textes qui les citent** :
   `editorial` (longDescription, verdict.threshold, billingTraps), preuves de
   `rating`, `cautions`, en anglais et en français.
5. Doute levé : supprime `hold`, vide les `reviewNotes` résolues, ajoute
   `priceCheckedOn` = date du jour. Doute non levé (page inaccessible, prix
   introuvable, produit arrêté) : garde ou écris un `hold` précis, sans
   inventer de montant.

## Devise (règle de Michael, 02/10/2026)

Jamais de conversion. Le dollar d'abord :

- l'éditeur publie en dollars : `pricing.currency` = USD, même si la page
  s'est d'abord affichée en euros par géolocalisation. Cherche la grille US :
  sélecteur de devise ou de pays, URL `/en-us/` ou `?currency=USD`,
  `?country=US`, page d'aide officielle des tarifs ;
- l'éditeur publie **aussi** des euros : garde la grille euros dans
  `pricing.secondaryPrices` = `{ currency: "EUR", pricingUrl, verifiedOn,
  sourceIds, plans: { <clé du plan>: { monthly, annualPerMonth, oneTime } } }`,
  mêmes clés de plan que `pricing.plans`, montants lus sur la page ;
- l'éditeur ne publie qu'en euros : `pricing.currency` = EUR.

La page anglaise affichera les dollars, la page française les euros quand ils
existent, sinon la seule devise de l'éditeur. Les textes (editorial, verdict,
rating) citent les montants de `pricing.plans` (dollars) en anglais ; en
français, ils citent les euros de `secondaryPrices` s'il y en a.

## Règles

- Seul un montant lu sur une page officielle ce jour entre dans le dossier.
  Ta mémoire n'est pas une source.
- Jamais de tiret cadratin. Vrai français. Pas de sous-agents.
- Ne touche qu'aux fichiers `research/dossiers/<slug>.json` demandés, ne
  commite rien.
- Termine par `node scripts/research/validate.mjs <slugs>` sans erreur, puis
  `node scripts/research/merge.mjs <slugs>` (simulation) pour vérifier
  qu'aucun n'est plus retenu sauf `hold` assumé.

## Compte rendu (5 lignes max)

Slugs débloqués, slugs encore bloqués avec la raison (et l'URL qui bloque,
pour une vérification dans un navigateur).
