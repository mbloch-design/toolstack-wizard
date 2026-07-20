# Relais Claude — catalogue canonique et scraper (2026-07-17)

> État de relais, pas une autorisation d'exécution. Aucun SQL/Supabase, aucun réseau et aucune mutation des JSON de recherche ou de `src/data` n'ont été réalisés pendant cette relève Codex.

## Cap immuable

Une base canonique commune, migrée fiche par fiche sans rupture, sert Fiches, Ma Stack, Explorer et build/SEO. Les usages intelligents futurs consomment le même socle sourcé, versionné et explicable. Le Diagnostic reste différé ; aucun pivot de modèle n'est attendu.

## État prouvé

- Contrat : rév. **4.10**. A1 + import testés sur PostgreSQL 16 jetable en rollback-only ; A4/A5 non encore exécutés.
- Suite RESEARCH : **164/164 tests verts**.
- Wix : `sha256:a10e922aed742d5c96598282166e9034c2a811ca4b7e97ef133c8f00a075650f`.
- `src/data/tools_v4.json` : `sha256:d92d47b5a7fa9614a19f72b6fc4368a89f856a7d64fd414b9f60a21c4bed4f9c`, identique au manifeste.
- Proposition Wix : `sha256:85b45eb1447745fc9d0a52f33d82360d27cde4eeca03d8b6ba9656cca449845b`.
- Proposition : 3 sources, 3 captures, 17 basis machine, 1 attestation historique révoquée, 2 événements, 5 plans, 4 prix observés, 2 claims, 4 localisations, 2 contenus éditoriaux `draft`, 0 relation actuelle, **0 approved**.
- Le CLI `research-stage.mjs` ne possède aucun mode d'application et rejette `--apply`.
- Le SQL généré est un brouillon `BEGIN … ROLLBACK`, testé statiquement mais jamais exécuté ni validé par PostgreSQL.

## Corrections intégrées pendant la relève

1. Mapper pur Wix → proposition de staging privée, déterministe et sans I/O.
2. Conservation du payload brut des attestations humaines dans le DDL.
3. Profil métier séparé : seules les décisions `planOrder` et `comparePlanKey` ne sont pas déduites des preuves.
4. Générateur de répétition générale SQL rollback-only, sans chemin `COMMIT`.
5. Relations de recherche câblées comme `proposed` : capture obligatoire, raison FR/EN, cible publiée, payload conservé, jamais d'approbation automatique.
6. Distinction slug public / ID SQL. Deux exceptions réelles existent : `aircall → aircall-inc`, `kit → convertkit`.
7. D13 rétablie : le plan gratuit Wix vient du claim officiel ; aucune observation artificielle `0 EUR`.
8. Cahier corrigé : le collecteur écrit uniquement les sorties locales autorisées ; staging et import sont des étapes distinctes.
9. Union des consommateurs réauditée : galerie, angle IA et guidance tarifaire éditoriale sont maintenant couverts sans dupliquer les faits de prix.
10. Staging éditorial FR/EN ajouté en `draft` et garde SQL empêchant toute bascule canonical avant publication des deux langues et présence d'un plan comparatif.
11. Test PG16 rév. 4.9 : 18/18 pour A1 + import. Le rapport « aucune vue catalog_api » révèle que la projection publique A5 et ses resolvers A4 restent à tester ; seule la vue Diagnostic doit rester absente.
12. Rév. 4.10 : droits explicites `service_role` et policy `catalog_owner_projection_read` sur `public.tools`, sans modifier les policies anon/authenticated existantes.

## État humain Wix

L'unique attestation humaine présente est l'incident de test, révoqué et conservé dans le ledger. Il n'existe toujours aucune attestation active. Ne pas la recréer au nom de l'utilisateur.

Le dernier `basis_attestation_id` connu et valide est :

`sha256:4faa267f47fb2ab5620e3e45abea92f78e19944040de79b7e21e44a3270fcfa6`

L'utilisateur doit fournir lui-même l'identité du réviseur et décider d'appliquer l'acte. Le dry-run reste la valeur par défaut.

## Points à ne pas confondre

- `research/tool-pages/index.json` contient encore une note Wix historique (« montants non retenus »). Le dossier Wix réel contient maintenant quatre observations payantes complètes, mais sans contexte humain actif. Ne pas utiliser la note de l'index comme état autoritatif des faits.
- Une attestation de contexte rend les observations éligibles à la revue ; elle ne les approuve pas.
- Le staging `observed` ne bascule pas `data_contract='canonical'`.
- Le tableau pilote d'A6 décrit l'état final après décisions humaines, pas l'état présent.

## Prochaines portes — chacune exige une décision distincte

1. **Audit Claude de la rév. 4.10** : lecture seule et suite de tests, autorisé sans réseau.
2. **Acte humain Wix** : identité réelle + `research-attest.mjs --apply`, à effectuer uniquement sur instruction explicite de l'utilisateur.
3. **Test PostgreSQL jetable** : exécuter DDL + import rollback-only dans une base éphémère, uniquement après autorisation ; jamais Supabase en premier.
4. **Lot de scraping suivant** : ne pas lancer les huit/neuf slugs automatiquement. Demander/recevoir le périmètre explicite, puis conserver `RESEARCH_ONLY` et `approved=0`.
5. **Supabase** : reste hors périmètre tant que le test jetable, les gates de rôle et la validation D7/D11/D12 ne sont pas obtenus.

## Prompt de reprise conseillé

> Audite en lecture seule la rév. 4.10, notamment les deux droits ajoutés. Puis, seulement si le test jetable est réautorisé, charge A1, A4 et A5 dans cet ordre, importe Wix et teste la vraie `catalog_api.published_tool_projection` sous `anon`/`authenticated`. La projection publique doit exister ; seule `diagnostic_tool_projection` doit être absente. Aucun Supabase, APPLY, attestation ou scraping.
