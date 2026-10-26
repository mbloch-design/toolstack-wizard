# Éditeur de fiches du back-office

L'onglet Fiches édite les fiches existantes de `src/data/tools_v4.json`. Les brouillons sont privés et persistés dans le hash Redis `tt:catalog-editor:v1`, distinct des soumissions. La publication globale relit `main`, applique uniquement les fiches du lot relu et crée un commit sur `mbloch-design/toolstack-wizard/main`. Le build existant régénère ensuite les artefacts publics. Un commit envoyé ne prouve pas le déploiement public.

## Activation serveur

- Conserver la configuration comptes existante : `STACK_ACCOUNT_ENABLED=true`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `BACKOFFICE_ADMIN_EMAILS` (emails confirmés uniquement).
- Réutiliser `SUBMISSION_REDIS_URL` et `SUBMISSION_REDIS_TOKEN` pour le transport Upstash existant. Le hash de soumissions n'est jamais modifié par cet éditeur.
- Ajouter `BACKOFFICE_GITHUB_TOKEN` uniquement côté serveur : jeton GitHub finement limité au dépôt `mbloch-design/toolstack-wizard`, permission **Contents: read and write**, avec expiration et rotation gérées par son propriétaire. Aucun jeton personnel CLI n'est copié automatiquement.
- Redéployer après configuration. L'absence de configuration provoque une erreur explicite, jamais une sauvegarde locale présentée comme persistée.

Le dépôt, la branche et le chemin sont des constantes serveur. Aucun paramètre client ne peut les changer. Limites : 256 Kio par requête de sauvegarde, 100 brouillons, recherche 200 caractères, pages de 25 fiches.

## Concurrence et reprise

Chaque sauvegarde/suppression compare atomiquement la version Redis. Les versions viennent d'une révision globale monotone, ce qui empêche un ancien onglet d'écraser une fiche supprimée puis recréée. Le JSON du brouillon est stocké sans réencodage Lua afin de conserver exactement les tableaux vides et les valeurs nulles.

La publication exige la révision globale relue et l'empreinte de chaque fiche d'origine. Un changement externe sur une fiche du lot bloque le lot entier avec un conflit et conserve les brouillons. Une nouvelle modification sur une autre fiche de `main` reste conservée. L'avancement Git utilise `force:false` ; aucun force push, aucun verrou persistant.

Après un délai réseau GitHub, la référence est vérifiée avant tout succès et nettoyage. Si cette vérification échoue, conserver les brouillons, rafraîchir l'espace puis réessayer : les valeurs déjà identiques sur `main` sont réconciliées sans seconde modification. Le nettoyage ne supprime que les versions effectivement publiées ; les nouvelles sauvegardes restent présentes. `cleanupPending=true` signifie que le commit est vérifié, mais que le nettoyage Redis doit être repris par un rafraîchissement et une nouvelle publication globale.

## Périmètre de validation

Les identifiants et slugs sont immuables. Les champs non exposés restent identiques, y compris les anciennes propriétés imbriquées inconnues. Le serveur rejette les nouveaux champs inconnus, clés de prototype, nombres non finis, types erronés et URL non HTTP(S). Les médias peuvent utiliser un chemin local absolu. Une catégorie modifiée doit déjà exister dans le catalogue source.

Les modifications de montants exigent une source et une date valides. Les plans exigent une identité unique, au plus un plan de comparaison, des montants positifs ou nuls, et une devise de trois lettres lorsque le montant est connu. L'éditeur ne vérifie pas le contenu factuel de la page source et ne calcule aucune conversion. Les preuves et traductions restent à fournir par l'administrateur.

Le JSON catalogue n'est pas l'unique source de présentation : `src/data/toolUrlCorrections.json` peut remplacer certains liens/médias et les prix attestés de `pricing_truth.csv`/`nativePrices` peuvent prendre priorité sur un ancien `defaultMonthlyPrice`. Une correction de ces sources doit suivre leur circuit existant ; publier le seul JSON ne garantit pas leur remplacement. Vérifier la fiche rendue après reconstruction pour ces cas.

## Vérification avant activation

Les tests automatiques utilisent des doubles GitHub/Redis et ne publient aucun contenu réel. Ils vérifient contrat, autorisation, lots, révisions périmées, conflits source, échec fournisseur, publication ambiguë et nettoyage conditionnel. Les scripts Lua sont également exécutés contre un Redis local isolé : courses de vingt sauvegardes, conservation des tableaux vides et valeurs nulles, versions périmées après suppression/recréation, nettoyage conditionnel, limite de cent brouillons et état corrompu. Aucun stockage de production n'est utilisé pour ces tests. Effectuer ensuite une recette contrôlée authentifiée avec un jeton limité et vérifier le commit puis le déploiement séparément. Ne pas inventer de modification factuelle de catalogue pour tester la production.
