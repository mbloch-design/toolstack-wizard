# ToolTrim — expérience de compte complète

## Intention confirmée

Le socle comptes/stack existe et ses tests techniques passent, mais l'utilisateur considère l'UX incomplète. Les références Toolfolio illustrent des conventions attendues (connexion, inscription, avatar/menu, paramètres), sans autoriser une copie de leur identité graphique. ToolTrim doit servir le choix et la gestion d'une stack, avec une inscription courte et des contrôles de compte familiers.

Choix explicites du 21 octobre : Google + GitHub + e-mail/mot de passe. Ce choix remplace le code e-mail dans le parcours public. Le persona, le métier, l'entreprise, les objectifs et la qualification progressive appartiennent aux évolutions prochaines ; aucune question de ce type ne conditionne l'inscription.

L'utilisateur a demandé l'autonomie et l'usage des agents dans cette session, puis nous confie les choix UX adaptés à ToolTrim. Le contrôleur formalise les décisions ci-dessous et poursuit selon cette délégation ; aucune activation distante, publication ou opération payante n'en découle.

## Approche choisie

Une fenêtre partagée de connexion/inscription préserve le contexte de découverte. Des routes dédiées réutilisent les mêmes formulaires pour les liens directs et les retours d'authentification. Une vraie page de paramètres regroupe le compte. Cette approche conserve mieux l'action commencée qu'une redirection systématique vers une page de connexion et reste plus cohérente qu'un portail externe.

### Accès global

- Visiteur : action « Se connecter » dans le header, avec accès explicite à « Créer un compte » dans le formulaire. Sur mobile, cible icône de 44px et nom accessible ; aucune collision avec recherche, Ma stack et menu.
- Connecté : photo disponible avec initiale de secours, nom d'affichage ou e-mail de secours ; menu avec identité, Ma stack, Paramètres et déconnexion. L'accès back-office n'apparaît que sur capacité confirmée par le serveur ; aucun rôle de métadonnées ne confère un droit.
- Pas d'entrée éditeur vide, de communauté fictive ni de contrôle sans effet.
- Menu et fenêtre accessibles : clavier, Échap, focus initial/restauré, page arrière non interactive, annonces d'erreurs, fermeture pendant une requête sans blocage permanent.

### Connexion et inscription

- Deux modes lisibles, titres et boutons distincts. Google et GitHub dans les deux ; « Continuer avec l'e-mail » révèle le formulaire adapté.
- Connexion : e-mail et mot de passe, affichage/masquage, gestionnaire de mots de passe, « Mot de passe oublié ? », lien vers création.
- Inscription : e-mail et mot de passe, affichage/masquage ; pas de questionnaire ni de double saisie du mot de passe. Expliquer le bénéfice ToolTrim : retrouver et gérer sa stack.
- Création et nouvelle définition : 8 caractères minimum, phrases et espaces acceptés, pas de composition imposée. La connexion accepte les mots de passe existants non vides, même plus courts. Ne jamais trim un mot de passe.
- Autocomplete `username`, `current-password` ou `new-password` selon l'action. Aucun mot de passe en URL, stockage, journal ou analytics.
- Après inscription nécessitant confirmation : écran « Vérifiez votre e-mail », renvoi borné et retour vers connexion ; ne pas prétendre que le compte est confirmé avant le fournisseur.
- Erreurs compréhensibles : identifiants invalides sans révéler l'existence d'un compte, e-mail non confirmé avec renvoi, limitation de débit, panne, refus OAuth. Aucune réussite simulée dans le produit.
- Après succès : attendre la fin de la lecture initiale de stack ; afficher le choix explicite du brouillon dans le parcours central s’il diverge, puis revenir à la route/action commencée. Les mêmes choix restent accessibles dans Ma stack, sans nouvelle fusion automatique. En panne, distinguer compte connecté et sauvegarde indisponible, avec sortie possible et réessai conservant le brouillon. Les intentions/prix/décisions sont conservés.
- La mention de méthode récemment utilisée repose sur un succès local réel et stocke seulement `google`, `github` ou `email`, jamais une adresse ni un mot de passe.

### Mot de passe oublié et récupération

