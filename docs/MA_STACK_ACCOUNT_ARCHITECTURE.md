# Ma Stack — sauvegarde, compte et synchronisation

Date de décision : 25 août 2026

## Verdict produit

ToolTrim reste **local-first** : aucun compte n’est demandé pour ajouter un premier outil, choisir `Dans ma stack` ou `À étudier`, créer un tableau et organiser sa sélection.

Le compte intervient au moment où sa valeur est évidente, via un CTA comme **« Synchroniser mes sélections »** dans Ma Stack. Il sert à retrouver ses tableaux sur plusieurs appareils, protéger la sélection contre la perte de données et préparer un profil personnel. Il ne doit pas bloquer l’exploration.

## Solution retenue

Utiliser **Supabase Auth**, déjà cohérent avec la stack technique et le client Supabase du projet.

Ordre de lancement recommandé :

1. Google OAuth, principal raccourci de connexion ;
2. email par magic link ou OTP, solution universelle sans mot de passe ;
3. LinkedIn OIDC, secondaire et pertinent pour l’audience professionnelle ;
4. Apple uniquement si les données montrent un besoin significatif sur iOS/macOS.

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

## Modèle de données cible

```text
profiles
  id uuid = auth.users.id
  display_name text
  avatar_url text
  locale text
  created_at timestamptz

stack_boards
  id uuid
  owner_id uuid
  stable_key text
  label text
  source suggested | custom
  sort_order integer

stack_items
  id uuid
  owner_id uuid
  tool_slug text
  intent stack | wishlist
  added_at timestamptz
  updated_at timestamptz
  unique(owner_id, tool_slug)

stack_item_boards
  item_id uuid
  board_id uuid
  primary key(item_id, board_id)
```

Toutes les tables personnelles doivent activer RLS avec `owner_id = auth.uid()`. Les suppressions de compte doivent supprimer les données personnelles associées. Les slugs outils et les `stable_key` de tableaux servent à fusionner le local et le serveur de manière idempotente.

## Règles de fusion

- Un outil n’existe qu’une fois par compte.
- Le statut le plus récemment modifié gagne (`stack` ou `wishlist`).
- Les tableaux sont fusionnés par identifiant stable ; les tableaux personnalisés utilisent un UUID.
- Les affectations multi-tableaux sont réunies, sans doublon.
- Une suppression explicite et datée doit être conservée comme tombstone pendant la fenêtre de synchronisation, afin d’éviter la résurrection depuis un autre appareil.

## Limites de la tranche actuelle

Le modèle local v3, la popin, les deux intentions et les tableaux sont implémentables immédiatement et ne dépendent pas de l’authentification. La synchronisation distante nécessite ensuite : migrations SQL, politiques RLS, configuration OAuth, écran de connexion et tests de fusion multi-appareils.
