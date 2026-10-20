# Account experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à ToolTrim une UX de compte complète, familière et simple avant de développer l'espace éditeur.

**Architecture:** Conserver le coordinateur unique, le stockage v4 et les API de stack. Ajouter les opérations Auth Google/GitHub/mot de passe, un profil privé minimal et une présentation centrale intégrée au shell/SSR, sans collecte persona anticipée.

**Tech Stack:** React18, React Router7 déclaratif, Vite6, TypeScript, Radix Dialog/Popover existants, supabase-js2.99.1 installé, API Vercel, PostgreSQL/PGlite.

**Spec:** `docs/superpowers/specs/2026-10-21-account-experience-design.md`.

## Global Constraints

- Design ToolTrim actuel : shell existant, tokens, CSS préfixé dans `@layer components`, icônes centralisées, CTA neutres, clair/sombre, FR/EN, clavier et 390/1440px sans débordement de page.
- Une stack personnelle complète par compte ; fiches JSON et paiements/soumissions existants hors scope.
- Aucune collecte de persona/métier/entreprise/onboarding obligatoire ; nom facultatif dans paramètres seulement.
- Google + GitHub + e-mail/mot de passe dans le parcours public ; pas de code e-mail public concurrent.
- Un seul coordinateur Auth/synchronisation dans chaque application ; SSR sans effets Auth ni fetch privé.
- Les deux flags comptes restent désactivés par défaut ; disponibilité OAuth déclarée explicitement pour chaque fournisseur. La simulation locale les active sans appel externe.
- Aucun secret serveur dans le navigateur ; droits jamais dérivés de user_metadata ; profil/stack toujours attachés au sujet validé.
- Pas de migration distante, création réelle d'identité/e-mail, association réelle de fournisseur, modification SMTP/OAuth, achat, push ou déploiement dans ce lot.
- Conserver le dépôt original sale, la copie isolée et la stack de démonstration actuelle lors de la mise à jour de la prévisualisation.

## Review Focus

1. Fermeture puis réouverture d'un formulaire en cours : aucun blocage busy, aucun mot de passe persisté, une seule mutation d'identité à la fois, succès SDK encore reflété sans confondre A/B.
2. Confirmation/récupération modifie ou renouvelle la session pendant l'action : traiter le succès réel, les liens expirés et l'échec partiel après mise à jour sans double mutation.
3. Menu de compte sur une fiche SSR avec flag activé : aucun contexte manquant ni abonnement supplémentaire, alternance FR/EN conserve le compte.
4. Réponse profil A après connexion B, profil indisponible ou deleting : aucune identité erronée, nom supposé enregistré ou donnée privée résiduelle.
5. Paramètres thème/devise/langue sur mobile/sombre : commandes réellement synchronisées, pas de débordement, route privée noindex et lien direct fonctionnel hors serveur Vite.

## File structure / contracts

- `src/lib/accountAuth.ts`: types et opérations SDK d'identité sans abonnement autonome ; pas de stockage de mots de passe.
- `src/lib/accountPaths.ts`: routes localisées et destinations de retour assainies.
- `src/lib/stackAccountCoordinator.ts`, `src/hooks/useStackAccount.ts`: propriétaire unique des sessions/actions et récupération ; stores/CAS existants inchangés.
- `src/App.tsx`: fournisseur commun dans LangLayout au-dessus du shell/Outlet ; supprimer enveloppements redondants App et entry-server.
- `src/hooks/useTheme.ts`: même API `{theme,setTheme,toggle}`, état partagé entre consommateurs, mêmes clé et snapshot SSR.
- `src/lib/accountProfile.ts`, `accountProfileApi.ts`, `src/hooks/useAccountProfile.ts`: DTO, client et cache privé isolé ; `api/account-profile.ts` et RPC de profil dans migration générée CLI.
- `src/components/account/AccountExperienceProvider.tsx`: intention de fenêtre/actions de sortie, état profil, aucune seconde souscription Auth.
- `AccountAuthForm.tsx`, `AccountAuthDialog.tsx`, `AccountMenu.tsx`, `AccountLifecycleDialog.tsx`: interfaces partagées et contrôles réels.
- `src/pages/AccountAuthPage.tsx`, `AccountCallbackPage.tsx`, `AccountRecoveryPage.tsx`, `AccountSettingsPage.tsx`: liens directs/retours/paramètres, mêmes formulaires et callbacks.
- `src/components/stack/StackAccountPanel.tsx`: état/action courts, résolutions de brouillon/conflit conservées, auth/suppression centralisées.
- `src/components/v2shell/AppShellV2.tsx`, `MobileMenu.tsx`, `src/lib/seo.ts`, `vercel.json`: navigation, traduction de routes et fallbacks privés ; `src/index.css` styles `ac-*` uniquement.

