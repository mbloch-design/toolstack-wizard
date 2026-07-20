# Wix — pilote canonique de données réelles

Date : 2026-07-20. Statut : **appliqué et validé sur Wix uniquement**.

## Résultat public

- `data_contract='canonical'` pour Wix ; les 1 125 autres outils restent en `legacy`.
- Plan gratuit durable, puis quatre plans payants observés sur la page officielle Wix en contexte FR/fr-FR.
- Prix mensuels natifs TTC sous abonnement annuel payé d'avance : Light 16,80 €, Essentiel 30 €, Business 40,80 €, Business Plus 178,80 €.
- Unité : un abonnement par site.
- Source publique : `https://www.wix.com/premium-purchase-plan/dynamo`.
- Première observation et dernière confirmation : 2026-07-17.

## Actes de revue

- Attestation de contexte active : `ToolTrim — Mike`, `reference_fr`.
- 4 événements `observation_approved`, un par observation tarifaire.
- 4 événements `localization_approved`, un par libellé de plan FR.
- Les contenus éditoriaux FR/EN importés en draft ont été comparés champ par champ au contenu public existant avant publication : aucune divergence.
- L'incident d'attestation de test reste conservé et révoqué dans le ledger.

## Exécution

Le script `npm run pilot:wix` est rollback-only par défaut. L'application réelle exige `npm run pilot:wix -- --apply`, prend un verrou transactionnel dédié, vérifie les montants, le contexte, l'attestation, les contenus FR/EN et la cardinalité avant le commit. Un rejeu après application est idempotent.

## Validation

- Data API : 1 126 outils, 2 252 lignes localisées.
- Un seul outil canonical : Wix, soit exactement deux lignes FR/EN.
- `catalog_private` demeure inaccessible à `anon` et `authenticated`.
- Shadow read : zéro divergence sur 40 champs.
- Canari Fiche : 22/22, dont fiche Wix et sous-page Prix SSR.
- Suite RESEARCH : 164/164.
- Build production et TypeScript : verts.
