# ToolTrim — revue sécurité/backend, 7 octobre 2026

Audit local en lecture seule. Aucun appel aux endpoints réels, aucun email, aucune mutation DB, aucun déploiement. Les reproductions chargent le TypeScript actuel dans une VM Node avec Supabase/Resend remplacés par des mocks. Aucun secret lu ou divulgué. Les constats portent sur le code présent ; leur exposition en production dépend des déploiements, non vérifiés ici.

## Constats prioritaires

### P1 — Deux fonctions de maintenance écrivent sans authentification

Preuves : `supabase/config.toml:21-25`, `supabase/functions/enrich-tools/index.ts:486-508`, `supabase/functions/seed-tools-enrichment/index.ts:158-184` et `:190-224`.

Les deux fonctions désactivent `verify_jwt`, puis créent immédiatement un client service_role. Aucun contrôle de clé admin/session ni contrôle de méthode ne précède les writes. Une simple requête GET à enrich-tools réapplique les descriptions/verdicts/tarifs figés de son payload ; seed-tools-enrichment upsert des outils et clusters et remplace leurs champs. Cela contourne les protections RLS et peut écraser une édition plus récente du catalogue legacy. Le payload est figé : cela ne permet pas d'injecter arbitrairement n'importe quelle valeur SQL.

Reproduction locale : handler enrich-tools appelé avec `{method:'GET'}` sans headers ; **53 appels update simulés, HTTP 200**. Aucun endpoint réel appelé. La deuxième fonction confirme statiquement la même chaîne ; son handler n'a pas été exécuté.

Correction : protéger les deux fonctions avec l'autorisation serveur de maintenance utilisée par seed-content/seed-diagnostic, exiger POST, ou les retirer des fonctions déployées si obsolètes. Simplement réactiver verify_jwt n'est pas un contrôle admin suffisant pour un script de maintenance.

