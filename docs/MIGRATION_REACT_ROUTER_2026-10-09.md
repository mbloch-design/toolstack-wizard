# Migration React Router — 9 octobre 2026

Migration **validée localement, non publiée** : React Router DOM 6.30.6 → **7.18.4**, version exacte. React 18, le mode déclaratif, les routes et Tailwind 3 sont conservés.

## Résultat et périmètre

Les entrées npm React Router disparaissent des audits : **17 → 15** entrées au total (11 high/4 moderate), **9 → 7** hors dépendances de développement (5 high/2 moderate), aucune critique. Les autres chaînes vulnérables restent ouvertes ; ces chiffres ne certifient pas toute l’infrastructure.

Le bénéfice visé est le correctif de [navigation React Router](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6). L’[avis d’injection SSR](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg) ne concernait pas le mode déclaratif utilisé ici. Aucun gain de vitesse ou de classement SEO n’est revendiqué.

Cinq entrées du lockfile changent : react-router-dom et react-router mis à jour, @remix-run/router retiré, cookie et set-cookie-parser ajoutés. StaticRouter est importé depuis la racine en v7. Les flags v7 devenus implicites sont retirés de trois tests ; l’alias des pages client est aligné dans Vitest. De nouveaux tests couvrent les anciennes URL, les splats, la navigation et le SSR.

Le premier build v7 ajoutait 710 877 attributs `data-discover`, soit 14,24 MiB, et dépassait les budgets. Les adaptateurs communs Link/NavLink utilisent la propriété publique `discover="none"`, adaptée au routage déclaratif actuel. Ils transmettent les props et les refs ; une option explicite peut remplacer cette valeur. **57 fichiers changent seulement leurs imports de liens**, sans modification de leurs corps de composants. Les budgets et validateurs sont inchangés.

La refonte locale de CategoriesIndexPage est préservée et exclue du commit ; seule sa ligne d’import est incluse. Les travaux catalogue, médias et exports non suivis sont exclus.

## Validation

| Contrôle | Résultat |
|---|---|
| Tests applicatifs | 266 / 50 fichiers PASS |
| Types application et outils Node | PASS |
| Contrats SEO / tests Ma Stack | 23 / 99 PASS |
| Navigation navigateur / Ma Stack navigateur | 15 / 15 PASS |
| Hydratation sur HTML construit | 56 PASS, 5,0 minutes |
| Comparaisons de rendu FR/EN, 390 et 1440 px | 20 PASS : textes, liens, JSON-LD et état conservés, zéro erreur JavaScript |
| Build production et gate design | PASS, baseline design inchangée |
| Relecture indépendante | Aucun blocage |

**13 162 HTML identiques hors noms hachés des assets JavaScript**, zéro attribut de découverte ajouté, même volume HTML : 747 877 855 octets (713,2 MiB). Sitemap et sources catalogue identiques. Budgets conservés : total 831 MiB, HTML 716 MiB. Le transfert de l’index catalogue reste 325 599 octets dans les vingt comparaisons.

Les tests ont été exécutés sur une copie isolée du périmètre committable, sans la refonte locale des catégories. Les appels Supabase étaient neutralisés dans les recettes comparatives : elles prouvent la parité locale et la navigation, pas le bon fonctionnement d’une API distante. Aucun déploiement ou test public de cette migration n’est déclaré.

[Preuves JSON](../output/tooltrim-router-migration-2026-10-09/verification.json), [parité HTML](../output/tooltrim-router-migration-2026-10-09/html-parity.json), [parité rendue](../output/tooltrim-router-migration-2026-10-09/rendered-parity.json), [audit complet](../output/tooltrim-router-migration-2026-10-09/audit-full.json), [audit production](../output/tooltrim-router-migration-2026-10-09/audit-omit-dev.json).

## Suite

Publier ce lot puis contrôler CI et déploiement public. Ensuite, ajouter le typecheck des handlers API avant de réduire la dépendance SDK ; traiter Tailwind dans un lot distinct.
