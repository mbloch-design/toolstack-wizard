# Soumissions sans Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (méthode native recommandée) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conserver le traitement par email, enregistrer les soumissions et empêcher la réutilisation d'un paiement sans dépendre de Supabase.

**Architecture:** Les handlers Vercel utilisent Redis REST côté serveur. Une réservation atomique conserve la demande et ses deux emails ; chaque envoi utilise un bail et une clé Resend stable. Les contacts généraux restent dans leur parcours actuel ; aucun back-office ni nouveau service de queue.

**Tech Stack:** React 18, TypeScript, fonctions Vercel existantes, `fetch`, Redis/Lua, Resend et Creem existants, Vitest et Playwright.

**Spec:** [Contrat écrit](../specs/2026-10-09-submission-idempotency-design.md).

**Statut : implémentation et recette locales terminées ; configuration Production et recettes Upstash REST concurrente/récupération fictive réalisées. Activation distante en attente des contrôles prestataires et exploitation.** Aucun déploiement effectué ; base Free créée sans facturation. Voir [bilan et décisions](../../BILAN_SOUMISSIONS_2026-10-09.md) et [procédure](../../SOUMISSIONS_UPSTASH.md).

## Global Constraints

- Aucune dépendance Supabase pour la soumission, la réservation du reçu ou les reprises d'email. Aucun changement du catalogue ni du diagnostic.
- Creem et Resend restent les prestataires actuels. Leurs secrets restent côté serveur.
- Maintenir l'offre Free, sans ajout de carte ni bascule payante automatique.
- Les preuves minimales de consommation n'ont pas de TTL. L'éviction destructive reste désactivée.
- Aucun `VITE_*`, secret dans une URL, contenu privé dans un log ou appel Upstash depuis le navigateur.
- Les remboursements/litiges changent l'état d'un droit sans supprimer son historique.
- Reprises Resend bornées à 24 heures depuis la première tentative ; ensuite réconciliation manuelle des résultats ambigus.
- Tests automatisés sans email client, paiement réel ou écriture sur la base de production.
- CSS/routes/SEO commerciaux conservés ; ne pas embarquer les modifications catégories/catalogue/Stack locales.

## Review Focus

1. Brouillon historique sans nouvel ID : préserver ses données et sa référence Creem ; ne pas inviter à repayer (tâche 2).
2. URL équivalente, langue ou destinataire changé : normalisation déterministe et conflit sur le contenu accepté ; token badge renouvelé exclu de l'empreinte (tâches 1–2).
3. Redis plein ou réponse de réservation perdue : pas de paiement libéré, retry récupérable et aucune acceptation partielle (tâches 1–2).
4. Bail expiré pendant l'envoi : clé prestataire inchangée, ancien propriétaire incapable de modifier le résultat (tâche 3).
5. Ancien artefact restauré : ne pas rouvrir des paiements consommés après la sauvegarde ; désactiver les nouvelles acceptations jusqu'à réconciliation (tâche 4).

## Décisions de structure

Créer `api/_submission-store.ts` (REST et opérations atomiques), `api/_submission-contract.ts` (normalisation/empreinte/types), `api/_submission-mail.ts` (rendu immuable et envoi), `api/submission-maintenance.ts` (reprise authentifiée).

Conserver les handlers existants et leurs tests. Le contrat partagé définit :
- `SubmissionInput` : `submissionId`, `checkoutId?`, `paymentReference?`, `paid`, `name`, `email`, `subject`, `message`, `toolName`, `toolUrl`, `submitterRole`, `badgeUrl?`, `lang`.
- `MailJob` : charge Resend immuable, clé stable, état `pending | sending | sent | reconcile`, première tentative, bail/propriétaire et ID prestataire éventuel.
- `SubmissionRecord` : version 1, ID, empreinte, checkout éventuel, état `accepted | suspended`, horodatage, deux jobs nommés `internal` et `confirmation`.
- `ReserveResult` : `created | existing | conflict`, avec record pour les deux premiers. Erreur de stockage typée, jamais assimilée à une absence.