Confiance élevée sur le code ; déploiement/exploitabilité live inconnus. [Supabase : sécurisation des Edge Functions](https://supabase.com/docs/guides/functions/auth) confirme le rôle de verify_jwt et des contrôles internes ; [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) confirme le bypass service_role.

### P1 — La soumission accepte une publication payée ou gratuite sur simple déclaration client

Preuves : `api/contact.ts:148-172`, `:180-204`, `:220-228` ; `src/pages/SubmitToolPage.tsx:41-50`.

`isPaidSubmission` dépend exclusivement de `Boolean(req.body.paid)`. Aucune transaction Creem vérifiée côté serveur n'est requise. Le contrôle badge dépend également de `req.body.badgeReview`. En envoyant `submissionType:'tool', paid:true, badgeReview:false` avec les champs de formulaire valides, un visiteur reçoit une confirmation de création prioritaire et le rédacteur reçoit un email « PAYANT 29 $ / Formulaire validé / Publication garantie sous 5 jours ». En envoyant `paid:false, badgeReview:false`, il saute également entièrement la vérification badge du parcours gratuit.

La page déclenche en plus `setPaid(true)` au seul retour `?paid=1` accompagné d'un draft local ; aucun identifiant de paiement confirmé n'est ensuite envoyé à contact.ts. Le problème principal est serveur : une requête directe suffit sans manipuler l'UI.

Reproduction locale avec Resend mocké : **les deux payloads -> HTTP 200, 2 emails simulés, 0 vérification badge**. Payload paid:true -> sujet admin `[PAYANT 29 $][3/3] Audit tool — Formulaire validé`.

Correction : dériver le statut payé d'une transaction serveur Creem validée/signée et liée à cette soumission, puis exiger un badge valide pour toute soumission gratuite. Ne pas décider du contrôle requis à partir de badgeReview fourni par le client. Définir explicitement l'état « paiement en attente » si le contrôle est manuel.

Confiance élevée. Aucun constat de publication automatique gratuite : la publication semble manuelle ; le dommage démontré est une validation/facturation opérationnelle falsifiable. [Creem : webhooks](https://docs.creem.io/code/webhooks) documente checkout.completed et la vérification des signatures comme preuve serveur.

### P2 — Les endpoints email peuvent être automatisés pour saturer la messagerie et le quota

Preuves : `api/contact.ts:153-158`, `:199-228` ; `api/submission-progress.ts:33-63`.

Chaque appel valide produit un email au rédacteur ; une soumission produit en plus un email à l'adresse fournie par l'appelant. Il n'y a dans ces handlers aucun quota, limitation par IP/adresse, CAPTCHA, déduplication ni preuve de possession de l'adresse. Le contournement gratuit ci-dessus laisse même déclencher ces deux envois sans héberger de badge. Un script peut répéter les requêtes pour remplir la boîte contact, consommer le quota Resend et envoyer des confirmations non sollicitées à des tiers. Les chaînes sont échappées HTML ; il ne s'agit pas d'une injection HTML démontrée.

Correction : limitation persistante/partagée et déduplication des soumissions, protection antiautomatisation adaptée, quota par adresse et fenêtre de temps. Une restriction CORS ne suffit pas contre un client HTTP direct.

Confiance élevée sur absence de protections applicatives ; règles WAF Vercel/débit Resend hors dépôt et non inspectées, donc ampleur live inconnue. Les appels du mock confirment l'envoi en l'absence de contexte auth ; aucun spam réel effectué.

## Observation confidentialité à traiter

`index.html:9-15` charge DataFast cookieless sur toutes les routes avant tout choix utilisateur ; `src/components/AnalyticsConsent.tsx:55-57` présente seulement Google Analytics, et `src/pages/PrivacyPolicyPage.tsx:63-66` ne liste que Supabase et Google Analytics comme prestataires. Documenter le traitement DataFast et son fournisseur dans l'information utilisateur. Ce constat est une incohérence factuelle du document actuel, **pas une conclusion juridique sur l'obligation de consentement d'un service cookieless**. Aucun trafic réseau/cookie DataFast observé en runtime ici.

## Couverture et contrôles qui semblent cohérents

- Lu AGENTS.md et le skill Supabase. Inventaire des 58 fichiers suivis api/functions/migrations ; revue ciblée des règles d'auth, grants, policies, handlers et points d'entrée, pas une lecture intégrale de chaque payload éditorial de seed.
- API : les quatre fichiers api/contact.ts, api/submission-progress.ts, api/verify-badge.ts, api/_badge-verification.ts lus. Token badge HMAC avec expiration, URLs liées et comparaison timingSafeEqual ; relecture badge à la soumission lorsqu'elle est exigée. Vérifications HTTPS/DNS publiques et redirects du fetch examinées.
- Fonctions : entrées/auth de seed-content, seed-tools-v4, seed-diagnostic, translate-tools, enrich-tools, seed-tools-enrichment, generate-report, backoffice-diagnostic, process-diagnostic-email-jobs, diagnostic-email-webhook, send-backoffice-alerts, delete-account. Backoffice vérifie un secret admin ou getUser + allowlist email avant les données. Workers exigent un secret. Webhook vérifie signature ou secret dédié. Delete-account vérifie getUser et supprime uniquement cet ID.
- SQL : anciennes policies public-write de tools/categories retirées par GO24 ; vues backoffice security_invoker et droits client révoqués. Profiles/stack_snapshots RLS utilisent auth.uid et ownership dans USING/WITH CHECK. claim_diagnostic_email_jobs réservé service_role. `scripts/go28-diagnostic-rls.sql` contient la SELECT policy session-token absente de la migration initiale : ne pas signaler l'absence initiale sans vérifier cet état additionnel.
- Catalogue v4 : fichiers contract-v4 non suivis dans le checkout, statuts live inconnus. Revue ciblée V4-schema-cible.sql, V4-projections-transition.sql, V4-public-tools-transition-hardening.sql et contribution-ledger-hardening. Projections sont volontairement à privilège catalog_owner, avec filtres de publication explicites et exposition restreinte ; absence security_invoker seule ne prouve pas une fuite. Vérification DB/RLS réelle requise pour certifier l'état.
- Frontend : useStackAccount.ts, backofficeApi.ts, client Supabase, AnalyticsConsent.tsx, AnalyticsPageView.tsx, analytics.ts, scripts analytics index.html, PrivacyPolicyPage, points de soumission. user_metadata n'est utilisé que pour nom/avatar dans le compte, pas comme règle d'autorisation observée.
- Vercel : HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy et CSP présents. CSP autorise unsafe-inline/unsafe-eval ; sans injection concrète identifiée, ce n'est pas présenté comme vulnérabilité autonome.

## Limites

Aucune inspection des schémas/grants/policies en DB réelle, liste des Edge Functions déployées, paramètres Supabase Auth (confirmation email, redirect allowlist, quotas), ACL Storage, secrets, sessions, journaux, paramètres WAF, factures/transactions Creem ou trafic navigateur. Pas de mutation/probe sur les endpoints : GET enrich-tools lui-même modifierait les données. Pas de test de DNS rebinding/SSRF actif ni de charge. Le changelog Supabase markdown a été demandé mais web tool ne l'a pas ouvert (content-type text/markdown non supporté) ; les pages officielles pertinentes ont été consultées. Aucun P0 établi.

Mémoire utilisée uniquement pour rappeler la séparation catalogue legacy/canonique et le besoin de revérifier l'état déployé, pas comme preuve actuelle : MEMORY.md:767-768, rollout 01a099db-558b-73e2-8ccd-d19b75ddbe0d.

## Suivi local du 7 octobre — correction autorisée du premier P1

Les deux handlers maintenance sont maintenant protégés avant toute création de client par `supabase/functions/_shared/maintenance-auth.ts`, avec le contrat SEED_ADMIN_KEY/x-admin-key existant dans les autres seeds. POST requis ; 401 clé absente, 403 clé incorrecte, 405 méthode incorrecte, 503 secret serveur absent. OPTIONS reste sans activité DB. Aucun déploiement effectué : l'exposition des anciennes versions en production reste inconnue.

Validation : 16 tests d'intégration locale des deux handlers dans src/test/security/maintenanceAuth.spec.ts. Tests écrits d'abord : 13 échecs observés avant correction, puis 16/16 réussites, avec zéro client et zéro écriture sur toutes les réponses de refus. npx tsc --noEmit et git diff --check réussis. npm test complet : 216 réussites/217, un timeout sur useToolBySlug.test.tsx (« restores the SSR record when navigating back from another listing ») ; relance ciblée de ce fichier : 2/2 réussites, test concerné en 3874 ms. Les P1 soumission/paiement et P2 abuse email restent ouverts.