## Task 1 — Authentification et contexte commun

**Files:** créer `src/lib/accountAuth.ts`, `accountPaths.ts` et leurs tests ; modifier coordinateur/hook avec tests existants, `App.tsx`, `entry-server.tsx`, `entry-server.accounts.test.tsx`, `useTheme.ts` et nouveau `useTheme.test.tsx`, `src/config/features.ts`.

**Consumes:** socle final `b2c2ca7c91`, SDK2.99.1 et spec.
**Produces:**
- `AuthResult = {ok:true;outcome:'signed-in'|'redirecting'|'confirmation-required'|'email-sent'|'password-updated';warning?:string}|{ok:false;error:string}`.
- Contexte : `signInWithProvider(provider:'google'|'github',options?)`, `signInWithPassword(email,password,options?)`, `signUpWithPassword(email,password,options?)`, `resendConfirmation(email,options?)`, `requestPasswordReset(email,options?)`, `completePasswordReset(password):Promise<AuthResult>` ; anciennes actions compatibles pour les tests/clients transitoires, mais nouvelles vues n'emploient pas OTP.
- `getAccessToken():Promise<string|null>` retourne le token de la session actuelle uniquement ; pas de nouvel abonnement, pas de token dans les données de profil.
- Snapshot : `authBusy:boolean`, `recoveryStatus:'none'|'ready'|'complete'|'invalid'` ; garde récupération privée liée au sujet/session, nettoyée à sortie/suppression. Un succès updateUser suivi d'échec de révocation renvoie ok/password-updated + warning.
- `accountPath(lang,kind)` kind `signin|signup|callback|reset|settings` : FR `/connexion`, `/inscription`, `/connexion/retour`, `/compte/reinitialiser`, `/compte/parametres`; EN `/sign-in`, `/sign-up`, `/sign-in/callback`, `/account/reset-password`, `/account/settings`.
- `safeAccountReturnTo(input,lang,origin):string` chemin relatif connu même origine, défaut `/:lang/ma-stack`, transport Auth exclu, retour interdit vers callback/reset pour éviter boucles. Étendre helper existant sans redirection ouverte.
- Disponibilité : `ACCOUNT_GOOGLE_ENABLED` / `ACCOUNT_GITHUB_ENABLED` depuis flags `VITE_ACCOUNT_GOOGLE_ENABLED` / `VITE_ACCOUNT_GITHUB_ENABLED` égaux à true explicite, défaut faux.

- [ ] RED : SDKsignup avec confirmation sans session ; login mauvais mot de passe ; password non trimé ; GitHub provider sans scopes repo ; renvoi/rate limit ; récupération valide/expirée/forgée ; USER_UPDATED/TOKEN_REFRESHED pendant reset ; révocation others échoue après succès ; mutation busy/fermeture sans collision ; cleanup session/identité A→B. Garder les régressions CAS/privacy existantes.
- [ ] RED : appels réels renderCartPage quatre aliases + renderHomePage et une fiche représentative, flags faux/vrai, H1 et zéro fetch privé ; un seul start du coordinateur entre routes/langues. Deux consommateurs useTheme : modification reflétée immédiatement et storage refusé ne bloque pas.
- [ ] Implémenter les contrats via SDK existant ; `signOut({scope:'others'})` après password update, gérer succès partiel ; aucune utilisation de `currentPassword` indisponible en 2.99.1. Annuler/borner les anciennes requêtes d'UI sans mentir sur une mutation SDK déjà partie. Les opérations d'identité sont sérialisées et les contrôles concurrents utilisent authBusy.
- [ ] Déplacer provider dans LangLayout, enlever doublons et préserver LangLayout au changement d'Outlet/langue ; thème partagé et snapshot SSR déterministe. Ne pas ajouter de fallback silencieux au contexte.
- [ ] GREEN : tests ciblés Auth/coordinator/SSR/thème, app typecheck et lint des chemins ; commit explicite `feat: add complete account authentication flows`.

## Task 2 — Profil privé et contrat de paramètres

