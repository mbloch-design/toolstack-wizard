# CMS éditeurs ToolTrim — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Handoff prévu à Sol ; ne pas confondre livraison de ce plan et livraison du CMS.

**Goal:** Relier les offres actuelles, l’inscription, la création ou récupération de fiche, le badge/paiement, la préparation factuelle, la validation ToolTrim et les mises à jour dans un CMS Supabase complet.

**Architecture:** Réutiliser Supabase Auth, `catalog_contrib` et le canonique existant ; ajouter les dossiers initiaux et versions manquantes. Les éditeurs proposent les faits, ToolTrim garde son analyse et publie des lots immuables dont le JSON est un export. Reprendre Creem et la vérification du badge existants, sans inventer de deuxième tunnel commercial.

**Tech Stack:** React, Router, TypeScript, Vite, composants Storybook existants, API Vercel, Supabase Postgres/Auth/Storage, Creem, GitHub et Vercel pour livraison des snapshots publics.

**Spec:** [2026-11-16-cms-editeurs-design.md](../specs/2026-11-16-cms-editeurs-design.md), notamment les corrections de Michael en §1 et §3. Lire les deux documents avant de coder.

## Global Constraints

- Le parcours comprend inscription, création, validation initiale et modification ultérieure. Ne pas livrer seulement un accès à une fiche préexistante.
- Gratuit avec badge / 29 $ en paiement unique sans badge / mise en avant à partir de 99 $ via contact existant. Aucune nouvelle offre, abonnement, facturation de mise à jour ou double paiement.
- `src/ds/` et les stories restent en lecture seule. Ne pas ajouter de design dans `src/index.css` ni de Tailwind inline. Composition avec jetons existants ; signaler les manques au point d’usage.
- Le contenu public actuel est une référence de non-régression, pas une preuve de vérification factuelle. Aucune migration aveugle JSON → DB ni bascule du flag de build sans réconciliation.
- L’éditeur ne modifie jamais analyse, notation, verdict, alternatives, plan comparatif, taux de conversion, statut de vérification ou affiliation, même via objet parent/alias/API/SQL.
- Le droit est calculé côté serveur par compte/session + cible + attribution + capacité ; un paiement, email, badge ou JWT metadata n’accorde pas la propriété d’un outil.
- Brouillons, originaux d’images, données de paiement et notes internes sont privés. Publication uniquement par ToolTrim, un lot et une livraison identifiés, échec récupérable.
- Un export JSON est généré depuis une release DB immuable. Le même snapshot alimente rendu, index, recherche, Ma Stack et SEO. Pas de dual-write permanent.
- À chaque tâche : test du contrat avant implémentation, correction, tests ciblés, commit des chemins explicites seulement. Ne pas modifier les travaux locaux étrangers au chantier.

## Review Focus

1. Retour OAuth ou Creem perdu après fermeture : même dossier et même paiement récupérés, jamais une seconde facture (T3–T4).
2. Domaine partagé, changement d’email, id différent du slug, fiche archivée : pas de prise de contrôle ni de duplication automatique (T0, T2–T3).
3. Révocation et concurrence pendant édition/upload/revue : perte immédiate des accès privés, travail conservé, version acceptée non réécrite (T2, T5–T6, T8).
4. Source hybride et données anciennes : un prix masqué reste masqué, un verdict EN ne disparaît pas, les champs nouveaux ne sont pas écrasés par un import (T0–T1, T9–T10).
5. Paiement/badge/approbation/commit/READY ne signifient pas la même chose : prochaine action et statut exacts malgré panne/rejeu (T4, T7–T11).

## Contrats communs à fixer en T1

Les types ci-dessous définissent les interfaces entre tâches, pas une implémentation complète.

```ts
type Locale = 'fr' | 'en';
type ListingOffer = 'standard_badge' | 'priority_paid' | 'featured_contract' | 'editorial_existing';
type CmsTarget = { kind: 'listing'; id: string } | { kind: 'tool'; id: string };
type CmsActor = { userId: string; sessionId: string };
type Versioned<T> = { value: T; version: number; updatedAt: string };
type CmsIssue = { path: string; block: string; code: string; severity: 'error' | 'warning' };
type CmsCapabilities = {
  canRead: boolean; canEditFacts: boolean; canUpload: boolean;
  canSubmit: boolean; canReview: boolean; canPublish: boolean;
  editablePaths: string[];
};
type CmsMutation<T> = { target: CmsTarget; expectedVersion: number; idempotencyKey: string; value: T };
type ProductLocale = {
  shortDescription: string | null; productDescription: string | null;
  features: { id: string; text: string }[];
  useCases: { id: string; text: string }[];
};
type PriceOption = {
  id: string; type: 'free' | 'paid' | 'quote' | 'usage' | 'unknown';
  amount: string | null; currency: string | null;
  period: 'month' | 'year' | 'one_time' | 'usage' | null;
  unit: string | null; commitment: 'none' | 'monthly' | 'annual_prepaid' | null;
  tax: 'included' | 'excluded' | 'unknown'; market: string | null;
  offerLocale: string | null; sourceUrl: string | null; observedOn: string | null;
};
type ProductPlan = {
  id: string; planKey: string; archived: boolean;
  localized: Record<Locale, { name: string; highlights: string[]; summary: string | null }>;
  options: PriceOption[];
};
type ProductDraft = {
  schemaVersion: 1; name: string; websiteUrl: string;
  localized: Record<Locale, ProductLocale>;
  plans: ProductPlan[];
  media: { assetId: string; role: 'logo' | 'cover' | 'gallery'; alt: Record<Locale, string>; caption: Record<Locale, string> }[];
  classificationProposals: { key: string; values: string[] }[];
  integrations: { id: string; relatedToolId: string; type: 'integration' | 'host' | 'bundle'; sourceUrl: string }[];
};
type DeliveryState = 'prepared' | 'exporting' | 'building' | 'verifying' | 'live' | 'failed';
type ReleaseInput =
  | { kind: 'initial'; approvalId: string; version: number }
  | { kind: 'product_change'; requestId: string; submittedVersion: number }
  | { kind: 'tooltrim'; approvalId: string; version: number };
// fields est validé par le registre réservé ToolTrim, jamais un JSON arbitraire.
type ToolTrimDraft = { schemaVersion: 1; fields: Record<string, unknown> };
type ToolTrimApproval = { id: string; target: CmsTarget; version: number; hash: string };
```

