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