**Files:** créer `api/account-profile.ts`, `tests/api/account-profile.test.ts`, `src/lib/accountProfile.ts`, `accountProfileApi.ts`, `accountProfileApi.test.ts`, `src/hooks/useAccountProfile.ts`, `useAccountProfile.test.tsx` ; modifier types Supabase, script SQL runner ; créer migration/rollback `<CLI-generated>_account_profile_settings.sql` et `supabase/tests/account_profile_settings.test.sql`.

**Consumes:** helper `_account-auth.ts`, session/owner/barrière existants, Task1 types.
**Produces:**
- `AccountProfile {userId:string,displayName:string|null,email:string|null,emailConfirmed:boolean,createdAt:string,updatedAt:string,canAccessBackoffice:boolean}` ; contrôles DTO non tolérants à une source invalide.
- GET/PUT `/api/account-profile` → `{profile:AccountProfile}` ; PUT `{displayName:string|null}` seul, nom trimé max80 caractères et sans caractères de contrôle, corps borné4KiB ; aucun owner/rôle éditable.
- `loadAccountProfile(token,signal?):Promise<AccountProfile>`, `saveAccountProfile(token,displayName,signal?):Promise<AccountProfile>`.
- Hook `useAccountProfile(userId,token,enabled)` → `{profile,status:'idle'|'loading'|'ready'|'saving'|'error',error,saveDisplayName,retry}`. Le provider appelle `getAccessToken()` de Task1, borne le résultat à l'identité et la génération, et passe le token au hook, jamais en profil/URL.
- RPC `read_personal_profile(p_owner,p_session)`, `update_personal_profile(p_owner,p_session,p_display_name)` ; réponses profil+createdAt Auth, locks/session/deleting et service-only. API ajoute e-mail confirmé/capacité à partir du helper vérifié, pas de métadonnées d'autorisation.

- [ ] Générer le nom de migration avec CLI `supabase migration new account_profile_settings` après découverte --help ; ne pas inventer d'horodatage. Nom exact consigné au contrat/rapport ; rollback même basename. Aucun DDL distant.
- [ ] RED API : anon/révoqué refusés ; owner body/role refusés ; autre propriétaire inaccessible ; nom vide normalisé null, contrôle/81caractères refusé ; limite4KiB avant parsing ; missingconfig503 ; email non confirmé ne devient pas confirmé ; allowlist serveur seule.
- [ ] RED SQL : session A/B, accès anon/authenticated refusé, get/update ne touchent que l'owner, deleting409, nom valide/invalid, nom n'altère pas stack/identités ; rollback conserve valeurs et révoque execute.
- [ ] RED hook/client : réponse A tardive ignorée sur B, logout efface immédiatement profil, sauvegarde ratée jamais annoncée réussie, retry réel, erreur source distincte de null.
- [ ] Implémenter invoker/search_path/service-only, réutiliser tables existantes sans schéma persona ; nom seul last-write-wins. Générer types nécessaires dans contrat maintenu localement, aucune clé service client.
- [ ] GREEN API/hook et SQL18 ; root contrôle SQL17 ; type/lint/diff ; commit `feat: add private account profile settings`.

## Task 3 — Expérience visible du compte

**Files:** composants/pages indiqués dans File structure + tests `src/components/account/AccountExperience.test.tsx`, `src/pages/AccountSettingsPage.test.tsx`, `AccountRecoveryPage.test.tsx` ; modifier AppShellV2/MobileMenu/App/CartPanel/CSS/BackOfficePage (connexion enabled via action commune), `seo.ts`, `vercel.json`, `scripts/generated-routing.test.mjs` ; adapter tests de panel/shell touchés.

**Consumes:** Task1 actions/routes/authBusy et Task2 profil. AccountExperienceProvider monté sous LangContext/Currency et au-dessus shell/Outlet ; zéro nouveau listener Auth. `useAccountExperience()` fournit `openAuth(mode:'signin'|'signup',returnTo?)`, `requestSignOut()`, `requestDeleteAccount()`, `profile` et actions profil. LifecycleDialog est lancé seulement par ces actions, pas par observation globale de toute demande historique du back-office.
**Produces:** parcours et paramètres conformes à la spec, liens directs et même formulaire. `authBusy` global bloque doubles mutations même après fermeture/réouverture ; mot de passe local au formulaire et effacé à fermeture/mode/succès/changement d'identité.

