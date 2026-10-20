# Livraison A — comptes et stack enregistrée — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enregistrer une seule stack complète par compte et la rendre consultable par son propriétaire et le back-office ToolTrim.

**Architecture:** Conserver le catalogue JSON et les écrans existants. Un état personnel versionné rassemble sélection, plans et décisions ; une API serveur vérifie identité et session avant de lire ou sauvegarder un snapshot Supabase avec contrôle atomique de révision. Le back-office possède sa propre autorisation serveur et consulte les comptes/stacks sans les modifier.

**Tech Stack:** React 18, React Router 7 déclaratif, Vite, TypeScript, Supabase JS existant, PostgreSQL, fonctions Node Vercel existantes, Vitest et Playwright. Pas de nouvel ORM ni fournisseur d'authentification.

**Spec:** [Conception](../specs/2026-10-19-accounts-stack-design.md)
**Backlog:** [User stories MVP](../specs/tooltrim-user-stories-mvp.md)
**Status:** plan de référence de l’implémentation locale ; voir le [guide opérateur](../../STACK_ACCOUNT_OPERATIONS.md) pour la recette et l’activation encore désactivée.

## Global Constraints

- Une seule stack personnelle par compte.
- Les JSON restent la source des fiches.
- Aucun import, synchronisation ou activation du catalogue historique Supabase.
- Sauvegarde des choix gratuit/payant, montants personnels et décisions existantes.
- Aucun mot de passe ToolTrim ni questionnaire métier imposé.
- Si deux sélections non vides diffèrent : « Retrouver ma stack enregistrée » ou « Ajouter ma nouvelle sélection » ; choix enregistrés prioritaires pour les outils déjà présents.
- L'éditeur et ses soumissions restent hors livraison A ; conserver le formulaire, les paiements et Upstash actuels.
- Les droits administrateur sont contrôlés côté serveur ; aucune clé privilégiée au navigateur.
- CSS dans @layer components de src/index.css ; réutiliser le design system et Iconoir.
- Aucun e-mail vers un tiers, paiement réel, achat, changement d'abonnement ou déploiement public inclus dans l'exécution du plan.
- L'usage local et les fiches restent accessibles si l'authentification est indisponible.

## Review Focus

1. État local ancien/corrompu et payload non fini : préserver les éléments valides, refuser une écriture invalide sans perdre le brouillon — tâches 1/2.
2. Changement A→B pendant une requête A ou expiration de session : aucun mélange des caches ni import de A vers B — tâches 3/4.
3. Deux onglets/appareils et confirmation de sauvegarde perdue : détecter le conflit et permettre la reprise sans écrasement silencieux — tâches 2/4.
4. Suppression du compte concurrente à une sauvegarde : la stack ne se recrée pas et l'accès des sessions concernées est refusé — tâche 6.
5. Totaux globaux, références JSON absentes et panne partielle : chiffres exacts, outil signalé, erreur distincte de zéro — tâche 7.

## Préparation avant modification

- [ ] Lire AGENTS.md dans le checkout choisi ; inventorier les artefacts et réutiliser un worktree adapté ou suivre using-git-worktrees. Le dépôt /Users/mike/Documents/New project contient des modifications préexistantes : ne pas reset, stash global ou ajouter tous les fichiers.
- [ ] Identifier le commit et les modifications locales nécessaires au socle examiné ; reproduire uniquement ce socle dans l'espace isolé. Ne pas partir aveuglément d'origin/main si les fonctionnalités analysées n'y sont pas.
- [ ] Copier la conception et ce plan dans docs/superpowers/specs/ et docs/superpowers/plans/ du checkout de travail pour les conserver avec les changements ; utiliser les versions consolidées, pas des variantes numérotées.
- [ ] Relever les tests ciblés existants et leurs résultats avant changement ; enregistrer séparément les échecs préexistants.
- [ ] Vérifier la configuration Supabase en lecture seule et les migrations réelles. Utiliser une base locale/recette isolée pour les tests SQL. Ne pas créer de branche cloud facturable automatiquement.
- [ ] Chaque tâche ci-dessous termine par revue des changements, tests ciblés et commit des seuls chemins concernés.