`ProductDraft` contient uniquement les faits ; il ne devient jamais un paramètre autorisé pour remplacer un Tool complet. `planKey`, id de plan, id de variante et références de média sont alloués/validés par le serveur ; leur présence dans le DTO ne permet pas de les réattribuer. Montants en chaîne décimale, calcul en décimal côté serveur ; pas de conversion monétaire par flottant implicite. Ajouter un stockage privé des saisies inactives de prix, séparé des options projetées, pour permettre un retour gratuit/payé sans perte.

`ToolTrimDraft.fields` utilise exclusivement les chemins canoniques réservés du registre : `longDescription*`, `verdict*`, `pros*`, `cons*`, `toolTrimRating`, `seo`, classement/pertinence, références de comparaison et relations/conseils ToolTrim ; les champs produit, IDs techniques et inconnus sont refusés. T1 énumère/teste les feuilles et T0/T10 vérifient tous les champs réservés existants, y compris liens commerciaux et métadonnées encore rendus. `ToolTrimDraft` n’autorise aucune écriture de `ProductDraft`. `ReleaseInput` est l’unique entrée du moteur de lot, utilisée aussi pour la première publication.

## T0 — Établir une base de travail et une cartographie reproductible

**Fichiers :** lire `AGENTS.md`, `docs/DESIGN_DECISIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/BACKOFFICE_CATALOG_EDITOR.md`, `docs/SUPABASE_REPRISE.md`, `vite.config.ts`, `src/lib/catalogProjection.ts`, `src/lib/externalLink.ts`. Créer `scripts/cms/reconcile.mjs` et `scripts/cms/reconcile.test.mjs`. Rapport actif : `docs/CMS_MIGRATION_STATUS.md`.

**Interface :** `reconcileCatalog({publishedJson, dbSnapshot, redisDrafts, overrides}) -> {identities, fieldConflicts, missingRecords, unpublishedDrafts, sourceHashes}` ; script strictement lecture seule par défaut.

- [ ] Vérifier SHA de production, `origin/main`, statut des worktrees et index. Vérifier `git rev-parse --show-toplevel` : la configuration commune pointe vers un autre checkout dans cette session ; utiliser `git --work-tree='<checkout attendu>'` et contrôler le git-dir avant toute mutation. Choisir un checkout propre sans reset de travail existant ; si besoin utiliser le tool de worktree géré. Ne pas intégrer les 5 commits et changements locaux du backoffice-pilotage en bloc.
- [ ] Écrire les tests : id≠slug conservé, doublon de slug détecté y compris archive, outil absent DB conservé dans le rapport, conflit prix sourcé non résolu par date seule, draft Redis et champ inconnu non perdus. `node --test scripts/cms/reconcile.test.mjs` doit échouer avant le code puis passer.
- [ ] Produire la cartographie actuelle et un fingerprint des entrées. Contrôler les lecteurs de JSON, les overrides prix/URL, les tables et fonctions DB réellement déployées ; ne pas recopier les anciens chiffres comme actuels.
- [ ] Versionner une baseline de schéma reproductible sans données personnelles ni secrets si les objets `catalog_contrib` déployés manquent des migrations du dépôt. Créer la migration via `supabase migration new cms_catalog_baseline` (version CLI vérifiée) ; conditionner précisément l’état attendu, échouer sur dérive plutôt qu’un `IF NOT EXISTS` qui masque un conflit.
- [ ] Rapport : chaque écart classé conservé/corrigé/à arbitrer ; fiche pilote factuelle et cohorte de parité choisies. Commit scoped du rapport, scripts et migration vérifiée, aucun import production.

**Sortie :** base propre, sources et écarts connus ; aucune perte justifiée par le seul nombre de lignes. US10, US13.

## T1 — Contrat factuel, prix et capacités, sans changer le rendu public

**Fichiers :** créer `src/lib/publisherCatalog.ts`, `src/lib/publisherFieldPolicy.ts`, `src/lib/publisherPricing.ts` et leurs `.test.ts`. Modifier `src/lib/catalogPolicy.ts`, `src/lib/catalogFieldRegistry.ts` uniquement pour relier le contrat, sans transformer une métadonnée de présentation en autorisation.