Registre : un hash Redis `tt:submissions:v1`, champs `submission:<uuid>` et `checkout:<id>`. Le premier contient le record, le second l'ID réservé. EVAL vérifie les conflits et types avant une unique commande HSET multichamp : pas de succession d'écritures essentielles supposée avoir un rollback. Les jobs sont dans le record. La reprise scanne les records ; aucun index indispensable à la réservation.

## Task 1 — Contrat et réservation atomique

**Files:** Create `api/_submission-contract.ts`, `api/_submission-store.ts`, `tests/api/submission-store.test.ts`, `tests/api/submission-contract.test.ts`, `scripts/test-submission-redis.mjs`.

**Interfaces:** `normalizeSubmission(input: unknown): SubmissionInput`, `submissionFingerprint(input: SubmissionInput): string`, `getSubmission(id: string): Promise<SubmissionRecord | null>`, `reserveSubmission(record: SubmissionRecord): Promise<ReserveResult>`.

- [x] Écrire les tests négatifs : 20 réservations concurrentes du même checkout donnent un seul `created` ; autre ID/contenu donne `conflict` ; retry exact donne `existing`. Le hash conserve exactement un record et un index checkout.
- [x] Tester `redis_unavailable_does_not_mean_missing`, `full_store_has_no_partial_reservation`, `script_error_preserves_existing_receipts`, `token_refresh_does_not_change_fingerprint`, `changed_recipient_or_language_conflicts`.
- [x] Exécuter `npm run test:api -- --run tests/api/submission-store.test.ts tests/api/submission-contract.test.ts` et constater les échecs avant implémentation.
- [x] Implémenter les interfaces et EVAL avec REST authentifié en header, endpoint HTTPS configuré côté serveur, timeout 3 secondes, aucun retry aveugle d'écriture. Limiter la charge normalisée à 16 Kio et les chaînes outil/rôle/URL à 300 caractères ; refuser les valeurs non textuelles. Empreinte SHA-256 d'un objet à ordre explicite incluant les champs email/contenu/formule, excluant les preuves temporaires.
- [ ] Tester sur Redis réel de recette : même concurrence, erreur de type/argument avant HSET et refus d'écriture. Le script de recette exige `SUBMISSION_REDIS_TEST_URL`/`SUBMISSION_REDIS_TEST_TOKEN`, utilise un hash temporaire propre, refuse l'URL de production et nettoie seulement ses clés. Pas de mock présenté comme preuve d'atomicité.
- [x] Relancer tests et `npm run typecheck:api` ; commit des cinq fichiers nommés.

## Task 2 — Brouillon stable et acceptation durable

**Files:** Modify `src/pages/SubmitToolPage.tsx`, `api/contact.ts`, `tests/api/handlers.test.ts`, `src/test/submit-payment.test.tsx`; Create `tests/api/submission-contact.test.ts`; préparer `api/_submission-mail.ts` pour construire les deux charges sans envoi.

**Interfaces:** `buildSubmissionJobs(input: SubmissionInput): Record<'internal' | 'confirmation', MailJob>` ; consomme les interfaces tâche 1.

- [x] Écrire `free_draft_id_survives_reload_and_retry`, `legacy_paid_reference_preserved`, `lost_acceptance_reply_returns_same_record`, `paid_conflict_never_sends`, `accepted_retry_during_creem_outage`, `unpaid_badge_bypass_stays_rejected`. Assert : une réservation, deux jobs, zéro email avant réservation ; panne Redis renvoie 503 et conserve le brouillon.
- [x] Exécuter ces tests et constater les échecs attendus.
- [x] Ajouter `submissionId` UUIDv4 au brouillon gratuit et payant. Pour un brouillon payé historique, reprendre sa `paymentReference` valide comme ID ; sinon créer et sauvegarder une fois. Garder `paymentReference` pour les métadonnées Creem, sans la régénérer sur un simple retry. Transporter l'ID à l'envoi final.
- [x] Extraire les charges email actuelles sans modifier leurs destinataires/textes. Pour une soumission : normaliser, lire un record existant, comparer son contenu ; si absent vérifier Creem ou badge puis réserver. Une reprise identique retourne `{success:true}` ; une mutation retourne 409. Un contact général ne requiert ni ID ni Redis. Les nouveaux appels outil sans ID sont refusés 400 ; les retours payés historiques avec référence valide sont compatibles.
- [x] Après persistance seulement, confirmer la réception et tenter les envois via tâche 3. Ne pas effacer un brouillon lors d'un 409/503. Ne pas prétendre que les emails sont livrés si seule l'acceptation est durable.
- [x] Relancer `npm run test:api`, `npm test -- --run src/test/submit-payment.test.tsx`, `npm run typecheck` ; commit des fichiers nommés. Pas de publication intermédiaire tant que la tâche 3 n'est pas intégrée.