## Contrats et structure des fichiers

### Contrat personnel commun

Créer src/lib/personalStack.ts, consommable aussi côté serveur par import relatif.
Réutiliser les types existants ToolCartState, PlanChoice, StackDecision ; extraire PlanChoice dans src/lib/stackPlanChoice.ts pour éviter tout import de hook React côté serveur.

`PersonalStackV4 = { version: 4; selection: ToolCartState; billing: { paid: string[]; reviewed: string[]; choices: Record<string, PlanChoice> }; decisions: Record<string, StackDecision> }`

`PersonalStackRecord = { state: PersonalStackV4; revision: number; updatedAt: string }`

`normalizePersonalStack(input: unknown): PersonalStackV4` : reprise tolérante des états locaux/v3 valides, jamais appel automatique au catalogue.
`validatePersonalStack(input: unknown): PersonalStackV4` : validation stricte d'une écriture serveur, erreurs typées.
`mergeAnonymousDraft(saved: PersonalStackV4, draft: PersonalStackV4): PersonalStackV4` : ajout explicite uniquement, valeurs enregistrées prioritaires sur les collisions.
`personalStackFingerprint(state: PersonalStackV4): string` : comparaison canonique incluant les choix personnels.

Un snapshot v3 devient une enveloppe v4 avec plans/décisions vides, sans écraser les stores locaux non encore importés. Montants finis et non négatifs, devises supportées, périodes valides, sièges entiers positifs. Conserver les décisions historiques en les distinguant des économies actuelles. Ne pas supprimer une référence outil parce qu'elle n'est plus dans les JSON.

### Contrat HTTP

Créer api/stack-account.ts et src/lib/stackAccountApi.ts.
- GET /api/stack-account : `{ stack: PersonalStackRecord | null }`.
- PUT /api/stack-account : `{ expectedRevision: number; state: PersonalStackV4 }` → `{ stack: PersonalStackRecord }`. Révision 0 = création seulement.
- DELETE /api/stack-account : suppression explicitement demandée → 204 après réussite complète.
- 401 session invalide/révoquée ; 400 payload invalide ; 409 version concurrente ou suppression déjà engagée nécessitant reprise ; 503 service indisponible.
- Les erreurs exposent un code stable, pas les détails SQL. Une réponse 409 de sauvegarde permet de relire l'état courant.
- Authorization Bearer obligatoire ; aucun ownerId, rôle admin ou horodatage faisant autorité fourni par le client.

Créer api/_account-auth.ts :
`requireAccount(req): Promise<{ userId: string; sessionId: string; email: string | null }>`.
Vérifier le token avec getUser, lire session_id seulement depuis le token validé et vérifier l'existence de la session liée au compte en base. Refuser les identités anonymes. Les clés serveur proviennent uniquement de variables serveur.

### Contrat SQL

Migration dédiée créée à l'exécution avec la CLI disponible ; ne pas renommer les migrations déjà appliquées.
- Conserver public.profiles et public.stack_snapshots ; state contient l'enveloppe, state_version=4, revision contrôlée au serveur et updated_at généré en base.
- Ajouter à profiles un statut active/deleting avec défaut active pour verrouiller une suppression en cours ; ce champ n'est pas modifiable depuis le navigateur.
- Après vérification de l'identité et de la session, initialiser le profil manquant côté serveur de façon idempotente, sans créer une stack vide à la simple connexion. Un profil absent ne doit pas bloquer la toute première sauvegarde.
- Fonctions RPC uniquement exécutables par service_role : require_account_session(owner, session), read_personal_stack(owner, session), save_personal_stack(owner, session, expected_revision, state), begin_personal_account_deletion(owner, session), accounts_dashboard(admin, session, query).
- SQL SECURITY INVOKER, search_path fixé et noms qualifiés. Révoquer EXECUTE à PUBLIC/anon/authenticated sur ces fonctions ; révoquer les opérations directes des clients sur profiles/stack_snapshots pour qu'une écriture ne contourne pas le contrôle de session/révision. Garder la RLS propriétaire comme défense supplémentaire.
- Vérifier les droits du service_role pour les colonnes Auth nécessaires aux sessions et aux compteurs ; accorder uniquement les lectures requises dans la migration si elles manquent. Ne pas exposer le schéma auth ni retourner son contenu brut dans les réponses.
- Les fonctions sont dans public uniquement pour l'appel RPC serveur via le schéma API déjà exposé ; elles ne deviennent pas appelables par les comptes ordinaires.
- save_personal_stack et begin_personal_account_deletion sérialisent les opérations du même propriétaire (verrou transactionnel par propriétaire). Vérifier session et statut après acquisition du verrou.
- Une création ne réussit que si aucune ligne n'existe ; une mise à jour compare la révision atomiquement et l'incrémente. Aucun upsert aveugle.
- La suppression marque d'abord le compte deleting sous le même verrou. Les nouvelles lectures/écritures privées sont alors bloquées ; l'API supprime ensuite l'identité Auth. Un échec laisse un état reprenable par DELETE après réidentification, sans annoncer une réussite.