**Interfaces :** `validateProductDraft(value: unknown, context: {phase: 'draft'|'submit'; purpose: 'initial'|'update'}): CmsIssue[]`; `assertProductPatchAllowed(base: ProductDraft, next: unknown, caps: CmsCapabilities): ProductDraft`; `pricePresentation(option: PriceOption, locale: Locale): {amountLabel: string; billingLabel: string; monthlyEquivalent: string|null}`. Registre exhaustif feuille → langue/propriétaire/source/consommateur/bloc/opérations.

- [ ] Tests refusant `verdict`, `longDescription`, `toolTrimRating`, `isComparePlan`, statut approuvé, alias, propriété parent et clé de prototype dans ProductDraft ; les inconnus échouent fermés. Test aucune mutation de l’analyse. Définir séparément `validateToolTrimDraft(value: unknown): CmsIssue[]` et tester l’acceptation des champs admin typés, le refus des champs produit et la couverture de tous les champs réservés existants.
- [ ] Tests tarifaires : `120 EUR/year` → équivalent `10` par mois et facture `120` par an ; `12 EUR/month` sans conversion ; gratuit/devis/usage/inconnu ; saisies inactives conservées mais non exportées ; variante FR marché et variante US distinctes du texte FR/EN ; identités inchangées lors du classement.
- [ ] Implémenter validations : montants décimaux non négatifs finis (NUMERIC(18,6)), devise et contexte requis si montant payant, date ISO pas dans le futur, URL HTTP(S) sans credentials, limites explicites par champ. Brouillon incomplet accepté ; soumission initiale différente d’un tarif déclaré comme complet.
- [ ] Lancer `npx vitest run src/lib/publisherCatalog.test.ts src/lib/publisherFieldPolicy.test.ts src/lib/publisherPricing.test.ts`; PASS. Commit de ces seuls fichiers et raccords.

**Sortie :** politique serveur exploitable, séparation descriptions factuelles/analyse acquise ; US02–US05, US07.

## T2 — Persistance et autorisation transactionnelle

**Fichiers :** migrations via `supabase migration new cms_contributions`; `supabase/tests/cms_contributions.test.sql`; créer `scripts/test-cms-db.mjs`, `api/_cms-store.ts`, `api/_cms-auth.ts` ; modifier types Supabase générés selon workflow du dépôt.

**Interfaces :** `requireCmsActor(req): Promise<CmsActor>` réutilise `requireAccount`; `getCapabilities(actor: CmsActor, target: CmsTarget): Promise<CmsCapabilities>`. RPC `cms_*` service-only invoker ; elles prennent `p_actor`, `p_session`, `p_target`, `p_expected_version`, `p_idempotency_key` selon opération et ne font jamais confiance à des champs du body d’API.

- [ ] Créer les tests Postgres réels de comptes A/B/admin : invité, membre actif/révoqué, marque suspendue, attribution vérifiée/révoquée, compte deleting, JWT encore valide sans session, mauvais outil, SQL direct anon/authenticated, rôle auto-déclaré. Vérifier REVOKE/GRANT, lecture et écriture, pas seulement RLS activée.
- [ ] Ajouter les entités du §6 : dossiers initiaux privés, registre unique des slugs, invitations, membres/attributions réutilisés, produit localisé versionné, `listing_product_versions` avant identité canonique, demandes/version envoyée immuable, workspaces ToolTrim et approbations ciblant dossier OU outil, médias réservés, variantes et observations, entitlements/événements de paiement, checks badge, relecture initiale et `initial_listing_approvals`, releases/items/livraison. Contraintes FK, unicité et index réels ; pas de nouvel Auth ni `tools` bis.
- [ ] Implémenter une seule demande ouverte par outil ; draft partagé marque/outil, initial privé au créateur ; CAS monotone et événement atomiques. Les anciennes politiques « auteur seul » doivent refléter ce contrat. Ajouter au moins `listing_request.owner_id` et `lock_version` contrôlés, intouchables par le client.
- [ ] Implémenter les façades invoker à droits service_role seulement et contrôles DB dans la transaction ; renforcer les anciennes voies directes avant activation. Aucun nouveau SECURITY DEFINER pour masquer une erreur de privilège. Vérifier les contraintes de domaine avec un exemple ordinaire (`example.com`) et les valeurs ID≠slug.
- [ ] Test suppression de compte : contributions/version/audit ne disparaissent pas en cascade ; sessions et accès supprimés/révoqués, stratégie d’anonymisation compatible avec `personal_account_has_contributions` actuel. Pas de refus inexpliqué ni d’historique effacé.
- [ ] `node scripts/test-cms-db.mjs` : schéma from scratch + upgrade baseline + tests A/B ; PASS. Conseillers sécurité Supabase sur environnement de test ; corriger les nouveaux problèmes. Commit de la migration et des contrôles, sans application prod à cette tâche.

**Sortie :** données CMS réellement en DB, autorisation prouvée indépendamment du front. US01, US06, US09, US11.

## T3 — Inscription, création, récupération et attribution

**Fichiers :** créer `api/listing-requests.ts`, `api/listing-requests.test.ts`, `src/pages/PublisherPage.tsx`, `src/components/publisher/ListingIntake.tsx`, `src/lib/listingRequestsApi.ts`; modifier `src/pages/SubmitToolPage.tsx`, `src/lib/accountPaths.ts`, `src/pages/AccountCallbackPage.tsx` et `src/App.tsx` ; tester sans toucher DS.