- [ ] RED formulaire : différenciation sign-in/sign-up, Google+GitHub+email, new/current autocomplete, show/hide, validation8caractères sur nouveau et sans min sur login, confirmation e-mail/réinitialisation/rate limit, pas de signup implicite dans login, retour safe et fermeture/focus/busy.
- [ ] RED settings/menu : aperçu anonyme/expiré/indisponible, nom sauvegardé puis retour serveur et backoffice, identités réelles, préférences partagées et mention appareil, export JSON owner/draft local, sortie dirty cancel/confirm et suppression protégée, profil A jamais visible chez B.
- [ ] Après sign-in, attendre hydration et résoudre pendingDraftChoice dans le parcours central (mêmes actions que Ma stack), puis destination demandée. En erreur de sauvegarde, compte connecté/stack indisponible restent distincts et le brouillon conservé ; aucune fermeture prématurée qui cache le choix sur une fiche outil.
- [ ] Implémenter UI ToolTrim avec primitives existantes, classes ac-* dans couche components, header/mobile 44px. Pas de bouton éditeur/persona fantôme, pas de collecte obligatoire, pas de skin Toolfolio. Settings possède une seule hiérarchie de titres, pas un main imbriqué.
- [ ] CartPanel garde états/retry/résolutions et ouvre auth commune ; retirer ancien formulaire public code et commandes compte lourdes. Connexion admin enabled réutilise mutation commune, disabled méthode historique conservée.
- [ ] Ajouter routes App, liens de langue traduits et rewrites client-only exacts dans vercel.json ; noindex pour routes privées sans données personnelles statiques. Inconnu reste404, pages catalogue/prérendues non interceptées.
- [ ] GREEN composants/routecontracts/type/lint et vrais rendus FR/EN390/1440 clair/sombre ; commit `feat: build ToolTrim account navigation and settings`.

## Task 4 — Recette intégrée et prévisualisation

**Files:** modifier `e2e/fixtures/accounts-server.mjs`, `e2e/fixtures/accounts.ts`, specs comptes/backoffice/lifecycle ; créer `e2e/account-experience.spec.ts` et inclure dans config comptes ; actualiser `docs/STACK_ACCOUNT_OPERATIONS.md`, `CHANGELOG_AI.md`, `ROADMAP.md` et conception/plan outputs. Prévisualisation extérieure `/work/accounts-preview.mjs` gérée par root seulement, jamais dans le produit.

**Consumes:** Tasks1–3, fixture SDK existante avec blocage strict des autres origines.
**Produces:** preuve de tous les parcours et visibilité locale réelle, configuration à activer séparément.

- [ ] RED : fixture routes SDK signup/token/password/confirmation-resend/recovery/user-update/Google/GitHub et profil, .invalid seulement. Mot de passe absent des logs/stockages applicatifs, méthodes simulées jamais importées dans le produit. Liens de test consommés via écran `/__accounts-test/mailbox` de la fixture locale uniquement, jamais de mail réel.
- [ ] Adapter les anciennes recettes OTP aux parcours mot de passe publics sans affaiblir fullstate/CAS/privacy. Couvrir création→confirmation→session→stack entière→autre contexte, forgot→lienvalide/expiré→update→connexionnouveaupass, deux OAuth succès/annulation et retour fiche, identités/nom/profile reread, data/export/logout/delete, profil A tardif/B.
- [ ] Tester header/modal/settings en FR/EN390/1440, clair/sombre, clavier/focus/Escape, aucune erreur JS ni débordement, aucune requête externe. Directlinks sur serveur généré, noindex et réglages de langue ; flagoff n'effectue aucun Auth/profilefetch.
- [ ] Root préserve utilisateur/stack de démo avant tout redémarrage ; cacheDir preview distinct des fixtures/tests. Nouveaux endpoints locaux et méthodes réelles SDK simulées ; ne pas réinitialiser la stack de l'utilisateur pour simplifier la démo.
- [ ] Mettre à jour opérations : Google et GitHub, templates confirmation/recovery, exacts callbacks, SMTP/variables/allowlist et migrations en ordre, ancienne UIcode remplacée, recette réelle toujours ouverte ; aucun service distant activé.
- [ ] Author vérifie nouvelles E2E et tests ciblés modifiés ; root lance UNE recette intégrée finale app/stack/API/SQL/type/build, puis review globale. Éviter build et fullsuite SSR lourde simultanés (délai5sec observé au lot précédent).
- [ ] Commit `test: verify complete account experience` ; livrer screenshots, rapport FR et bundle mis à jour dans outputs. Préserver changements originaux hors périmètre ; aucune publication automatique.