## Task 1 — État personnel complet et reprise des données

**Files:** créer src/lib/personalStack.ts, src/lib/stackPlanChoice.ts, src/lib/personalStack.test.ts ; adapter src/hooks/useStackPaidPlans.ts et réutiliser src/lib/stackDecisions.ts/src/lib/stackState.ts.
**Consumes:** types et normalisateurs existants.
**Produces:** PersonalStackV4, PersonalStackRecord et les quatre fonctions du contrat personnel.

- [ ] Écrire les tests : round-trip conservant selection, paid, reviewed, choices et decisions ; normalisation d'un état v3 ; montant NaN/infini refusé côté serveur ; ancienne décision sans devise conservée comme historique ; slug inconnu conservé.
- [ ] Vérifier le rouge : `npx vitest run src/lib/personalStack.test.ts`.
- [ ] Implémenter les contrats ci-dessus. Pour mergeAnonymousDraft, conserver l'enregistré sur un outil déjà présent et remapper les besoins personnalisés en collision sans écraser leur libellé ; importer les choix uniquement pour les nouveaux outils. Ajouter une décision du brouillon seulement si sa paire ne contredit pas une décision enregistrée ni la sélection retenue.
- [ ] Vérifier les tests, dont état identique au fingerprint malgré des clés objet dans un ordre différent ; doublons dédupliqués sans perdre les montants déclarés.
- [ ] Commit : `feat: define complete personal stack snapshot` avec les seuls fichiers de cette tâche.

## Task 2 — Stockage serveur protégé et révisions atomiques

**Files:** nouvelle migration supabase/migrations/<version>_personal_stack_v4.sql ; créer supabase/tests/personal_stack_v4.test.sql ; adapter src/integrations/supabase/types.ts après génération depuis le schéma de recette.
**Consumes:** contrat PersonalStackV4 et tables existantes.
**Produces:** RPC du contrat SQL, snapshot au maximum unique par propriétaire et protection active/deleting.

- [ ] Écrire les tests SQL avec deux comptes et sessions de recette : lecture A/B isolée, RPC refusées aux rôles publics, création revision 0 → 1, écriture revision 1 → 2, seconde écriture revision 1 refusée, session absente refusée, payload/version incorrect refusé.
- [ ] Exécuter en rouge sur Supabase local via `supabase test db supabase/tests/personal_stack_v4.test.sql` après vérification de la syntaxe CLI par --help ; aucune cible production dans ces tests.
- [ ] Implémenter les RPC et privilèges décrits. Ajouter au contrat SQL une validation de structure/version et des montants pour que le rôle serveur ne puisse pas persister un payload invalide par erreur.
- [ ] Rejouer les tests ; vérifier begin_deletion puis save interdit, compte supprimé puis tentative de recréation interdite, tables catalogue inchangées. Générer les types depuis la recette, pas depuis un schéma supposé.
- [ ] Commit : `feat: persist personal stacks with session and revision checks`. Préparer rollback de configuration sans suppression de snapshots v4 ; sauvegarde avant application ultérieure.

## Task 3 — Stores locaux cloisonnés, sans changer les usages existants