**Interfaces :** `createListing(actor, {name, websiteUrl, offer, idempotencyKey}): Versioned<ListingRequest>`; `findListingCandidates(actor,{websiteUrl,name}): Candidate[]` (public + demandes propres seulement); `claimExisting(actor,toolId): ClaimStatus`; `acceptInvitation(actor,token): Assignment`; DTO `ListingRequest` reprend les axes du §3.3 séparément.

- [ ] Tests nouveau compte/email/Google et `returnTo` local autorisé ; pas d’open redirect ; conservation offre/outil sans exposer email/token dans analytics ou URL durable.
- [ ] Tests création idempotente, deux créations concurrentes du même slug, archive, demandes déjà commencées, deux produits sur un domaine, compte A tentant de récupérer le dossier B ; création privée ne crée pas une fiche publique.
- [ ] Implémenter les trois entrées : nouveau dossier, fiche existante à revendiquer, ancien client à rapprocher. Ne jamais envoyer au paiement une personne identifiée comme déjà éligible ; statut à rapprocher si preuve ambiguë.
- [ ] Créer un formulaire minimal ; pas d’analyse ni de rédaction complète obligatoire pour le client. Conserver reprise après fermeture et confirmation email ; initial upload et fact editing selon capacité du propriétaire du dossier.
- [ ] Invitation 256 bits hachée, expiration 7 jours, usage unique atomique, révocation ; accepteur confirmé attendu, identité erronée expliquée. Le rôle/marque/outil viennent de l’invitation serveur.
- [ ] `npx vitest run --config vitest.api.config.ts api/listing-requests.test.ts` et tests Auth/route concernés : PASS. Commit scoped.

**Sortie :** on peut réellement entrer et créer son dossier, pas seulement ouvrir un lien admin. US01, US11, US13.

## T4 — Offres existantes, badge, paiement et reprise commerciale

**Fichiers :** créer `src/lib/listingOffers.ts`, `api/listing-checkout.ts`, `api/_listing-entitlements.ts`, `api/creem-webhook.ts` et tests API ; adapter `_payment-verification.ts`, `_badge-verification.ts`, `verify-payment.ts`, `contact.ts`, `_submission-contract.ts`, `SubmitToolPage.tsx`. Ajouter `scripts/cms/reconcile-submissions.mjs` et son test ; garder `_submission-store.ts` et les notifications existantes isolés.

**Interfaces :** `startListingCheckout(actor,listingId): {checkoutUrl,attemptId}`; `reconcileListingPayment(attemptId): EntitlementStatus`; `applyVerifiedBillingEvent(event): {duplicate:boolean}`; `checkListingBadge(actor,listingId): {state:'present'|'missing'|'unreachable'|'unchecked',checkedAt:string}`; `reconcileHistoricalSubmission(submissionId): LinkResult`. Tous les grants appartiennent à un dossier/outil, pas à un email ou au compte entier.

- [ ] Fixer en tests les offres actuellement affichées : `standard_badge=0`, `priority_paid=29 USD one_time`, `featured_contract=contact from 99 USD`. Confronter produit/monnaie/prix **de base** à Creem en environnement adapté ; ne pas comparer un total incluant taxes à un prix hors taxes codé en dur. Aucune nouvelle offre créée chez le fournisseur.
- [ ] Tests checkout côté serveur lié à acteur/dossier/produit/version d’offre. Refuser faux retour payé, mauvais mode, mauvais produit, checkout d’un autre outil, même reçu utilisé deux fois. Les métadonnées payées et l’URL initiale sont immuables, même si le site officiel est modifié ensuite.
- [ ] Implémenter événements Creem avec corps brut, signature vérifiée, secret serveur, unicité event/order/checkout, transaction idempotente. Retour navigateur et webhook appellent la même réconciliation ; webhook perdu rattrapé par lecture fournisseur ; double clic reprend l’achat existant. Ne pas dépendre du localStorage pour rattacher un nouvel achat.
- [ ] Tests refund/dispute et événements hors ordre : dernière preuve fournisseur fiable, incident explicite, aucun ancien `completed` rejoué qui réactive un paiement remboursé. En panne fournisseur, conserver droits déjà confirmés ; ne pas facturer à nouveau. Remise à niveau gratuit→payant garde dossier, fiche et contenu.
- [ ] Réutiliser le vérificateur badge : même site, image/lien officiel ; distinguer absent et inaccessible. Test taille HTML/timeout/redirect DNS privé et borne de ressource, ne pas étendre l’accès réseau à une URL arbitraire du client. Vérifier avant envoi et première publication ; après publication, contrôle informatif tant que règle non arbitrée.
- [ ] Migrer les soumissions historiques par preuve vérifiable, sans notification/debit redoublé. Ancien reçu incomplet = revue humaine ; import script dry-run puis apply contrôlé. Interface « Paiement à rapprocher », lien reçu et reprise, pas écran d’achat par défaut. Une acceptation Redis déjà confirmée reste confirmée si le transfert DB échoue ; job de rapprochement idempotent explicite.
- [ ] Exécuter tests nouveaux API + `src/test/submit-payment.test.tsx`, `src/test/submit/badgeVerification.spec.ts` et tests d’idempotence soumission existants : PASS. Recette Creem test mode séparée, aucun débit prod pour tester. Commit scoped.

**Sortie :** le CMS respecte les offres et clients existants. US12, US13, US15.

## T5 — Sauvegarder et envoyer les faits, pour les deux rôles

