# Usine catalogue ToolTrim — runbook

Traiter un ou plusieurs outils jusqu'au canonical, en autonomie et sous filet d'invariants.
Modèle métier figé ; aucune écriture Supabase hors du moteur ; aucun prix/taux/unité inventé.

## Pré-requis par outil (une fois)
1. **Registre** `research/sources-registry.json` : bloc `<slug>` avec `pricing_url` (page tarifaire
   officielle), `renderer_hint`, `market_context_declared` (ou `null` pour un candidat/prouvé FR),
   `plan_key_mapping`, et des `additional_sources` établissant `pricing.unit` /
   `pricing.billing_commitment` / `pricing.free_plan_exists` avec des `proof_pattern` **réellement vus**.
2. **Profil de staging** `scripts/research-stage-profiles.mjs` : `planOrder`, `comparePlanKey`,
   `freePlanKey`, `locale`, `editorialSource: "research"`. Pour un outil **free-only** open source :
   `openSource: true` (une licence OSI — MIT/Apache/GPL/BSD… — doit être prouvée dans le dossier).
3. **Adaptateur** : `adapter: "generic"` d'abord (données structurées JSON-LD). Écrire un adaptateur
   dédié `research-adapters/<slug>.mjs` seulement si la page n'expose pas de données structurables
   (le générique le signale en ambiguïté). Un sous-agent peut l'écrire à faible coût.

## Collecte + éditorial
- Collecte : `node scripts/research-collector.mjs --slugs=<a,b> --market=FR --locale=fr-FR --renderer=auto --concurrency=2 --delay=2000`
  (robots respecté ; jamais `approved` ; devise native ; essai ≠ gratuit).
- Éditorial FR/EN : suivre `docs/editorial-contract.md`, de préférence via **sous-agent** (contexte
  isolé), écrit dans `research/tool-pages/<slug>.json` → `editorial_drafts`. Validé par
  `catalog/editorial-contract.mjs` (0 prix dans la prose/guidance, champs complets, `status:"draft"`).

## Lot
```bash
node scripts/catalog-batch.mjs prepare  --batch=<id> --slugs=a,b --market=FR --locale=fr-FR
node scripts/catalog-batch.mjs report   --batch=<id>          # tableau READY / REVIEW / BLOCKED
node scripts/catalog-batch.mjs dry-run   --batch=<id>          # transaction prod, rollback
node scripts/catalog-batch.mjs apply     --batch=<id> --actor="ToolTrim — Mike"
node scripts/catalog-batch.mjs rollback  --batch=<id> --slugs=a --actor="ToolTrim — Mike"
node scripts/catalog-batch.mjs verify    [--canonical=<n>]
```
- `prepare` valide les profils **avant réseau**, reprend (dossier présent = pas de re-collecte),
  garde éditoriale + garde free-only-open-source, gate par outil.
- `apply` **auto-signe** l'attestation `reference_fr` requise (marché candidat ou prouvé), applique
  via le moteur générique (transaction + verrou par outil, publication FR/EN → canonical en fin,
  approbation des seules observations **éligibles** — un prix payant sans engagement reste `needs_review`),
  puis **vérifie les invariants** (1126 outils / 2252 lignes, 2 lignes/outil, aucun outil hors-lot modifié,
  `catalog_private` inaccessible à anon/authenticated). Erreurs **isolées par outil**. 2ᵉ passage = no-op.

## Garde-fous automatiques
- Éditorial non conforme, free-only non-OSI, ou attestation `reference_fr` sans basis forte ⇒ **BLOCKED**.
- Aucun prix/devise/taux/unité inventé ; conversion EUR interdite sans taux+date+méthode (l'identité
  EUR `native_eur_identity` n'est PAS une conversion).
- Rollback ordinaire : `data_contract` canonical → legacy, ledger conservé, aucun autre outil touché.

## Git
`git status` d'abord ; **jamais** `git add -A` ; stage **explicite** des seuls fichiers de la mission ;
préserver toute modification sans rapport ; commit conventionnel ; push après validations.