## Task 3 — Emails, reprises et notifications intermédiaires

**Files:** Modify `api/_submission-store.ts`, `api/_submission-mail.ts`, `api/contact.ts`, `api/submission-progress.ts`, `src/pages/SubmitToolPage.tsx`; Create `api/submission-maintenance.ts`, `tests/api/submission-mail.test.ts`, `tests/api/submission-maintenance.test.ts`; Modify `tests/api/handlers.test.ts`.

**Interfaces:** `claimMail(id: string, kind: 'internal' | 'confirmation', owner: string): Promise<MailJob | null>`, `finishMail(id: string, kind: 'internal' | 'confirmation', owner: string, result: {providerId: string} | {uncertain: true}): Promise<boolean>`, `deliverSubmission(id: string): Promise<void>` ; `maintainSubmissions(action: 'retry' | 'archive' | 'suspend', cursor: string, id?: string): Promise<{cursor: string, processed: number}>`.

- [x] Écrire tests : deux exécutants donnent un seul bail ; bail 60 secondes ; propriétaire expiré refusé ; crash après envoi conserve la clé ; passé 24 heures, résultat ambigu `reconcile`, aucun envoi automatique ; email interne envoyé/confirmation échouée conserve la demande ; absence de token maintenance donne 401 sans accès Redis.
- [x] Exécuter les tests et constater les échecs attendus.
- [x] Implémenter les transitions atomiques du record via EVAL et HSET unique. Horloge serveur Redis pour les baux ; clé Resend `tt-submit/v1/<submissionId>/<kind>`. Premier envoi horodaté durablement avant réseau. Timeout email 8 secondes ; une exception/délai ambigu ne remet pas un job à zéro. Seul le propriétaire courant confirme le résultat.
- [x] Maintenance POST authentifiée via `Authorization: Bearer` et `SUBMISSION_MAINTENANCE_TOKEN`, comparaison sûre, jamais token en query. Scan avec curseur, COUNT 50 et maximum deux jobs envoyés par appel ; aucun cron/polling ajouté. Retour sans payload personnel. `suspend` conserve receipt/index et interdit de nouvelles livraisons. `archive` supprime le payload personnel des jobs terminés depuis 90 jours, garde ID/checkout/empreinte/états/preuves ; les jobs non terminés ne sont pas purgés. Cette rétention proposée figure dans la procédure de recette à valider avant activation.
- [x] Les notifications d'étapes restent informatives. Ne pas écrire leurs brouillons non vérifiés dans le registre durable. Ajouter une clé Resend stable par ID/étape/empreinte pour leurs retries immédiats et borner les champs ; aucune promesse de déduplication au-delà de 24 heures. Faire progresser le formulaire même si cette notification échoue, en préservant le brouillon. Aucun flag d'étape ne prouve le paiement ni le badge. L'anti-abus général de ces notifications reste un lot distinct : ne pas revendiquer sa résolution.
- [x] Relancer `npm run test:api`, tests app paiement et `npm run typecheck` ; commit nommé.

## Task 4 — Recette, configuration et publication conditionnelle

**Files:** Modify `e2e/submit-payment.spec.ts`, `docs/ROADMAP.md`, `docs/CHANGELOG_AI.md`, `docs/CORRECTIF_CREEM_2026-10-09.md`; Create `docs/SOUMISSIONS_UPSTASH.md`, `docs/proofs/submission-idempotency-2026-10-09/validation.json`.