- Demande par e-mail depuis connexion et paramètres ; réponse neutre, lien de retour Supabase exact vers la page de réinitialisation, sans redirection ouverte.
- Nouvelle saisie + confirmation sur page dédiée, lien invalide/expiré avec nouvelle demande. Un simple paramètre `recovery=true` ne suffit pas à déclarer une session récupérée.
- Le SDK reste propriétaire de l'échange/lecture du lien. L'application ne retire pas ses paramètres avant leur consommation. L'événement `PASSWORD_RECOVERY` et la session correspondante alimentent un état de récupération ; toute persistance de cet état est liée à l'identité/session et reste un contrôle UX, jamais une autorité serveur.
- Les URL de retour stockées et affichées excluent les tokens de transport. Après consommation, nettoyer l'URL sans supprimer l'intention de navigation autorisée. Ne pas journaliser les liens secrets.
- `updateUser({password})` sur session autorisée, puis fermeture des autres sessions par le fournisseur. Une erreur de révocation après changement ne doit jamais annoncer que le changement a échoué : succès et avertissement distincts, sans répéter aveuglément la mutation.
- Aucun formulaire normal connecté ne change un mot de passe sans preuve de récupération récente ; les paramètres passent par le lien e-mail. Les exigences de réauthentification/nonce retournées par Supabase sont traitées explicitement, sans contournement.

### Paramètres du compte

Page `/fr/compte/parametres` et `/en/account/settings`, avec H1 et fil d'Ariane dans le shell existant, états chargement/visiteur/session expirée/indisponible.

1. **Profil** : photo ou initiale, nom d'affichage facultatif modifiable (80 caractères max), e-mail confirmé et date de création. Le nom est stocké dans `profiles.display_name`, sans changer l'identité ni les droits.
2. **Connexion et sécurité** : identités réellement associées à l'utilisateur, demande de définition/réinitialisation du mot de passe, déconnexion. Pas de prétendue association de fournisseurs dont les identités sont absentes ; association/dissociation manuelle n'est pas incluse.
3. **Préférences d'affichage** : thème et devise existants, clairement indiqués « sur cet appareil ». Langue via route FR/EN ; pas de nouvelle collecte ni de synchronisation fictive. Les commandes du shell et de la page restent cohérentes immédiatement.
4. **Stack et données** : lien Ma stack, état réel de sauvegarde, export JSON de la version présente sur l'appareil avec avertissement si non synchronisée ; suppression de compte via confirmation et protection contributive existantes.

La déconnexion depuis menu/paramètres utilise la même confirmation de modifications non enregistrées, les mêmes échecs/reprises et le même nettoyage privé que le coordinateur actuel. Les avertissements de stockage bloqué restent visibles après sortie. Le nom/profil d'A ne s'affiche jamais dans le compte B, même avec réponse tardive.

### Ma stack

Le bloc de sauvegarde devient une interface courte : état de sauvegarde, action de compte si visiteur, paramètres si connecté. Il ouvre le parcours central. Les résolutions de brouillon/conflit et les réessais restent dans le contexte de la stack. Suppression et paramètres de sécurité quittent ce bloc pour la page dédiée. Aucune double interface d'authentification publique.

## Architecture

- Réutiliser `StackAccountCoordinator`, les stores v4, API de stack, CAS, cloisonnement et protection de suppression. Une seule instance et un seul abonnement Auth pour tout le shell localisé, survivant aux changements de page et de langue.
- Placer le propriétaire commun dans `LangLayout`, au-dessus du shell/Outlet, et enlever les anciens enveloppements App/SSR devenus redondants. Tous les renderers SSR emploient ce layout : entrée de compte visible avec flag activé ne doit jamais réintroduire un contexte manquant sur outils/guides/accueil. SSR sans Auth/fetch privé, sortie déterministe.
- Séparer opérations d'authentification, profil serveur et présentation. Les formulaires n'installent aucun abonnement Auth ni boucle de sauvegarde.
- Les actions SDK nouvelles remontent des résultats typés avec gardes d'identité/génération. Inscription sans session ne remplace pas un compte connecté pendant la requête ; réponse tardive de profil/confirmation n'affecte pas B.
- Fournisseurs Google/GitHub par SDK, identité de base uniquement ; aucun scope repository, aucun token fournisseur conservé. Le rapprochement d'identités appartient à Supabase, pas à une fusion client d'e-mails.
- API de profil même origine : GET/PUT, bearer validé via helper existant, propriétaire dérivé du token. Lecture/mise à jour via RPC à verrou propriétaire, session réelle et barrière `deleting`, SECURITY INVOKER/search_path fixe/service-only. Pas d'ouverture de privilèges navigateur.
- Profil renvoyé : `userId`, `displayName`, `email`, `emailConfirmed`, `createdAt`, `updatedAt`, `canAccessBackoffice`. PUT accepte uniquement `displayName`; absence de succès confirmé => erreur/réessai. Dernière mise à jour du seul nom gagne, sans toucher stack/rôle.
- Profil UI isolé par propriétaire/session, effacé à sortie/changement ; pas de cache partagé React Query avec données privées résiduelles.
- Évolution persona : liée plus tard au même `userId`, séparée des justificatifs de connexion et préférences locales. Aucun schéma persona anticipé, questionnaire, entreprise fictive ou rôle éditeur ajouté maintenant.
- Préférences thème partagées : corriger le hook existant pour plusieurs consommateurs sans instances désynchronisées, conserver stockage et snapshot SSR actuels ; devise réutilise son provider.