**Fichiers :** créer `api/publisher-catalog.ts`, `api/publisher-catalog.test.ts`, `src/lib/publisherCatalogApi.ts`; modifier `api/backoffice-catalog.ts` en adaptateur du service DB et les sessions de brouillon du back-office ; créer `api/_cms-drafts.ts`.

**Interfaces :** `readCmsDraft(actor,target): Promise<Versioned<ProductDraft>>`; `saveCmsDraft(actor,mutation: CmsMutation<ProductDraft>): Promise<Versioned<ProductDraft>>`; `submitCmsDraft(actor,target,expectedVersion,idempotencyKey): Promise<{requestId,submittedVersion}>`; `withdrawCmsRequest(actor,requestId,expectedVersion): Promise<void>`.

Contrat admin distinct dans le même service : `readToolTrimDraft(actor,target: CmsTarget): Promise<Versioned<ToolTrimDraft>>`, `saveToolTrimDraft(actor,mutation: CmsMutation<ToolTrimDraft>): Promise<Versioned<ToolTrimDraft>>`, `approveToolTrimDraft(actor,target: CmsTarget,expectedVersion): Promise<ToolTrimApproval>`. Créer `api/_cms-editorial.ts` et `api/_cms-editorial.test.ts` ; exposer ces opérations uniquement depuis la route admin, avec contrôle transactionnel `cms_admins`. L’approbation d’un dossier n’est pas une `ReleaseInput` autonome : elle est consommée par `promoteInitialListing` ; celle d’un outil existant devient `ReleaseInput` de type `tooltrim`.

- [ ] Tests sauvegarde partielle de brouillon, incomplet autorisé, erreurs de type, rechargement identique, deux onglets et suppression/recréation sans version réutilisée, autosauvegarde réponse tardive qui ne remplace pas une saisie plus récente.
- [ ] Tests fail-closed par propriété, référence plan/média étranger, droits révoqués entre lecture et transaction ; seul le document factuel passe. Validation de soumission liée à sa finalité (initial ou update), pas à l’exhaustivité de l’analyse.
- [ ] Implémenter version envoyée immuable et diff typé vers les items existants ; conflits à trois voies, champ concurrent explicite, aucun écrasement des changements éditoriaux indépendants. Séparer champs inactifs de saisie de la projection publicisable.
- [ ] Implémenter sauvegarde/reprise/validation ToolTrim dans `tooltrim_drafts`, puis versions `tool_editorial_content` et `tool_decision_versions.tooltrim_rating` et autres entités réservées. Tests admin écrit texte/note FR/EN, rechargement identique ; éditeur avec body identique refusé ; envoi de prix et sauvegarde d’analyse simultanés restent tous deux présents ; les deux révisions assemblent l’aperçu admin.
- [ ] Test avant toute identité canonique : enregistrer le produit dans `listing_product_versions`, rédiger/approuver ToolTrim avec la cible listing, produire l’aperçu et la relecture sans `toolId`. L’application aux tables canoniques intervient seulement dans la transaction de promotion initiale ; aucun FK vers un faux outil.
- [ ] Adapter l’admin à ce store commun après import des brouillons (T10), sous bascule contrôlée. Garder routes historiques de l’admin redirigées, pas deux writers sur la même fiche.
- [ ] API : `no-store`, limites corps/taille/requêtes par utilisateur et dossier, erreurs 401/403/409/422/503 sans détails internes, logs sans contenu privé. Tests API ciblés PASS ; commit.

**Sortie :** brouillon persistant, envoi fiable et même logique d’édition admin/éditeur. US02, US06, US09.

## T6 — Images privées, traitement et publication sûre

**Fichiers :** créer `api/catalog-media.ts`, `api/_catalog-media.ts`, `api/catalog-media.test.ts`, `src/components/publisher/CatalogMediaUpload.tsx`; compléter `cms_assets`/Storage via migration générée ; `scripts/cms/cleanup-assets.mjs` et tests.

**Interfaces :** `reserveAsset(actor,target,metadata): {assetId,path,expiresAt}`; `finalizeAsset(actor,assetId): {state,previewUrl?}`; `getAssetPreview(actor,assetId): {url,expiresAt}`; `materializePublishedAssets(releaseId): MediaManifest`. Pipeline image encapsulé `processCmsImage(input): ProcessedImage` ; choisir une bibliothèque raster maintenue et version verrouillée, vérifier limites runtime avant livraison.

- [ ] Tests type réel vs extension/MIME, >5 Mio, >20 MP, bombe de décompression, image corrompue, SVG/animation, quota 100 Mio, >12 galerie, cible étrangère, réservation expirée/révoquée, tentative d’upsert et chemin traversant.
- [ ] Créer `catalog-drafts` privé et `catalog-public` public dérivés uniquement ; aucun upload utilisateur public. Vérifier INSERT Storage par réservation/session/cible ; tests API et Storage réels avec JWT A/B, pas uniquement mocks.
- [ ] Si nécessaire pour la RLS, implémenter le seul prédicat privé `cms_can_upload_reserved_object(path text)` à privilège délégué décrit dans la spec : `auth.uid` + session + objet réservé exact + cible active, retour booléen. Tester anon, mauvais chemin, privilèges SQL et révocation ; ne pas donner de SELECT général sur les réservations.
- [ ] Implémenter traitement borné, suppression EXIF/orientation, dérivés et preview 60 s ; reprise idempotente. Upload initial autorisé seulement au propriétaire du dossier ; après attribution, rattacher les mêmes assets sans changer les historiques.
- [ ] Boutons Ajouter/Remplacer/Retirer, barre d’état, retry, annulation, alt/caption FR/EN, monter/descendre au clavier ; ancien média conservé si échec. Les URLs privées ne quittent pas l’espace de travail et ne sont pas persistées dans le catalogue public.
- [ ] Tester nettoyage 24 h/30 j et préservation des assets référencés par brouillons, versions envoyées, publication active ou rollback. Tests DB/API/composant PASS ; commit.