**Files:** créer src/lib/personalStackStore.ts et .test.ts ; adapter src/hooks/useStackPins.ts, useStackPaidPlans.ts et useStackDecisions.ts.
**Consumes:** PersonalStackV4 et anciennes clés locales.
**Produces:** `setPersonalStackScope(scope: 'anonymous' | string): void`, `readPersonalStack(): PersonalStackV4`, `replacePersonalStack(state): void`, `subscribePersonalStack(listener): () => void`, `clearPersonalStackScope(scope): void`.

- [ ] Écrire les tests : importer les anciennes clés une fois dans le brouillon anonyme, round-trip de tous les choix, stockage bloqué gardant une copie mémoire, compte A puis anonyme puis B sans contamination, événement storage tardif de A ignoré dans B.
- [ ] Vérifier le rouge : `npx vitest run src/lib/personalStackStore.test.ts`.
- [ ] Implémenter un store partagé versionné, namespaces explicites, caches mémoire liés au scope et notifications cohérentes. Conserver les signatures publiques des trois hooks ; chaque action existante écrit dans le même état complet du scope courant.
- [ ] Vérifier tests ciblés et tests de budget/décisions existants trouvés au prérequis. Aucune copie de la stack du compte dans le namespace anonyme à la déconnexion.
- [ ] Commit : `refactor: isolate personal stack state by account`.

## Task 4 — API personnelle et orchestration de synchronisation

**Files:** créer api/_account-auth.ts, api/stack-account.ts, tests/api/stack-account.test.ts, src/lib/stackAccountApi.ts ; réécrire src/hooks/useStackAccount.ts et créer src/hooks/useStackAccount.test.tsx.
**Consumes:** RPC tâche 2, store tâche 3.
**Produces:** `loadPersonalStack(token)`, `savePersonalStack(token, { expectedRevision, state })`, `deletePersonalAccount(token)` ; hook exposant user, syncStatus, error, pendingDraftChoice, conflict et actions loadSaved/addDraft/reloadLatest/keepCurrent/signOut/deleteAccount.

- [ ] Écrire les tests : owner dérivé du token uniquement ; session révoquée refusée ; sauvegarde avec bonne révision ; 409 conservant brouillon et état distant ; refus des grands payloads avant parsing lourd ; requête A arrivée après connexion B sans effet ; expiration de session ne rebaptisant pas la stack en brouillon.
- [ ] Vérifier le rouge : `npx vitest run src/hooks/useStackAccount.test.tsx` et `npm run test:api -- tests/api/stack-account.test.ts`.
- [ ] Implémenter API et client. Taille maximale du body 1 Mio avec erreur explicite ; aucun tronquage silencieux. Capture du propriétaire/scope et numéro de génération de session pour chaque requête. Sauvegarde différée après changement confirmé du store, pas à l'hydratation avant choix.
- [ ] Tester une réponse de sauvegarde perdue après commit : une relecture identique est reconnue comme enregistrée ; sinon afficher conflit, pas réécrire aveuglément. Lire l'état complet courant à la fin d'une requête pour ne pas perdre un changement intervenu entretemps.
- [ ] Vérifier les commandes ci-dessus et commit : `feat: synchronize complete stacks without account mixing`.

## Task 5 — Connexion et choix dans Ma stack

**Files:** créer src/components/stack/StackAccountPanel.tsx et .test.tsx ; adapter src/pages/CartPage.tsx, src/config/features.ts et src/index.css ; garder la route existante /:lang/ma-stack.
**Consumes:** hook tâche 4 ; SDK Supabase déjà présent.
**Produces:** parcours Google/code, choix de brouillon et états FR/EN.

- [ ] Écrire les tests : affichage de « Enregistrer ma stack », authentification sans perte, code invalide/expiré et renvoi borné, annulation Google, retour à la route courante autorisée, sélections équivalentes sans dialogue, sélections divergentes avec les deux actions validées.
- [ ] Vérifier le rouge : `npx vitest run src/components/stack/StackAccountPanel.test.tsx src/hooks/useStackAccount.test.tsx`.
- [ ] Implémenter signInWithOAuth Google, signInWithOtp pour envoyer le code et verifyOtp type email pour vérifier. Conserver le brouillon avant sortie OAuth ; aucun rôle demandé ; conserver focus et messages accessibles. Copier les états d'enregistrement de la conception, traduits FR/EN.
- [ ] Conserver STACK_ACCOUNT_ENABLED=false par défaut tant que configuration et recette complète ne sont pas vérifiées. Permettre l'activation de recette via environnement explicite ; ne jamais activer des fixtures d'auth en production.
- [ ] Vérifier tests, clavier et rendu mobile/ordinateur ; commit : `feat: add simple account access to My Stack`.

