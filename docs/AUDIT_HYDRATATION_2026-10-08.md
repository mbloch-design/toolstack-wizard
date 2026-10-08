# Audit des données d'hydratation — 8 octobre 2026

Audit seulement : aucune suppression de champs ou modification de la source catalogue.

## Mesures

Sur le build compacté, 76,62 MiB de JSON applicatif sont intégrés aux HTML, distincts des données structurées JSON-LD et du contenu rendu :

| Bootstrap | Poids |
|---|---:|
| Outil `__SSR_TOOL__` | 67,82 MiB |
| Comparaison `__SSR_COMPARE__` | 4,28 MiB |
| Stack `__SSR_STACK__` | 3,37 MiB |
| Guide `__SSR_POST__` | 0,78 MiB |
| Guides liés `__SSR_RELATED_POSTS__` | 0,38 MiB |

La mesure des fiches couvre 9 912 documents et comptabilise les mêmes outils sur plusieurs sous-pages. Ce poids ne représente pas le téléchargement d'une seule page.

## Candidats, sans suppression

- Groupe historique : `description`, `research`, `lifecycle`, `website`, `verdictFr`, `pivot_integration_source`, `relevantForEn`. Projection sans ces sept champs : **5 861 952 octets, soit 5,59 MiB**, sur 9 904 documents. Les descriptions réellement utilisées sont `shortDescription` / `longDescription` et leurs variantes EN ; le site officiel utilise `websiteUrl`. Les autres accès `.description` trouvés concernent les catégories, guides ou présentations de cartes, pas ce champ brut du bootstrap outil.
- Groupe uniquement transporté par les adaptateurs : `decision_policy_v3`, `pricingTiers`, `prescription_context_questions`, `prescription_block_reasons`, `prescription_output`, `downgradePlan`, `migrationGuide`, `articles`, `timeGainedHoursPerMonth`, `affiliateDisclosureFr`, `affiliateDisclosureEn`. Aucun consommateur direct repéré hors des adaptateurs dans l'analyse statique des sources suivies ; gain marginal théorique **3,09 MiB**. Classification provisoire : les accès dynamiques et les futurs écrans demandent une vérification ciblée.

Les gains calculés incluent les clés JSON et séparateurs retirés. Ils concernent uniquement `__SSR_TOOL__`, pas les comparaisons, et ne garantissent pas un gain identique sur les réponses HTTP compressées.

## Observation dans le navigateur

Proxy de lecture temporaire installé avant le chargement du JavaScript, sur une copie locale du HTML réellement prérendu. Aucun code d'instrumentation ajouté au produit et aucune valeur modifiée. **42 routes FR/EN** disponibles de sept outils : Notion, 1001bit Tools, 17hats, 8fig, Adobe Acrobat Sign, Condeco, Viso AI ; présentations, prix, alternatives et avis selon les routes existantes.

Les sept champs historiques sont présents dans l'échantillon. **Aucune lecture observée de ces champs et aucune énumération globale de l'objet**. Cela confirme le candidat sur ces parcours initiaux, sans prouver tous les parcours interactifs possibles. Les champs utiles de prix, score, SEO et descriptions éditoriales sont bien lus et restent à conserver.

## Priorité découverte : parité SSR / client en anglais

Les pages EN de l'échantillon font apparaître des erreurs React d'hydratation. Reproduction sans Proxy sur Notion EN : mêmes erreurs #418/#422 en local et sur `https://tooltrim.com/en/tool/notion` avant publication du compactage ; Notion FR est sans erreur dans cette comparaison.

Diagnostic déterministe sur Notion EN avec le renderer compilé du même build :

- Le bootstrap EN réduit ne reproduit pas l'arbre du rendu serveur initial.
- Rétablir les champs FR présents sur la version française (`shortDescription`, `longDescription`, `pricing`, `verdict`, `pros`, `cons`, `useCases`) reproduit exactement cet arbre.
- Le helper de score historique utilise notamment `pros`, `cons` et `pricing.free` sans sélectionner les variantes EN : supprimer une langue peut donc modifier le calcul, même si le texte de la page est anglais.

Il faut corriger cette parité **avant toute nouvelle réduction des champs localisés**. Cette preuve identifie un cas précis ; elle ne certifie pas que chaque erreur de chaque page EN a la même cause.

## Suite recommandée

1. Corriger la projection du bootstrap afin de conserver les champs nécessaires aux calculs, avec une régression de parité du HTML sur les fiches FR/EN et un contrôle navigateur servant réellement le prérendu.
2. Projeter ensuite les sept champs historiques inutilisés hors du bootstrap uniquement, garder les données catalogue originales et valider les sous-pages et interactions avant publication.
3. Auditer séparément les champs transportés par les adaptateurs et les bootstraps de comparaison/stack. Ne pas supprimer les prix FR/EN, les preuves de score ou les champs SEO sous prétexte qu'ils sont volumineux.

Preuves : `output/tooltrim-hydration-audit-2026-10-08/` contient les statistiques, lectures observées, projection marginale et diagnostic de parité. Les erreurs du premier serveur temporaire pour des scripts Vercel absents ne sont pas des erreurs du site public ; la comparaison sans instrumentation neutralise ce script et confirme spécifiquement les erreurs React préexistantes.
