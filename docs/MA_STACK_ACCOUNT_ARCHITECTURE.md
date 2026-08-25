# Ma Stack — sauvegarde, compte et synchronisation

Date de décision : 25 août 2026

## Verdict produit

ToolTrim reste **local-first** : aucun compte n’est demandé pour ajouter un premier outil, choisir `Dans ma stack` ou `À étudier`, créer un tableau et organiser sa sélection.

Le compte intervient au moment où sa valeur est évidente, via un CTA comme **« Synchroniser mes sélections »** dans Ma Stack. Il sert à retrouver ses tableaux sur plusieurs appareils, protéger la sélection contre la perte de données et préparer un profil personnel. Il ne doit pas bloquer l’exploration.

## Solution retenue

Utiliser **Supabase Auth**, déjà cohérent avec la stack technique et le client Supabase du projet.

Ordre de lancement :

1. Google OAuth, principal raccourci de connexion ;
2. email par magic link ou OTP, solution universelle sans mot de passe ;
3. LinkedIn OIDC reste une évolution secondaire ;
4. Apple ne sera ajouté que si les données montrent un besoin significatif sur iOS/macOS.

Ne pas afficher six fournisseurs au premier écran. Google + email doivent rester visibles ; LinkedIn peut être proposé dans « Plus d’options ». Supabase relie automatiquement les identités OAuth partageant une adresse vérifiée, ce qui évite de créer plusieurs comptes pour une même personne.

Références officielles :

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Connexion Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Connexion LinkedIn OIDC](https://supabase.com/docs/guides/auth/social-login/auth-linkedin)
- [Liaison d’identités](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [Utilisateurs anonymes](https://supabase.com/docs/guides/auth/auth-anonymous)

## Parcours cible

### Avant le compte

1. L’utilisateur clique sur « Ajouter » depuis une fiche ou une carte.
2. Il choisit `Je l’utilise` ou `À étudier`.
3. Il sélectionne un ou plusieurs tableaux existants.
4. ToolTrim présélectionne un tableau cohérent si aucun classement n’existe encore.
5. Il peut créer un tableau personnalisé dans la même popin.
6. La sélection est immédiatement persistée dans le navigateur.

### Création du compte

1. Après la première valeur créée, Ma Stack propose « Synchroniser mes sélections » sans interstitiel bloquant.
2. L’utilisateur choisit Google, email ou LinkedIn.
3. À la première session authentifiée, le client envoie l’état local versionné au serveur.
4. Le serveur fusionne sans doublon les outils et tableaux, puis renvoie l’état canonique.
5. Le client conserve un cache local pour fonctionner rapidement et hors connexion partielle.

Créer un utilisateur Supabase anonyme dès la première visite n’est pas recommandé pour la première version : cela ajoute des comptes fantômes et une gestion de conflits avant que le besoin de synchronisation soit validé. La conversion anonyme reste une évolution possible si ToolTrim a besoin d’écrire côté serveur avant le consentement au compte.

## Modèle de données livré

La première version utilise un **snapshot personnel versionné**, volontairement plus simple qu’un modèle relationnel prématuré. Le navigateur reste la source locale immédiate ; après connexion, le snapshot distant est fusionné puis sauvegardé automatiquement.

```text
profiles
  id uuid = auth.users.id
  display_name text
  avatar_url text
  locale text
  created_at timestamptz

stack_snapshots
  owner_id uuid
  state jsonb
  state_version integer
  revision bigint
  updated_at timestamptz
```

Les deux tables activent RLS avec une politique par opération et une propriété vérifiée par `(select auth.uid())`. Les clés étrangères vers `auth.users` utilisent `on delete cascade`. Une future normalisation en tables `stack_items` et `stack_boards` ne sera justifiée que par un besoin réel de partage, collaboration ou requêtes serveur fines.

## Règles de fusion

- Un outil n’existe qu’une fois par compte.
- À la première connexion, les outils et collections présents localement ou à distance sont réunis.
- À l’issue de cette hydratation, chaque modification locale met à jour le snapshot distant avec un délai court.
- Les collections sont fusionnées par identifiant stable ; les collections personnalisées utilisent un UUID.
- Les affectations multi-tableaux sont réunies, sans doublon.
- Une suppression explicite et datée doit être conservée comme tombstone pendant la fenêtre de synchronisation, afin d’éviter la résurrection depuis un autre appareil.

## État au 25 août 2026

- [x] Migration `profiles` + `stack_snapshots` appliquée sur Supabase.
- [x] RLS et droits limités aux utilisateurs authentifiés.
- [x] CTA facultatif « Synchroniser » dans Ma Stack.
- [x] Connexion Google et email magic link intégrées dans une modale dédiée.
- [x] Fusion initiale, cache local et sauvegarde distante automatique.
- [x] Retour de connexion réouvert directement sur l’état du compte.
- [ ] Configurer les identifiants Google et les URL de redirection autorisées dans Supabase.
- [ ] Déployer la fonction de suppression de compte après validation explicite de cette action irréversible.
- [ ] Tester un vrai parcours multi-appareils avec un compte de recette.