## Contraintes globales

- Design ToolTrim actuel : shell existant, tokens, CSS préfixé dans `@layer components`, icônes centralisées, CTA neutres, clair/sombre, FR/EN, clavier et 390/1440px sans débordement de page.
- Une stack personnelle complète par compte ; fiches JSON et paiements/soumissions existants hors scope.
- Aucune collecte de persona/métier/entreprise/onboarding obligatoire ; nom facultatif importé du fournisseur ou modifié dans les paramètres, jamais exigé à l’inscription.
- Google + GitHub + e-mail/mot de passe dans le parcours public ; pas de code e-mail public concurrent.
- Un seul coordinateur Auth/synchronisation dans chaque application ; SSR sans effets Auth ni fetch privé.
- Les deux flags comptes restent désactivés par défaut ; disponibilité OAuth déclarée explicitement pour chaque fournisseur. La simulation locale les active sans appel externe.
- Les retours Auth restent consommables par le SDK sans nettoyage prématuré, mais leurs tokens/fragments et paramètres privés sont exclus des URL/referrers analytics. Les documents initiaux sensibles omettent les trackers bruts pendant toute leur durée de vie ; ce garde ne persiste qu’un booléen en mémoire. Perte de mesure volontaire sur ces documents, sans changement du choix de consentement.
- Aucun secret serveur dans le navigateur ; droits jamais dérivés de user_metadata ; profil/stack toujours attachés au sujet validé.
- Pas de migration distante, création réelle d'identité/e-mail, association réelle de fournisseur, modification SMTP/OAuth, achat, push ou déploiement dans ce lot.
- Conserver le dépôt original sale, la copie isolée et la stack de démonstration actuelle lors de la mise à jour de la prévisualisation.

## Recette

RED/GREEN ciblés, SQL sur PostgreSQL embarqué 18 et contrôle 17, API propriétaire/erreurs/barrière, session/récupération/générations, profils A→B et préférences partagées. Navigation réelle entre pages sans second abonnement. Tous les renderers publics représentatifs avec flags faux/vrai, sans appel Auth serveur. Navigateur : création/confirmation/connexion/mauvais mot de passe/renvoi/oubli/récupération expirée/succès, Google et GitHub succès/annulation, retour à outil et sauvegarde, paramètres/nom/reload/back-office, export/dirty/logout/suppression, clavier/mobile/thèmes. Bloquer toute origine externe dans les fixtures et ne capturer que mots de passe/tokens fictifs.

Réutiliser les preuves de lot précédent, ne répéter ses larges suites qu'après intégration ou modification pertinente. Les fixtures ne prouvent pas la livraison e-mail, la configuration OAuth ni les rôles GoTrue/PostgREST réels : recette fournisseur isolée toujours nécessaire avant activation.

## Références vérifiées

SDK installé : supabase-js 2.99.1, pas de mise à niveau requise ; ne pas supposer les paramètres apparus après cette version. Changelog consulté le 21 octobre : retrait de ciphers anciens sans effet sur navigateur moderne, changement de statut Management OAuth hors des endpoints client employés.

- https://supabase.com/docs/reference/javascript/auth-signup
- https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- https://supabase.com/docs/reference/javascript/auth-signinwithoauth
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-identity-linking
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated

## Extension demandée le 22 octobre — anticipation des données OAuth

