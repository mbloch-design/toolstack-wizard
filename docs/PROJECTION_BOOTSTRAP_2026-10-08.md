# Bootstrap des fiches — 8 octobre 2026

## Changement

Seuls sept champs historiques sont retirés du JSON __SSR_TOOL__ : description, research, lifecycle, website, verdictFr, pivot_integration_source, relevantForEn. La projection travaille sur une copie ; elle intervient aux deux points d'injection du build. Le rendu SSR et les sources du catalogue sont inchangés, tout comme les bootstraps comparaison, stack et guide.

Les champs localisés qui pilotent les calculs, prix et descriptions restent présents. websiteUrl reste la référence du site officiel. Les onglets Alternatives et Avis sont inclus dans la navigation des tests d'hydratation.

## Mesures et contrôles

- Gain exact : 5 861 952 octets, soit 5,5904 MiB, sur 9 904 des 9 912 documents outil.
- Artefact : 830,4 → 824,9 MiB ; HTML : 718,8 → 713,2 MiB. Budgets total/HTML abaissés de 5 MiB à 831/716 MiB.
- 13 162 HTML comparés : payload nouveau égal au précédent moins les sept clés ; tout le HTML hors de ce payload est identique octet pour octet. Sitemap également identique.
- Sources tools_v4.json et stacks.ts identiques. Aucune modification des prix, faits ou données originales.
- Test de projection : rouge avant le retrait, puis 23 contrats SEO/compactage PASS ; 249 tests applicatifs, TypeScript app/node et build PASS.
- Validation générée : 13 137 URL sitemap et 2 478 pages Explorer PASS. Relecture indépendante sans problème concret.
- Recette navigateur locale : 56/56 scénarios FR/EN PASS avec/sans sauvegarde, onglets secondaires et rechargement. Vérification publique distincte après déploiement.

Preuve structurée : output/tooltrim-bootstrap-projection-2026-10-08/verification.json. Le gain cumulé sur les fichiers ne représente pas le téléchargement d'une page et ne préjuge pas du gain HTTP compressé. Les contrôles SEO techniques ne garantissent pas les classements.

Les catégories locales, exports non suivis et autres champs candidats ne font pas partie de cette publication. Dette design préexistante inchangée.
