# Inventaire CMS éditeurs

Relevé en lecture seule du 16 novembre 2026. Référence GitHub `origin/main` à `415800ebdfa3c1f729570c9f8e415a0dc0294660`. Le build lit `src/data/tools_v4.json`. Les rapprochements ci-dessous portent sur les identifiants et les slugs du catalogue publié de cette révision.

| Mesure | Résultat |
|---|---:|
| Fiches JSON | 1 360 |
| Lignes dans `public.tools` | 1 178 |
| Lignes DB marquées `published` | 1 047 |
| Correspondances exactes ID et slug | 1 173 |
| Présentes uniquement dans le JSON | 187 |
| Présentes uniquement en DB | 5 |
| Paires avec un ID ou slug en conflit | 0 |
| Attributions `catalog_contrib.brand_tool_assignments` | 0 |
| Taille Postgres mesurée | 77 540 499 octets |
| Taille des objets Storage mesurée | 9 548 octets |

Les 1 173 correspondances d’identité ne prouvent pas la parité des contenus ni des droits. Les 187 fiches uniquement JSON gardent leur parcours actuel. Les 5 lignes DB seules restent à qualifier. Aucune ligne historique existante ne déclenche un rattachement. La mesure Storage compte les objets, indépendamment des transferts cumulés.

Le rapprochement est reproductible avec `node scripts/cms/reconcile.mjs --published <catalogue.json> --database <identites.json>`. L’instantané DB est un tableau de lignes avec `id`, `slug` et, si disponible, une `projection` au format du JSON public. Les options `--archives`, `--drafts` et `--overrides` acceptent les instantanés correspondants. Le rapport ne contient pas les valeurs des brouillons. Une source absente reste indiquée par `null`.

Restent à vérifier avant la bascule d’une fiche pilote : les contenus et correctifs de projection, les brouillons Redis, les réservations et archives, les transferts et plafonds de médias, ainsi que la reproduction locale du schéma de contribution. Garder une fiche JSON témoin et une fiche pilote à attribution vérifiée. Le relevé courant n’établit aucune attribution existante.

Décision d’implémentation du rapprochement : une différence de slug ou d’ID est signalée pour examen. Seule une paire exacte et non ambiguë apparaît parmi les correspondances. Un changement de slug légitime se traite donc explicitement avant import.

## Contrôles avant raccordement du CMS

L’introspection en lecture seule confirme des autorisations héritées au rôle `authenticated` dans `catalog_contrib`. Les six tables accordent SELECT. Les items accordent aussi DELETE. Les droits de colonne permettent INSERT (10 colonnes) et UPDATE (9 colonnes) sur les items, puis INSERT (5) et UPDATE (1) sur les demandes. Tester les politiques et révoquer les anciens chemins d’écriture de façon ciblée lors de la migration. Les droits de table seuls ne suffisent pas à fermer ces accès.

Le contrat TypeScript est vérifié en local. Les objets de prix du catalogue historique mélangent faits et données réservées. Le brouillon éditorial les refuse dans cette première implémentation. Le parcours admin actuel continue de porter ces données jusqu’au raccordement champ par champ.

## Accès et sauvegarde des fiches rattachées

La migration `20261116203729_cms_tool_drafts.sql` et l’API `publisher-catalog` couvrent un brouillon préalablement provisionné pour une attribution principale vérifiée. La base vérifie la session, l’adresse confirmée, l’état du compte, la marque, l’attribution et le rôle dans la transaction. La sauvegarde vérifie la marque et la version lues par l’éditeur. Ce contrôle empêche qu’un changement d’attribution réutilise la version d’un autre brouillon. Les fiches JSON sans attribution ne possèdent pas de workspace CMS.

Le test PostgreSQL local réutilise la migration des comptes. Les relations du catalogue déjà déployées sont représentées par une fixture minimale. Il reste à reproduire complètement le schéma historique et à tester le déploiement sur un environnement isolé. Cette migration ne modifie pas les anciennes permissions de contribution. Leur retrait doit accompagner le remplacement de leurs chemins d’écriture.

Suivi : provisionnement à partir d’une attribution validée, création et reprise des dossiers, offres et preuves commerciales, interface, revue et publication restent à raccorder. Aucun SQL de migration appliqué en production.

## Intégration locale du 17 novembre 2026

Les routes éditeur couvrent l’inscription via les comptes existants, la création d’un dossier, la revendication et l’invitation, le retour de paiement, le badge et la confirmation d’une version exacte des faits. Les routes ToolTrim traitent les demandes et la revue initiale. Les modifications d’une fiche attribuée passent par des propositions figées. La validation de chaque proposition porte sur la version complète. Le choix de chaque ligne du différentiel reste à faire.

Le lot de publication est composé du JSON à une révision Git déterminée, des brouillons ToolTrim et des propositions CMS approuvées. Une fiche liée refuse une nouvelle écriture JSON quand le CMS est activé. Les visuels WebP sont ajoutés au même arbre Git. La vérification de la mise en ligne contrôle l’alias, le commit et l’état Vercel, le marqueur public du lot et les routes FR/EN. Les données publiques restent statiques. Les tarifs déclarés sont affichés avec provenance et restent distincts des tarifs de référence de ToolTrim.

Configuration d’un environnement de recette isolé : appliquer les migrations CMS sur une copie du schéma, préparer des UUID d’administrateurs confirmés dans `catalog_contrib.cms_admins`, vérifier les variables existantes Supabase/GitHub/Redis et configurer le paiement en bac à sable. Activer `PUBLISHER_CMS_ENABLED` et `VITE_PUBLISHER_CMS_ENABLED` ensemble pour le circuit global. La confirmation de livraison nécessite `CMS_VERCEL_TOKEN`, `CMS_VERCEL_PROJECT_ID` et, si utilisé par le projet, `CMS_VERCEL_TEAM_ID`. Les secrets restent côté serveur. Actuellement la confirmation vérifie l’alias public de ToolTrim.

Restent à prouver ou terminer avant ouverture : rapprochement complet des anciens reçus (la reprise existe en revue manuelle), retrait des anciennes voies Supabase après vérification de leurs dépendances, rédaction admin des champs réservés pour une fiche déjà attribuée, reprises complexes après déploiement, restauration et transfert inverse vers JSON, nettoyage de la propriété Storage à la suppression de compte, recette humaine et recette des fournisseurs en environnement isolé. Les tests locaux ne valident pas le déploiement ou les quotas actuels des prestataires.