**Sortie :** upload réel et exploitable dans la fiche, pas une saisie d’URL. US04, US09.

## T7 — Espace éditeur et fiche complète, sans nouveau design system

**Fichiers :** `PublisherPage.tsx`, créer `PublisherToolPage.tsx`, `ListingStatusCard.tsx`, `ListingOfferStatus.tsx`, `PublisherWorkspace.module.css` ; réutiliser/adapter `src/components/backoffice/CatalogRecordWorkspace.tsx`, `CatalogInlineFiche.tsx`, `CatalogEditingContext.tsx`, `CatalogPriceEditor.tsx`, `CatalogTagField.tsx`. Les variantes locales non publiées sont relues et portées par hunk, pas supposées disponibles sur main.

**Interfaces :** composants consomment `Versioned<ProductDraft>`, `CmsCapabilities`, `CmsIssue[]`, axes de `ListingRequest` et `DeliveryState` ; aucune autorisation décidée par CSS ou absence de bouton.

- [ ] Tests du contenu : titre compact, état public distinct sauvegarde/offre/revue, une action principale, sommaire public, facture lisible, badge commercial distinct vérification. État vide dossier/fiche existante/accès en attente/révoqué clair.
- [ ] Implémenter une seule page fiche et édition dans chaque bloc ; prix en cartes et variantes, tags contrôlés, images en galerie. Un crayon seul ne remplace pas le libellé accessible/visible de l’action. L’éditeur ne reçoit pas les formulaires d’analyse.
- [ ] Brancher « Enregistrer/Annuler », passage de bloc avec sauvegarde validée, erreurs au champ et focus, aperçu brouillon, protection sortie. Ne pas bloquer toute la navigation par une modification locale sans expliquer l’action nécessaire.
- [ ] Afficher le suivi initial : condition à remplir, rédaction ToolTrim, faits à relire, corrections, livraison. Les clients payants n’ont pas à rédiger l’analyse ni toute la fiche. Mise en avant renvoie au contact/contrat existant.
- [ ] Tests composants et Playwright du parcours A/B en fixture : `npx playwright test -c playwright.accounts.config.ts e2e/publisher-cms.spec.ts` (fichier créé à cette tâche). Mobile/tablette/desktop, clavier, FR/EN, clair/sombre. Commit après contrôle rendu, pas seulement snapshots DOM.

**Sortie :** parcours compréhensible pour une personne sans culture CMS ; US01–US06, US11–US14.

## T8 — Validation initiale, relecture des faits et revue des modifications

**Fichiers :** créer `api/backoffice-contributions.ts`, `api/_cms-review.ts`, tests API ; `src/components/backoffice/ContributionQueue.tsx`, `ContributionReview.tsx`, `ListingInitialReview.tsx`; modifier navigation/composition admin hors DS (signaler toute entrée manquante nécessitant arbitrage DS).

**Interfaces :** `prepareInitialListing(actor,listingId,expectedVersion): ListingReview`; `requestFactualReview(actor,listingId,productRevision): ReviewToken`; `respondFactualReview(actor,listingId,revision,decision): ListingReview`; `reviewContribution(actor,{requestId,submittedVersion,decisions,action,note}): ReviewResult`.

`promoteInitialListing(actor,{listingId,expectedVersion,productRevisionId,tooltrimApprovalId,idempotencyKey}): {toolId,initialApproval: ReleaseInput}` scelle la première version et ferme définitivement les écritures par simple propriété du dossier.

- [ ] Tests file standard/prioritaire, représentant non vérifié, doublon tardif, brouillon initial incomplet compatible avec rédaction ToolTrim. Échéance payante démarre au paiement confirmé et reste visible ; retard = incident suivi, aucun succès artificiel.
- [ ] Implémenter rédaction et revue dans l’admin commun ; relire produit sans veto sur le verdict. La confirmation porte une révision exacte : un changement factuel ultérieur invalide cette confirmation, pas une modification de l’analyse seule. Sans réponse, action admin tracée, aucune approbation inventée.
- [ ] Tester/implémenter promotion initiale atomique : version factuelle relue + version ToolTrim approuvée + preuve commerciale + attribution ; finaliser slug et références, convertir assets, sceller `initialApproval`. Rejeu idempotent, échec sans moitié de fiche, doublon tardif devient proposition d’update avec revue. Après lien canonique, `listing-requests.ts` et Storage résolvent les droits actuels de l’outil ; test auteur initial révoqué ne peut plus contourner via dossier ni asset historique.
- [ ] Tests décisions par élément : logo accepté + prix refusé peut clore une demande `approved` partielle ; `changes_requested` ne publie rien ; décision en attente empêche clôture ; note interne jamais renvoyée à l’éditeur. Corriger la machine SQL existante et enregistrer toutes les transitions.
- [ ] Application canonique uniquement des éléments acceptés ; version produit et prix provenance éditeur, observation soumise≠vérifiée. L’admin choisit les domaines et le tarif de référence après analyse. Pas de remplacement global de `tool_editorial_content`.
- [ ] Tests révocation avant revue, annulation de validation et lot immuable, nouvelle proposition à partir de version rejetée/appliquée ; API+DB+UI PASS. Commit.

