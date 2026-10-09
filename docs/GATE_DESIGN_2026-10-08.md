# Gate design rétabli — 8 octobre 2026

## Correction

Le gate échouait sur les ajouts Ma Stack postérieurs au dernier checkpoint : huit couleurs CSS, dix-huit rayons CSS et deux lignes de styles inline au-delà des plafonds.

Les couleurs de gain/recoupement sont centralisées dans des tokens avec leurs valeurs exactes, et le fallback d'accent réutilise le token existant. Les rayons utilisent les tokens existants ; les valeurs sans équivalent exact 14/9/2 px ont leurs tokens explicites. Les tokens rem de 16/20 px correspondent à la racine actuelle de 16 px.

Les styles dynamiques du sélecteur segmenté et de la pastille des domaines restent en place : ils calculent les positions/tailles. Deux styles statiques de GuideCardEditorial, taille du titre et limitation de l'extrait, passent dans des classes ec dédiées. Aucun déplacement de styles vers une forme cachée au scanner.

Ni scripts/design-tokens-baseline.json ni scripts/validate-design-tokens.mjs ne sont modifiés.

## Validation locale

- Gate rouge avant, vert après : 137 couleurs CSS, 223 rayons CSS, 15 couleurs TSX, zéro rayon TSX, 125 lignes de styles inline.
- 249 tests applicatifs, 23 contrats SEO, TypeScript app/node et build production PASS.
- 30 parcours Chromium Ma Stack / audit technique / prix PASS sur l'artefact généré.
- Douze captures FR/EN, 390/1440 px : stack, éditeur d'abonnement et cartes guides de communication. Styles calculés et géométrie identiques, aucune erreur page. Dix images identiques pixel pour pixel ; les deux vues desktop stack diffèrent sur 11/34 pixels sur 1 440 000, écart maximal 6/255, sans différence de propriétés calculées. Ne pas présenter les douze PNG comme strictement identiques.
- 13 162 documents : texte, métadonnées et JSON-LD identiques au build précédent ; sitemap identique octet pour octet. Artefact 824,9 MiB / HTML 713,2 MiB ; budgets inchangés PASS.
- Relecture indépendante sans problème concret de cascade ou de portée.

Preuves : output/tooltrim-design-gate-2026-10-08/verification.json et computed-styles.json. Les captures brutes avant/après restent sous /private/tmp/design-{before,after}-*.png.

## Suivi

La roadmap générale marque le gate rétabli et met ensuite l'automatisation de la recette navigateur en CI. Les roadmaps mises à jour dans la session sont incluses avec cette documentation. La vérification publique après déploiement sera communiquée dans le compte rendu ; la recette locale ne suffit pas à la déclarer réalisée.

Catégories locales et exports non suivis exclus de la publication.
