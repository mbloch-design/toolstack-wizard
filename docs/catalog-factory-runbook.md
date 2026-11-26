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
node scripts/catalog-batch.mjs rollback  --batch=<id> --slugs=a --actor="ToolTrim — Mike"          # DRY-RUN (rollback, aucune persistance)
node scripts/catalog-batch.mjs rollback  --batch=<id> --slugs=a --actor="ToolTrim — Mike" --apply  # PERSISTE (canonical -> legacy)
node scripts/catalog-batch.mjs verify    [--canonical=<n>]
node scripts/catalog-batch.mjs reconcile --batch=<id>          # aligne l'état local sur Supabase (remote READ-ONLY)
```

> **⚠️ Rollback.** Par défaut, `rollback` est un **DRY-RUN** : il ouvre la transaction, vérifie le retour à legacy, puis **annule (rollback)** — rien n'est persisté. La bascule `canonical → legacy` n'est **écrite que si `--apply`** est passé. Vérifier le dry-run avant d'ajouter `--apply`. Le rollback ordinaire conserve sources/captures/événements (ledger) et ne touche aucun autre outil.
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

## Industrialisation (réduction tokens)

Principe : **les scripts exécutent, contrôlent et résument ; Claude tranche les ambiguïtés et rédige.**
Claude ne re-vérifie jamais à la main un invariant déjà validé par un script.

```bash
node scripts/catalog-batch.mjs canary  --batch=<id> --slugs=a,b --market=FR --locale=fr-FR  # collect→stage→work-order→dry-run, ARRÊT avant apply
node scripts/catalog-batch.mjs work-order --slug=<s>            # research/work-orders/<s>.json (dossier factuel compact, déterministe)
node scripts/catalog-batch.mjs report  --batch=<id> --report=compact   # JSON {slug,phase,status,blockers,tests,mutations,next_action}
node scripts/catalog-batch.mjs metrics --batch=<id>            # coût du lot (outils, sans-intervention, bloqués, appels agent, reprises, captures réutilisées…)
node scripts/catalog-batch.mjs assert-tool --slug=<s>          # assertions de publication READ-ONLY (plans, comparatif unique, obs approuvées, FR/EN, projection, canonical)
```

- **`canary`** enchaîne tout le pipeline SANS apply : idempotent (relançable), il s'arrête avant
  toute écriture canonical. `prepare` ne (re)stage que les états pré-décision (jamais un outil déjà
  décidé/canonical → pas de transition interdite).
- **Re-collecte propre** : `research-collector.mjs … --force-recheck --reset-observations` repart des
  faits vierges (observations/captures/attestations) sans accumuler ceux d'un contexte marché
  antérieur ; l'ÉDITORIAL humain (`editorial_drafts`) est **préservé** (aucun backup/restore manuel).

- **Work order** (`scripts/catalog/work-order.mjs`) : seul contexte transmis à un sous-agent — source
  officielle + captures (id/hash), claims, observations, profil, contrôles en échec, relations, décisions
  humaines. Ne recopie ni les anciens rapports ni l'historique. Sérialisation déterministe (même input ⇒ même WO).
- **Contrôles déterministes** (`scripts/catalog/controls.mjs`) : `localControls` (dossier) +
  `remoteControls` (Supabase read-only : relations publiées, fingerprint hors lot, projection).
  `failingControls` ne remonte **que les échecs** — l'arbitre ne voit rien d'autre.
- **Matrice éditoriale** (`scripts/catalog/editorial-matrix.mjs`) : état compact structuré
  (positioning/best_for/strengths/limits/use_cases/avoid_if/ai_stance/pricing_model **sans montants**/
  deployment/sources) généré **une fois** avant la prose FR/EN. Les faits tarifaires restent dans les observations.
- **Cache de collecte** (`scripts/catalog/capture-cache.mjs`) : ancré sur `content_hash`. Capture inchangée ⇒
  `{ noop:true }`, aucun retraitement. `excerptsFor` ne fournit que les extraits nécessaires. N'écrase jamais dossier/ledger.
- **Anti-boucle** (`scripts/catalog/loop-guard.mjs`) : max 1 génération éditoriale/langue, max 1 correction auto,
  **2 échecs identiques ⇒ `blocked`** (aucune relance), pas d'audits narratifs répétés (rapports compacts idempotents).

### Pipeline sous-agents (borné)
collecte déterministe → **dossier factuel (work order)** → **agent éditorial unique** → validateurs (scripts) →
**agent arbitre uniquement pour les outils bloqués**. Chaque sous-agent reçoit un work order borné et **retourne du
JSON structuré** — jamais de relecture du dépôt complet, jamais de discussion libre ni de rapport narratif intermédiaire.

## Fiche soumise : circuit court (25/11/2026)

Pour une fiche isolée (soumission, partenaire, demande ponctuelle) qui va directement dans
`src/data/tools_v4.json`, sans passer par Supabase. But : une seule lecture du site, une seule
rédaction, des contrôles par script, un seul build par lot.

1. **Collecte, sans modèle.**
   `node scripts/catalog/submission-intake.mjs --url=https://exemple.com --slug=exemple`
   Un passage sur le sitemap (40 pages au plus) : badge ToolTrim présent ou absent, page et `rel`,
   images og et favicon, texte des pages utiles (accueil, prix, à propos, CGU, confidentialité,
   sécurité, FAQ, docs ; blog exclu) dans `research/submissions/<slug>/intake.json` (~50 Ko).
   Si le badge doit être actif et que le script le dit absent, s'arrêter là et prévenir Michael.
2. **Rédaction, un seul passage.** Copier `research/submissions/_gabarit.json` (la fiche Keybrum)
   en `research/submissions/<slug>/entry.json` et le remplir à partir de `intake.json` seulement,
   selon le prompt A0 de `docs/tooltrim-strategy/07-prompts-claude-codex.md`. Ne rouvrir le site
   que pour un fait manquant. Les prix vont uniquement dans `pricing`, `pricingEn`, `pricing_v5`
   et `pricing_v5En` ; un prix en dollars est converti au taux des autres fiches (5,11/5,95) dans
   `compare_price_monthly_eur`. Sonnet suffit pour cette étape ; Opus si le produit est technique.
3. **Contrôle et insertion, sans modèle.**
   `node scripts/catalog/add-submitted-tool.mjs --slug=exemple --check`, puis sans `--check`.
   Ajouter `--dofollow` seulement sur décision de Michael (lien officiel hors `nofollow`), et
   `--replace` pour mettre à jour une fiche existante. Le script refuse un champ vide, moins de
   3 avantages, limites ou usages, une alternative absente du catalogue, un montant dans le texte,
   le vouvoiement et les mots interdits, puis régénère `tools_index.json`.
   Il supprime ensuite `intake.json` : c'est une copie brute du site, ignorée par Git, qui ne
   sert qu'à rédiger. Une mise à jour (`--replace`) relance donc d'abord la collecte.
4. **Un build par lot**, pas par fiche : `npm run build` une fois les fiches du lot insérées,
   puis vérifier le `rel` du lien officiel dans `dist/fr/tool/<slug>/index.html`. Chaque fiche
   ajoute des pages : relever le plafond de fichiers de `scripts/audit-build-output.mjs` d'après
   le compte mesuré, avec une ligne datée.
5. **Rapport** de 12 lignes au plus (prompt A0), puis commit des seuls fichiers de la fiche.

## Git
`git status` d'abord ; **jamais** `git add -A` ; stage **explicite** des seuls fichiers de la mission ;
préserver toute modification sans rapport ; commit conventionnel ; push après validations.