**Interfaces:** Utilise les trois tâches ; documente les variables serveur `SUBMISSION_REDIS_URL`, `SUBMISSION_REDIS_TOKEN`, `SUBMISSION_MAINTENANCE_TOKEN`, plus les clés Creem/Resend actuelles. Le nouveau handler n'exige aucune autorisation navigateur/CSP vers Upstash.

- [x] Ajouter parcours FR/EN : retry identique, conflit et stockage indisponible gardant le brouillon ; notification intermédiaire échouée ne bloque pas la suite. APIs interceptées, paiement/email externes bloqués.
- [x] Passer `npm run test:api`, `npm test`, `npm run typecheck`, `npm run test:seo-contracts`, `npm run build`, `npm run test:e2e:payment`. Vérifier sitemap/canonical/hreflang/H1 et absence de secret Redis dans les bundles. Comparer hors périmètre catégories locales ; ne pas attribuer leurs tests au lot.
- [ ] Produire une preuve Redis réel de recette, compteur de commandes et taille par demande avec chaque branche/retry. Documenter la capacité estimée à partir de ces mesures et du quota réellement visible du compte, sans promesse d'illimité.
- [x] Préparer export/restauration privé du hash et procédure d'incident : désactiver les nouvelles acceptations après perte/restauration ancienne ; réconcilier les reçus postérieurs via les traces Creem/emails avant réouverture. Export contenant des données personnelles hors Git. Tester que les demandes archivées et suspendues ne libèrent pas leur checkout.
- [x] Obtenir une relecture indépendante du diff complet et corriger les défauts ; inscrire les résultats et limites dans la preuve. Commit local, fichiers nommés uniquement.
- [ ] Avant activation, vérifier dans le compte : base durable Free appartenant au propriétaire, éviction désactivée, aucune carte/bascule payante, variables serveur présentes sans exposer leurs valeurs. Vérifier retour/clé/métadonnées Creem ; accès Vercel 403 actuel à résoudre. Valider la rétention 90 jours et l'exploitation de la reprise manuelle. Aucune base temporaire 72 heures.
- [ ] Publier seulement avec configuration attestée et autorisation de publication ; vérifier CI/artefact et recette publique sans paiement/email client. Si l'accès reste indisponible, conserver les commits locaux et déclarer l'activation bloquée, sans prétendre que Redis ou la déduplication sont actifs.

## Passage à l'exécution

Recommandation : **native**, dans cette session, avec relecture indépendante finale. Ces tâches partagent les mêmes records/transitions ; une seule implémentation limite les dérives d'interface. Plan exécuté par méthode native avec une relecture finale indépendante et une passe de corrections vérifiées. La préparation du compte et la publication restent des étapes distinctes, sans facturation implicite.

### Limites de clôture

Les opérations atomiques ont été exécutées sur Redis réel local 7.2.7 et sur Upstash REST. Exception explicitement autorisée : préactivation sur un namespace fictif temporaire du compte Free, registre production vide et lu seulement. Recette concurrente PASS (68 appels REST), export/restauration fictif PASS (16 appels REST), nettoyages vérifiés. Compteur global relevé ; ventilation facturée par branche et capacité restent non établies. Aucun export/restauration de données production réalisé. Les cases de configuration et publication restent ouvertes. La CI inclut désormais Redis réel ; ce workflow modifié n’a pas encore tourné sur GitHub.

### Contrôles restants avant activation

- Resend : connexion, domaine/SPF/DKIM/envoi et expéditeur existant vérifiés ; clé récemment utilisée limitée à Sending access. Aucun envoi du nouveau handler ni comparaison de valeur secrète Production.
- Authentification de la clé Creem locale LIVE et propagation réelle des métadonnées confirmées sur session non payée ; vérificateur réel refuse pending. Retour produit observé, retour après paiement terminé non exercé ; valeur Vercel irrévélable non comparée.
- Rétention 90 jours, accès privé au secret maintenance, destination/fréquence des sauvegardes et procédure de réconciliation à valider.
- Autorisation de publication, puis vérification CI et artefact public.