## Task 6 — Déconnexion et suppression sûres

**Files:** compléter api/stack-account.ts, src/hooks/useStackAccount.ts, StackAccountPanel.tsx ; tests/api/stack-account.test.ts, useStackAccount.test.tsx ; créer e2e/stack-account-lifecycle.spec.ts.
**Consumes:** état deleting/RPC tâche 2 et invalidation des requêtes tâche 4.
**Produces:** sortie de session et suppression reprenable sans recréation de données.

- [ ] Écrire les tests : avertissement si modifications non enregistrées ; déconnexion annulée sans perte ; déconnexion confirmée purgeant sélection/plans/décisions du compte et caches ; sauvegarde simultanée à la suppression ; suppression Auth échouant puis reprise ; ancien token/session après suppression refusés.
- [ ] Vérifier le rouge sur tests unitaires/API ; les identités des scénarios navigateur sont simulées pour ne pas envoyer d'e-mail.
- [ ] Implémenter la suppression dans l'API personnelle : session vérifiée, begin_deletion, vérification des références contributrices avant suppression Auth, puis admin.deleteUser. Ne pas contourner les FK ni effacer des contributions historiques ; une impossibilité de suppression doit être expliquée et reprise de façon contrôlée. Ne pas utiliser l'ancienne fonction delete-account comme voie concurrente ouverte.
- [ ] Vérifier aussi une recréation de compte : aucune reprise automatique de l'ancien cache ; aucune fiche JSON supprimée ; le compte utilisateur ordinaire peut terminer la suppression sans intervention.
- [ ] Commit : `feat: protect stack privacy on logout and account deletion`.

## Task 7 — Back-office comptes, stacks et indicateurs

**Files:** créer api/backoffice-accounts.ts, tests/api/backoffice-accounts.test.ts, src/lib/backofficeAccountsApi.ts, src/components/backoffice/AccountsDashboard.tsx et .test.tsx ; adapter src/pages/BackOfficePage.tsx et src/index.css.
**Consumes:** requireAccount ; RPC accounts_dashboard avec contrôle serveur d'administration ; résolution JSON existante.
**Produces:** `loadAccountsDashboard({ search, page, pageSize }): Promise<AccountsDashboard>` et `loadAccountDetail(userId): Promise<AccountDetail>`.

- [ ] Définir AccountsDashboard = comptes vérifiés totaux, comptes avec snapshot, stacks non vides, classement par outil/intent, updatedAt et page de comptes ; AccountDetail = identité minimale, snapshot personnel/null et dates. Liste par défaut 25 comptes, maximum 100 par page ; requête compte par ID exact pour le détail.
- [ ] Écrire les tests : visiteur/utilisateur/éditeur refusés, allowlist serveur issue du mécanisme administrateur contrôlé existant, métadonnées user sans effet, 26 comptes donnant total 26 et page 25, erreur source affichée indisponible, outil JSON-only résolu et référence absente signalée.
- [ ] Vérifier le rouge : `npm run test:api -- tests/api/backoffice-accounts.test.ts` et `npx vitest run src/components/backoffice/AccountsDashboard.test.tsx`.
- [ ] Implémenter l'API avec vérification de session et allowlist administrateur côté serveur ; la RPC est réservée au service_role et le serveur n'accepte pas de rôle fourni par le client. Exclure les identités anonymes/non confirmées et les données supprimées des comptes vérifiés. Pas de scan N+1 de toutes les pages Auth pour calculer les totaux.
- [ ] Tester aussi les snapshots historiques v3 : le détail les normalise et les indicateurs distinguent leurs outils sans exiger une réécriture globale préalable.
- [ ] Ajouter la section comptes/stacks à l'entrée back-office existante sans lancer les requêtes du diagnostic historique par défaut. Tableau et détail en lecture seule ; dates/état courant clairement nommés. Pas de nouvelle collecte de navigation.
- [ ] Vérifier tests et commit : `feat: centralize accounts and saved stacks in back office`.