**Sortie :** un dossier peut réellement aller de nouveau client à fiche prête, puis de modification envoyée à décision. US07, US09, US14–US15.

## T9 — Projection unique et livraison groupée versionnée

**Fichiers :** créer `api/_cms-release.ts`, `api/_cms-delivery.ts` et tests ; `scripts/cms/export-release.mjs`, `scripts/cms/export-release.test.mjs`, `src/lib/catalogRelease.ts` et test ; modifier `_backoffice-catalog-github.ts`, `catalogProjection.ts`, `ToolDetailPage.tsx`, `vite.config.ts`, générateurs index/shards/SEO/llms pour lire le snapshot commun.

**Interfaces :** `prepareRelease(actor,inputs: ReleaseInput[],idempotencyKey): Release`; `exportRelease(releaseId): {tools,manifest,media}`; `deliverRelease(releaseId): DeliveryStatus`; `verifyAndActivateRelease(releaseId,deploymentId): DeliveryStatus`; `projectDraft(baseCanonical,productDraft,editorialRevision): PublicToolProjection` utilisé aussi pour l’aperçu.

- [ ] Tests parité chaque champ consommé, id/slugs, FR/EN, descriptions factuelles distinctes analyse, affichage médias et alt, variantes localisées, absence de fuite inactive, prix withheld, alternatives, note, FAQ, override prix/URL. Toute différence intentionnelle est documentée et approuvée ; aucun fallback muet qui annule une donnée CMS.
- [ ] Implémenter release/items immuables, hash stable, publication SQL transactionnelle et snapshot complet. Vues publiques pointent sur la release active ; brouillons/candidats jamais exposés. Références à un outil archivé exclues de l’export public, contenu conservé.
- [ ] Tester un même lot avec création initiale, update produit et update éditorial seul. Chaque item épingle les versions produit et ToolTrim exactes ; deux inputs du même outil sont composés ou refusés explicitement en cas de versions incompatibles. Première publication ouvre le suivi de fiche attribuée ; une modification en cours ne change pas le snapshot figé.
- [ ] Générer les artefacts et manifeste public de version ; un commit groupé sans force push. Gestion compare-and-swap, commit ambigu relu, concurrence avec code ou autre lot ; une seule livraison active. Reprise même lot et même snapshot.
- [ ] Vérifier SHA, alias prod, READY, manifeste et routes FR/EN avant `live` ; activer le pointeur public DB puis recontrôler. Échec d’activation garde `verifying/failed`, pas `live`. Documenter la fenêtre de convergence, pas de transaction distribuée fictive.
- [ ] Tests Github timeout avant/après commit, build KO, nouveau draft après publication, cleanup KO, activation DB KO, annulation de validation (nouveau lot compensatoire si publication engagée) et rollback. Aucun nettoyage de propositions plus récentes.
- [ ] Tests export/API/DB et `npm run typecheck`, `npm run build` avec fin effective : PASS. Commit des sources et artefacts requis seulement.

**Sortie :** ce que voit l’éditeur peut devenir exactement ce que voit le public ; US08, US10.

## T10 — Migration réelle et retrait des doubles écritures

**Fichiers :** `scripts/cms/reconcile.mjs`, créer `scripts/cms/import-baseline.mjs`, `scripts/cms/import-drafts.mjs` et tests ; `docs/CMS_MIGRATION_STATUS.md`, `docs/BACKOFFICE_CATALOG_EDITOR.md`, `docs/SUPABASE_REPRISE.md`, registres de couverture actifs.

**Interfaces :** `importBaseline({sourceHashes,approvedResolutions,dryRun}): ImportReport`; `importLegacyDrafts({expectedRedisRevision,dryRun}): ImportReport`. Import relançable par clé de source, journal avant/après et aucun écrasement d’un changement plus récent.

- [ ] Construire en staging une baseline depuis le publié + résolutions explicites, exporter et comparer TOUS les IDs/champs consommés. Garder contenu inconnu dans une archive de compatibilité ; ne pas promouvoir des observations non revues. Les scripts factory passent eux aussi par le circuit de révision.
- [ ] Importer archives, brouillons Redis, dossiers et droits historiques, médias hérités et corrections de sources. Vérifier chaque mapping d’identité et chaque reçu, pas seulement un total.
- [ ] Tester un gel bref des écritures, snapshot, import final, check des révisions, activation et retour arrière. Si un writer ou hash change, interrompre sans perte. Le site reste lisible.
- [ ] Après activation réussie, couper writer Redis/JSON pour données migrées ; anciens endpoints compatibles deviennent adaptateurs DB ou erreur explicite. Conserver export de secours privé jusqu’à validation, pas de dual-write permanent. Retirer rescue overrides au fur et à mesure que leur parité est prouvée.
- [ ] Rejouer création, archive et restauration admin, suppression compte éditeur, changements d’offre et reprise d’achat ancien. Rapport audit kept/lost/to decide ; PASS avant tout canari production. Commit scoped.

**Sortie :** la BDD est réellement la source de vérité, et l’ancienne usine n’écrase plus les fiches. US08–US15.

## T11 — Recette autonome et ouverture contrôlée

