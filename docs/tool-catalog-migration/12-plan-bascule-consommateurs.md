# Bascule progressive des consommateurs du catalogue

Date : 2026-07-20. Statut : **Fiche + SSR activés sous drapeau ; autres consommateurs inchangés**.

## Gate préalable

La Data API expose `catalog_api` en plus de `public` et `graphql_public`. `catalog_private` reste absent. La commande suivante doit être entièrement verte avant toute modification d'un consommateur :

```bash
npm run validate:catalog-dark-launch
npm run validate:catalog-shadow-read
```

## Cartographie réelle

| Surface | Lecture actuelle | Point de code | Contrainte de migration |
|---|---|---|---|
| Fiche outil client | `public.tools`, puis JSON local | `useToolBySlug` | Couplée au SSR pour éviter une divergence d'hydratation |
| Fiche outil SSR / SEO | fusion `tools_v4.json` + `public.tools` | `getMergedTools` dans `vite.config.ts` | Une ligne localisée doit être reconstruite pour FR et EN |
| Ma Stack | résumés JSON + `public.tools` | `useToolSummaries` | Même forme `ToolSummary` que l'Explorer |
| Explorer | résumés JSON + `public.tools` | `useToolSummaries` | Relations et catégories doivent rester explicables |
| Comparateur | deux lectures ciblées de `public.tools` + SSR | `useToolPair` et build | À migrer après la Fiche, avec le même adaptateur |
| Catalogue et pages transverses | `useTools` ou `useToolSummaries` | pages catégories, recherche, guides | Migration après validation des chemins ciblés |
| Diagnostic | `public.tools` + JSON | `useDiagnosticData` | **Hors périmètre à date, aucune migration** |

## Ordre recommandé

### 0. Shadow read sans rendu

- Créer un adaptateur pur `published_tool_projection -> Tool`.
- Lire les deux lignes `fr` et `en` d'un slug depuis `catalog_api`.
- Comparer en test l'adaptateur au résultat historique `public.tools` pour une cohorte représentative.
- Journaliser les écarts sans changer le rendu ni le SEO.

État au 20 juillet 2026 : **gate vert** après correction ciblée du fallback `verdict_en` lorsque la colonne contient le littéral JSON `null`. Résultat : 1 126 outils, 2 252 lignes, 40 champs comparés par ligne, zéro divergence.

Le build SEO pagina désormais explicitement `public.tools` par tranches de 1 000. Avant cette correction, le plafond Data API limitait silencieusement la lecture à 1 000 outils ; le JSON local masquait les 126 lignes manquantes.

### 1. Fiche + SSR, sous drapeau

- Ajouter un drapeau indépendant, désactivé par défaut.
- Migrer ensemble `useToolBySlug` et la source SSR du build.
- Conserver le chemin historique comme fallback immédiat.
- Vérifier contenu, prix, relations, JSON-LD, sitemap et hydratation sur FR/EN.

Activation terminée dans le code : `useToolBySlug` et les pages Fiche SSR/SEO utilisent ensemble `catalog_api`. Le drapeau `VITE_CATALOG_PROJECTION_FICHE=false` restaure les deux chemins historiques au prochain build ; une indisponibilité réseau déclenche aussi automatiquement le fallback `public.tools`/JSON.

La projection apporte 97 deltas intentionnels sur `alternatives` : remplacement d'anciens identifiants (`convertkit` → `kit`), suppression de cibles inexistantes/non publiées et ajout de relations éditoriales approuvées. Toutes les cibles projetées ont été vérifiées comme slugs publiés. Ma Stack, Explorer et Comparateur ne sont pas basculés par cette activation.

Cette paire constitue le premier consommateur logique : basculer seulement le client ou seulement le build créerait deux sources différentes sur une même page.

Canari avant commit : **22/22 contrôles verts** sur Wix, Balsamiq, Kit, Aircall, Figma, Framer, AdCreative.ai, Gamma, Unbounce et Notion en FR/EN, navigation SPA Figma → Canva, puis sous-page Prix Wix en SSR. Le panel couvre notamment les identifiants distincts des slugs (`convertkit`/`kit`, `aircall-inc`/`aircall`), le fallback de verdict EN et les alternatives canoniques. Wix est le pilote canonique unique : cinq plans publics, prix comparatif Light à 16,80 € TTC par mois sous engagement annuel payé d'avance, source et contexte FR/fr-FR conservés. Aucun `pageerror`, défaut d'hydratation, overlay ou échec de ressource locale.

### 2. Ma Stack + Explorer

- Migrer `useToolSummaries`, partagé par les deux surfaces.
- Préserver les invariants de classement local, de destination et de relations explicables.
- Comparer les mêmes huit premiers résultats avant/après sur le jeu de référence.

### 3. Comparateur et pages transverses

- Migrer `useToolPair`, puis `useTools`.
- Retirer les fallbacks JSON uniquement après plusieurs déploiements stables et une preuve de couverture du build.

## Conditions de rollback

- Chaque étape possède son propre drapeau ; la désactivation restaure immédiatement le chemin `public.tools`/JSON.
- Aucun retrait de colonne, grant ou table pendant la migration des consommateurs.
- Aucun changement simultané de modèle métier et de source de lecture.
- Seul Wix est `canonical` ; aucun autre outil ne bascule implicitement et aucun montant non approuvé ne doit apparaître.

## Critères de sortie du shadow read

- Data API : 1 126 outils et 2 252 lignes de projection.
- Zéro slug manquant et exactement une ligne par `(slug, lang)`.
- Parité des champs réellement consommés par Fiche, Ma Stack, Explorer et build.
- Aucun fait de prix issu de `pricing_guidance`.
- Aucun accès à `catalog_private` depuis les rôles publics.
- Build, TypeScript, tests Ma Stack et contrôles SEO verts.