## Task 8 — Recette intégrée et préparation de l'activation

**Files:** créer e2e/stack-account.spec.ts, e2e/backoffice-accounts.spec.ts, playwright.accounts.config.ts et docs/STACK_ACCOUNT_OPERATIONS.md ; compléter package.json avec test:e2e:accounts ; mettre à jour docs/CHANGELOG_AI.md et docs/ROADMAP.md sur les seules lignes du lot.
**Consumes:** tâches 1–7.
**Produces:** preuves de recette, migration/rollback documentés et configuration prête à activer.

- [ ] Écrire les scénarios navigateur FR/EN : anonyme→code→sauvegarde→nouveau contexte, round-trip plans/décisions, choix brouillon, retrait persistant, A→B, conflit, panne service, suppression et back-office refusé/autorisé. Simuler OAuth/code/API dans les tests automatiques ; aucun appel vers la production. Fixtures interdites dans le build de production.
- [ ] Exécuter tests ciblés puis `npm run test:ma-stack`, `npm run test:api`, `npm run typecheck`, `npm run build` et `npm run test:e2e:accounts`. Si le build génère des données, vérifier qu'aucun JSON éditorial n'est inclus dans le commit par effet de bord.
- [ ] Vérifier le vrai rendu mobile/ordinateur sur le port de recette courant ; exécuter les scénarios locaux existants Ma stack/budget qui touchent les modifications. Refaire un contrôle uniquement après nouveau changement ou échec pertinent.
- [ ] Documenter le paramétrage Google, e-mail production, template code, URL de retour, variables serveur et allowlist administrateur sans aucune valeur secrète. Détecter l'absence de configuration et laisser l'activation désactivée avec une explication opérateur précise.
- [ ] Faire une recette d'intégration Supabase isolée avec identités dédiées A/B et rôles réels, en plus des mocks ; vérifier les conseillers après migration. Les mocks ne prouvent pas la configuration OAuth, la livraison des codes ou la RLS réelle.
- [ ] Après vérification des comptes de test et de la configuration, proposer l'activation publique comme étape distincte. Aucun changement d'abonnement ni publication automatique.
- [ ] Commit : `test: verify account and stack lifecycle end to end`.

## Exécution et livrables de sortie

Méthode recommandée : réalisation avec agents, par tâches séquentielles aux frontières de contrat, puis revue indépendante. Ne pas faire modifier les mêmes hooks simultanément par plusieurs agents.

À chaque tâche : tests rouge/vert, revue ciblée, commit explicite. À la fin : liste des changements, résultats réels, limites de configuration, état du flag, migrations appliquées ou seulement préparées et procédure de retour arrière.

La relecture de ce plan précède l'implémentation, conformément à writing-plans. L'autorisation précédente de mobiliser des agents est conservée ; aucun besoin de redemander le choix de méthode.

## Sources techniques consultées

- [Fonctions SQL et privilèges Supabase](https://supabase.com/docs/guides/database/functions).
- [Sessions Supabase et contrôle des sessions révoquées](https://supabase.com/docs/guides/auth/sessions).
- [Code e-mail et verifyOtp](https://supabase.com/docs/guides/auth/auth-email-passwordless).

## Auto-revue

- Couverture : parcours nominal et JSON (1/5/8), sauvegarde complète (1/3/4), concurrence (2/4), comptes isolés (3/4/6), suppression (2/6), back-office/statistiques (7), configuration et recette (8).
- Les cinq Review Focus ont chacun des tests attribués.
- Types cohérents : version externe 4, ToolCartState interne inchangé ; expectedRevision 0 pour création ; erreurs 400/401/409/503 explicites.
- Aucun besoin d'import catalogue, aucun reçu paiement modifié, aucun plan payant souscrit.
- Aucun test ni tâche de ce plan exécuté pendant sa rédaction. Les noms des nouveaux fichiers sont des décisions du plan, pas des fichiers déjà créés.