**Fichiers :** `e2e/publisher-cms.spec.ts`, compléter fixtures comptes et CMS ; créer `docs/CMS_ACCEPTANCE.md`, tenir `docs/CHANGELOG_AI.md` et `docs/DESIGN_DECISIONS.md` à jour, sans nouveau handoff concurrent.

- [ ] Matrice US01–US15 : test automatisé, preuve rendue et scénario de reprise précis pour chaque ligne. Les tests commerce sont en test mode ; les conditions de production sont vérifiées en lecture, pas en débit réel de test.
- [ ] Recette à 390/768/1280, FR/EN, clair/sombre et clavier. Vérifier focus/restauration, médias, champs/prix, retour à la liste, espaces fixes et droits ; composants DS non modifiés (`git diff -- src/ds/` et stories vide pour le lot).
- [ ] Exécuter les commandes existantes `npm test`, `npm run test:api`, `npm run typecheck`, `npm run lint:ds`, `npm run test:ds`, `npm run build-storybook`, `npm run test:visual`, `npm run build`, plus `node scripts/test-cms-db.mjs`, `node --test scripts/cms/*.test.mjs`, Playwright CMS. Fin de processus et statut final requis ; éviter de lancer plusieurs builds lourds concurrents.
- [ ] Une personne sans expérience CMS effectue seule : choisir son parcours, s’inscrire/reprendre, compléter les faits, ajouter une image et un tarif, envoyer, retrouver une demande de correction et sa version publiée. Consigner hésitations/erreurs et corriger/rejouer. Si aucun participant disponible, garder cette preuve comme manquante, jamais « validée par simulation ».
- [ ] Déployer d’abord staging et ouvrir les rôles test ; contrôler parités + revue humaine. Puis un canari prod explicitement autorisé (vrai représentant, vraie fiche, aucun contenu fictif publié) et vérifier alias/SHA/manifest/routes/projections/droits.
- [ ] Rendre un bilan exact : livré, testé, non prouvé, dette, rollback. Étendre seulement après preuves. Aucun « tout fonctionne » fondé uniquement sur un build ou une page HTTP 200.

**Sortie :** parcours global fonctionnel, observable et vérifié. La présence d’un éditeur de prix seul ne clôt pas cette étape.

## Arbitrages résiduels cadrés — pas des blancs à inventer

- Maintien du badge gratuit après publication : l’existant n’est pas explicite ; V1 observe et fait traiter humainement, sans sanction automatique. Toute règle de grâce/suspension demande une décision métier ultérieure.
- Mise en avant : conditions issues du contrat individuel (durée/emplacements), aucun nouveau paiement autonome ajouté.
- Politique des liens commerciaux : rapprocher les promesses existantes et `externalLink.ts` avant d’étendre leur automatisation ; conserver les décisions explicites et signaler toute incohérence.
- Manques DS : upload, recadrage et diff utilisent une composition accessible existante ; toute évolution du système reste un chantier soumis à l’autorisation de Michael.

## Instruction de relais à Sol

Commencer par T0 puis T1–T2. La première démonstration attendue est **une inscription → une demande privée en base → condition badge/paiement test → préparation ToolTrim → relecture factuelle → publication de test → modification ultérieure**. Une maquette, une API sans parcours, une fiche déjà attribuée ou un bandeau de rôle ne suffisent pas. Conserver à tout moment l’analyse ToolTrim et les droits commerciaux déjà acquis. Ne pas promettre la migration ni la production avant T10–T11.

## Contrôle du cadrage livré — 16/11/2026

| Exigence du cadrage | Définition vérifiable dans la spec | Travail et preuve prévus pour Sol |
|---|---|---|
| Compte personnel et édition de ses fiches | §3.2, §3.4 : Auth existant, attribution distincte, révocation | T2–T3, tests A/B et reprise Auth |
| Inscription, création et validation complètes | §3.2, §3.3, §3.5 : étapes, états, première approbation et publication | T3, T7–T9, US11–US14 |
| Gratuit avec badge, payant sans badge et existant commercial | §2, §3.1, §6 : source publique/code vérifiés, 3 offres, Creem, anciens clients | T4, US12–US15, vérification serveur et idempotence |
| Fiche en base, source unique et sauvegarde | §6, §8 : tables existantes réutilisées, versions, migration, snapshots | T0–T2, T5, T9–T10 |
| Téléversement de visuels | §7 : parcours, limites, sécurité, reprise, première attribution | T6, tests Storage réels et parcours rendu |
| Liberté factuelle et indépendance ToolTrim | §4, §6 : matrice feuille par feuille, contrats d’écriture séparés | T1, T5, T8 ; note/texte ToolTrim toujours éditables par admin |
| UX alignée avec la fiche et DS préservé | §5, §9 : mêmes rubriques, actions in situ, états, zones DS signalées | T7, T11, recette rendue et humaine |
| Relais implémentable à Sol | Interfaces, dépendances, T0–T11 et critères de sortie | Relecture indépendante du cadrage effectuée ; raccords soulevés intégrés |

Vérifications réalisées **pour ce cadrage** : inspection du code publié et du chantier local, introspection Supabase en lecture seule (schémas/colonnes/politiques/fonctions/compteurs), offres publiques et contrats de paiement/badge, relecture indépendante, cohérence des références et diff documentaire. Les tests indiqués dans les tâches ne sont **pas exécutés** : aucun code CMS n’a été implémenté dans ce lot. Aucune mutation de production, aucun paiement, envoi de message ou téléversement réel n’a été effectué.