L’utilisateur demande de récupérer dès maintenant les données utiles disponibles lors de Google/GitHub. Cette instruction étend le lot au préremplissage et à la conservation structurée du profil cosmétique. Autonomie d’exécution conservée. Aucune étape obligatoire, aucun scope supplémentaire, aucun questionnaire de persona. Métier, entreprise, taille d’équipe, objectifs et rôle éditeur restent ultérieurs et déclaratifs.

### Données et priorité

Auth reste la source des identités liées, identifiants fournisseur, e-mail/vérification et dates de création/dernière connexion ; pas de duplication de ces objets ou de tokens dans profiles. À partir du `getUser(token)` déjà vérifié côté serveur, sélectionner une identité Google/GitHub attachée au même owner, de manière déterministe : fournisseur initial Auth s’il correspond à une identité attachée, sinon Google puis GitHub. Utiliser exclusivement son `identity_data`, sans mélanger les fournisseurs ni importer `user_metadata` comme autorité. Seuls nom/pseudo, URL de photo et langue fournis sont projetés ; tout autre champ est ignoré.

Réutiliser `profiles.display_name` et `avatar_url`. Ajouter `oauth_profile_source` nullable google/github (marqueur d’import unique et provenance), `provider_locale` nullable distinct de `profiles.locale`/langue de navigation, et `display_name_auto_fill_allowed` boolean : anciennes lignes false par prudence, nouvelles true. Tout PUT du nom met ce booléen false, même pour null. Préserver tout nom et avatar déjà renseignés. Sous verrou owner/session et barrière deleting, importer une fois les seuls champs exploitables et marquer la source atomiquement ; les reconnexions et liaisons ultérieures ne remplacent jamais les choix. Les champs manquants restent null, sans prénom/nom légal séparés ni blob OAuth.

Le nom suit la limite80 points Unicode et l’absence de contrôles existantes ; une valeur fournisseur invalide est omise et ne bloque pas la connexion. Locale fournisseur : tag optionnel borné35 caractères, langue2–3 lettres suivie de sous-tags alphanumériques 2–8 séparés par tirets ; normaliser underscore en tiret. Photo : HTTPS, maximum 2048 caractères, sans user/password/port non standard/fragment, hôtes `lh<chiffres>.googleusercontent.com` pour Google et `avatars.githubusercontent.com` pour GitHub ; query uniquement clés `s`, `sz`, `v` numériques. Aucun fetch/proxy serveur ni Storage. Toutes ces données restent cosmétiques et ne confèrent aucun droit ; l’autorité e-mail confirmé/allowlist ne change pas.

### Contrats et présentation

Ajouter au DTO AccountProfile `avatarUrl:string|null`, `providerLocale:string|null`, `oauthProfileSource:'google'|'github'|null`. GET profil utilise la projection serveur pour l’import idempotent, un seul abonnement Auth existant ; PUT public accepte toujours uniquement displayName. Ajouter un RPC service-only `import_personal_oauth_profile(p_owner uuid,p_session uuid,p_provider text,p_display_name text,p_avatar_url text,p_provider_locale text) returns jsonb`, avec les mêmes garde/verrou/ACL que le profil actuel. Étendre read/update_personal_profile sans modifier stack ni Auth. Migration CLI `20261022073822_account_oauth_profile.sql`, rollback même basename conservant colonnes et données, révocation des RPC concernés ; aucun DDL distant.

Nom/photo alimentent menu et paramètres ; image à dimensions fixes, referrerPolicy no-referrer, alt vide avec identité textuelle et initiale en cas d’erreur. Aucun changement automatique de langue UI. Back-office : nom existant bénéficie déjà de l’import ; ajouter les trois scalaires dans le détail, par lecture service ciblée du profil après autorisation administrateur et résultat owner validé, sans N+1 sur la liste, sans charge OAuth brute. Les champs absents restent neutres. Profil A tardif ne doit jamais apparaître chez B.

### Recette supplémentaire

Tests RED/GREEN normalisation, deux fournisseurs, champs invalides/absents, métadonnées forgées, import unique, nom modifié/effacé, migration historique nullable, concurrence des intentions dans les deux ordres, owner/session/deleting et rollback conservation. API profil et détail BO gardent leurs gardes ; aucun token/role/email du seed n’est projeté. UI : photo/échec/owner tardif et langue informative. Fixture SDK réelle en .invalid couvre OAuth→nom/photo persistants→reconnexion→nom effacé non réimporté ; aucun appel photo externe pendant recette. Puis gates intégrés et revue fraîche de cette extension avant build final.
