# Couverture des données d’une fiche

## État implémenté — 6 novembre 2026

L’édition directe utilise désormais la fiche réelle (`ToolDetailPresentation`), le JSON brut de la session privée et les droits calculés par le serveur. Le registre actif est `src/lib/catalogFieldRegistry.ts` : **391 chemins enregistrés, 372 éditables, 81 racines**, répartis entre présentation, classement/usages/publics, analyse/notation, prix, médias, liens, relations, SEO, métadonnées et informations protégées. Ce registre et `catalogPolicy.ts` remplacent les droits de l’ancien contrat décrits dans le relevé historique ci-dessous.

Les tests de `CatalogEditingContext.test.tsx` parcourent les racines et feuilles éditables avec des contrôles typés ; `ToolDetailPresentation.test.tsx` vérifie leur emplacement dans la fiche partagée. `e2e/backoffice-inline-acceptance.spec.ts` compare les fiches brutes Notion, Attio, Asana et Chronokura avec leur brouillon rechargé, puis exerce les premières valeurs sur une fiche sans offres ni notation. `e2e/tool-hydration.spec.ts` compare les routes publiques générées et hydratées, leur texte, leurs métadonnées et leurs faits tarifaires, en FR/EN à 390, 768 et 1440 px.

Le JSON actuel contient 1 357 fiches. Le vocabulaire réellement fourni par le hook public contient 1 248 fiches actives : les 109 slugs consolidés sont volontairement retirés des listes. La mesure de montage unitaire avec les 1 357 résumés et la recette navigateur avec les 1 248 choix actifs sont deux preuves distinctes.

Limites conservées : les alternatives historiques `{name, reason}`, les articles enregistrés, la migration et le déclassement n’inventent aucun nouveau bloc public ; les contrôles expliquent leur projection actuelle. Les identifiants, valeurs calculées et données inconnues restent protégés ou préservés. La traduction de certaines options de type d’outil/métier et le message de refus d’une transaction de collection avec droits partiels restent des améliorations mineures ; aucun compte éditeur à droits partiels n’est ouvert par cette livraison. Un PUT de snapshot complet ne peut pas distinguer sémantiquement tout retrait+ajout d’un renommage d’identité accompagné d’autres modifications ; l’interface n’expose pas le renommage des clés, et le serveur protège les identités conservées et refuse le renommage isolé.

## Relevé historique avant implémentation

Snapshot local du 29 octobre 2026, 1356 fiches : **81 clés distinctes**. Le contrat actuel autorise 30 propriétés racines ; cela ne signifie pas que tous leurs sous-champs sont éditables. Une case « Oui » est un droit du contrat actuel, pas une preuve de visibilité ni de fidélité au rendu.

Les clés historiques ou inconnues ne deviennent pas automatiquement des champs libres. La cible doit donner accès aux données métier administrables et expliquer explicitement les valeurs calculées, identifiants, alias et données de dossier. Ce relevé est exhaustif des clés racines observées ; le traçage fin de chaque sous-chemin et consommateur reste une gate d’implémentation.

| Famille | Clé source | Présente | Types observés | Contrat actuel | Traitement à couvrir |
|---|---|---:|---|---|---|
| Liens commerciaux | `affiliateCtaLabelEn` | 47 | string | Non | Édition administrateur guidée à couvrir |
| Liens commerciaux | `affiliateCtaLabelFr` | 47 | string | Non | Édition administrateur guidée à couvrir |
| Liens commerciaux | `affiliateDisclosureEn` | 2 | string | Non | Édition administrateur guidée à couvrir |
| Liens commerciaux | `affiliateDisclosureFr` | 2 | string | Non | Édition administrateur guidée à couvrir |
| Liens commerciaux | `affiliateLink` | 1354 | null / string | Oui | Édition administrateur guidée à couvrir |
| Relations et alternatives | `alternatives` | 1354 | tableau | Oui | Édition administrateur guidée à couvrir |
| Dossier et cycle de vie | `articles` | 1346 | tableau | Non | Métadonnée ou preuve à tracer ; accès dédié explicite |
| Usages et classement | `bestFor` | 516 | tableau | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Relations et alternatives | `betterAlternative` | 1187 | null / object / string | Non | Édition administrateur guidée à couvrir |
| Relations et alternatives | `bundle_parent` | 1335 | null / string | Non | Édition administrateur guidée à couvrir |
| Identité | `category` | 1356 | string | Oui | Édition administrateur guidée à couvrir |
| Identité | `categoryId` | 274 | string | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Relations et alternatives | `complements` | 1 | tableau | Non | Édition administrateur guidée à couvrir |
| Analyse et notation | `cons` | 1356 | tableau | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `consEn` | 1356 | null / tableau | Oui | Édition administrateur guidée à couvrir |
| Usages et classement | `covers` | 1352 | tableau | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `decision_policy_v3` | 1179 | null / object | Non | Édition administrateur guidée à couvrir |
| Prix et offres | `defaultMonthlyPrice` | 1353 | null / number | Oui | Référence historique à distinguer du tarif effectif |
| Présentation | `description` | 1355 | string | Oui | Édition administrateur guidée à couvrir |
| Présentation | `descriptionEn` | 21 | string | Oui | Édition administrateur guidée à couvrir |
| Relations et alternatives | `downgradePlan` | 1187 | null / object / string | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `force_silence` | 1183 | boolean | Non | Édition administrateur guidée à couvrir |
| Relations et alternatives | `freeAlternative` | 1187 | null / string | Non | Édition administrateur guidée à couvrir |
| Usages et classement | `functional_needs` | 1355 | tableau | Non | Édition administrateur guidée à couvrir |
| Médias | `galleryImages` | 412 | tableau | Oui | Édition administrateur guidée à couvrir |
| Médias | `gallery_images` | 1 | tableau | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Relations et alternatives | `host_app` | 1322 | null / string | Non | Édition administrateur guidée à couvrir |
| Usages et classement | `ia_use_case` | 1178 | null / string / tableau | Non | Édition administrateur guidée à couvrir |
| Identité | `id` | 1356 | string | Non | Identifiant protégé |
| Relations et alternatives | `integrates_with` | 1 | tableau | Non | Édition administrateur guidée à couvrir |
| Dossier et cycle de vie | `lifecycle` | 394 | object | Non | Métadonnée ou preuve à tracer ; accès dédié explicite |
| Dossier et cycle de vie | `lifecycleStatus` | 1 | string | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Identité | `link` | 196 | string | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Identité | `logo` | 1354 | null / string | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `longDescription` | 1356 | string | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `longDescriptionEn` | 1356 | null / string | Oui | Édition administrateur guidée à couvrir |
| Relations et alternatives | `migrationGuide` | 1178 | null / object / string | Non | Édition administrateur guidée à couvrir |
| Identité | `name` | 1356 | string | Oui | Édition administrateur guidée à couvrir |
| Identité | `nameEn` | 22 | string | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Médias | `ogImageUrl` | 1235 | null / string | Oui | Édition administrateur guidée à couvrir |
| Usages et classement | `personas` | 1180 | tableau | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `pivot_integration_source` | 57 | boolean | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `prescription_block_reasons` | 1181 | tableau | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `prescription_context_questions` | 1181 | tableau | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `prescription_output` | 1181 | null / object / string | Non | Sortie à tracer avant édition ; ne pas inventer un contrôle manuel |
| Recommandations ToolTrim | `prescription_quality` | 1181 | string | Non | Édition administrateur guidée à couvrir |
| Prix et offres | `pricing` | 1356 | null / object / string | Oui | Édition administrateur guidée à couvrir |
| Prix et offres | `pricingEn` | 1356 | null / object / string | Oui | Édition administrateur guidée à couvrir |
| Prix et offres | `pricingTiers` | 368 | object | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Prix et offres | `pricing_v5` | 1351 | null / object | Oui | Édition administrateur guidée à couvrir |
| Prix et offres | `pricing_v5En` | 593 | object | Oui | Édition administrateur guidée à couvrir |
| Liens commerciaux | `promoCode` | 1 | string | Non | Édition administrateur guidée à couvrir |
| Liens commerciaux | `promoDescriptionEn` | 1 | string | Non | Édition administrateur guidée à couvrir |
| Liens commerciaux | `promoDescriptionFr` | 1 | string | Non | Édition administrateur guidée à couvrir |
| Analyse et notation | `pros` | 1356 | tableau | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `prosEn` | 1356 | null / tableau | Oui | Édition administrateur guidée à couvrir |
| Relations et alternatives | `relations` | 3 | tableau | Non | Édition administrateur guidée à couvrir |
| Usages et classement | `relevantFor` | 1190 | tableau | Oui | Édition administrateur guidée à couvrir |
| Usages et classement | `relevantForEn` | 3 | tableau | Oui | Édition administrateur guidée à couvrir |
| Dossier et cycle de vie | `research` | 396 | object | Non | Métadonnée ou preuve à tracer ; accès dédié explicite |
| Référencement | `seo` | 1356 | null / object | Oui | Édition administrateur guidée à couvrir |
| Présentation | `shortDescription` | 1356 | string | Oui | Édition administrateur guidée à couvrir |
| Présentation | `shortDescriptionEn` | 1356 | string | Oui | Édition administrateur guidée à couvrir |
| Identité | `slug` | 1356 | string | Non | Identifiant protégé |
| Usages et classement | `soloRelevance` | 1350 | null / string | Non | Édition administrateur guidée à couvrir |
| Relations et alternatives | `substitutable` | 1355 | boolean | Non | Édition administrateur guidée à couvrir |
| Relations et alternatives | `substitution_cluster_v2` | 1324 | null / string | Non | Édition administrateur guidée à couvrir |
| Présentation | `tagline` | 390 | object | Non | Édition administrateur guidée à couvrir |
| Usages et classement | `tags` | 5 | tableau | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Usages et classement | `teamRelevance` | 1350 | null / string | Non | Édition administrateur guidée à couvrir |
| Recommandations ToolTrim | `timeGainedHoursPerMonth` | 984 | null / number | Non | Édition administrateur guidée à couvrir |
| Analyse et notation | `toolTrimRating` | 602 | object | Non | Critères, preuves et dates éditables ToolTrim ; total calculé en lecture |
| Identité | `tool_type` | 1355 | string | Non | Édition administrateur guidée à couvrir |
| Usages et classement | `useCases` | 1356 | tableau | Oui | Édition administrateur guidée à couvrir |
| Usages et classement | `useCasesEn` | 1356 | null / tableau | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `verdict` | 1356 | null / object | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `verdictEn` | 1356 | null / object | Oui | Édition administrateur guidée à couvrir |
| Analyse et notation | `verdictFr` | 3 | object | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Usages et classement | `verticals` | 1355 | tableau | Non | Édition administrateur guidée à couvrir |
| Identité | `website` | 342 | string | Non | Compatibilité à relier au champ actif, pas de second champ à saisir |
| Identité | `websiteUrl` | 1356 | null / string | Oui | Édition administrateur guidée à couvrir |

## Sous-champs qui ne doivent plus être oubliés

- **Notation ToolTrim** : les cinq critères `valeurAjoutee`, `simplicite`, `utilisation`, `puissance`, `reversibilite`, leurs justifications FR/EN, `notedOn` et `lastActivityVerifiedOn`. Une valeur de critère peut être non renseignée ; une note globale et un libellé restent calculés, avec affichage de leur origine v2 ou historique. Ne pas changer la formule sous couvert d’édition.
- **Verdict** : `keepIf`, `avoidIf`, `threshold`, `profitableIf`, `tooExpensiveIf`, `profileTable`, `billingTraps`, `faqPriceAnswer` et leurs variantes linguistiques. `profileTable` existe dans les types mais manque au schéma imbriqué actuel ; exposer le parent ne suffit pas.
- **Tarifs** : offre, identité stable, disponibilité, montant annoncé, devise, périodicité du montant, engagement, unité, taxes, marché, sources et dates ; variantes FR/EN des textes ; prix de comparaison explicitement choisi et valeurs mensuelles/annuelles dérivées. Couvrir aussi minimum de sièges, réserves, exemples TCO et tableaux éditoriaux de coûts lorsque présents.
- **Usages et tags** : séparer capacités (`covers`), besoins (`functional_needs`), cas d’usage rédigés, publics/métiers, verticales et usages IA. `tags` brut n’est présent que sur cinq fiches : il ne représente pas à lui seul le classement réellement utilisé. Les libellés traduits proviennent des référentiels, pas d’une seconde liste de prix ou de tags « anglais ».
- **Impact public** : distinguer valeurs stockées et valeurs servies. Par exemple `ToolFeaturesBlock` fusionne les capacités et besoins, déduplique puis limite à six fonctionnalités ; enregistrer un septième tag ne garantit pas sa présence immédiate dans ce bloc.

## Critère de fin

Aucune donnée métier ne reste implicitement absente de l’éditeur. Pour chaque chemin : contrôle disponible, contrôle calculé explicite, champ de compatibilité relié à sa source active, ou exclusion motivée et visible. Le même contrôle est relié à une validation serveur et à une vérification des consommateurs publics.

## Inventaire des chemins observés

Relevé du 29 octobre 2026 : **320 chemins terminaux normalisés**, sur 1356 fiches. `[]` remplace l’index d’un tableau ; null, tableau vide et objet vide restent observables. La présence compte les fiches, pas le nombre d’éléments. Ce relevé évite de réduire la couverture aux clés racines ; il ne prétend pas que chaque chemin est relié à un contrôle ou à son consommateur public. Les chemins de schéma autorisés mais jamais présents doivent être ajoutés au registre produit séparément.

<details>
<summary>Voir les chemins et types présents dans le snapshot</summary>

| Chemin normalisé | Types observés | Fiches |
|---|---|---:|
| `affiliateCtaLabelEn` | string | 47 |
| `affiliateCtaLabelFr` | string | 47 |
| `affiliateDisclosureEn` | string | 2 |
| `affiliateDisclosureFr` | string | 2 |
| `affiliateLink` | null / string | 1354 |
| `alternatives` | tableau vide | 621 |
| `alternatives[]` | string | 729 |
| `alternatives[].name` | string | 4 |
| `alternatives[].reason` | string | 4 |
| `articles` | tableau vide | 1340 |
| `articles[].excerpt` | string | 6 |
| `articles[].slug` | string | 6 |
| `articles[].title` | string | 6 |
| `bestFor` | tableau vide | 48 |
| `bestFor[]` | string | 468 |
| `betterAlternative` | null / string | 1154 |
| `betterAlternative.performanceGain` | null / string | 33 |
| `betterAlternative.performanceGainEn` | string | 4 |
| `betterAlternative.reason` | string | 33 |
| `betterAlternative.reasonEn` | string | 4 |
| `betterAlternative.saving` | null / number | 33 |
| `betterAlternative.tool` | string | 33 |
| `bundle_parent` | null / string | 1335 |
| `category` | string | 1356 |
| `categoryId` | string | 274 |
| `complements[]` | string | 1 |
| `cons` | tableau vide | 62 |
| `cons[]` | string | 1294 |
| `consEn` | null / tableau vide | 68 |
| `consEn[]` | string | 1288 |
| `covers` | tableau vide | 11 |
| `covers[]` | string | 1341 |
| `decision_policy_v3` | null | 576 |
| `decision_policy_v3.auto_cancel_allowed` | boolean | 603 |
| `decision_policy_v3.auto_downgrade_allowed` | boolean | 603 |
| `decision_policy_v3.auto_replace_allowed` | boolean | 603 |
| `decision_policy_v3.default_decision_lane` | string | 404 |
| `decision_policy_v3.never_auto_cancel_reason` | null / string | 403 |
| `decision_policy_v3.requires_context_questions` | boolean | 404 |
| `defaultMonthlyPrice` | null / number | 1353 |
| `description` | string | 1355 |
| `descriptionEn` | string | 21 |
| `downgradePlan` | null / string | 1098 |
| `downgradePlan.available` | boolean | 89 |
| `downgradePlan.freeTier` | null / string | 89 |
| `force_silence` | boolean | 1183 |
| `freeAlternative` | null / string | 1187 |
| `functional_needs` | tableau vide | 8 |
| `functional_needs[]` | string | 1347 |
| `gallery_images[]` | string | 1 |
| `galleryImages` | tableau vide | 89 |
| `galleryImages[]` | string | 323 |
| `host_app` | null / string | 1322 |
| `ia_use_case` | null / string | 1122 |
| `ia_use_case[]` | string | 56 |
| `id` | string | 1356 |
| `integrates_with[]` | string | 1 |
| `lifecycle.checkedOn` | string | 394 |
| `lifecycle.note` | null / string | 385 |
| `lifecycle.note.en` | string | 6 |
| `lifecycle.note.fr` | string | 6 |
| `lifecycle.status` | string | 394 |
| `lifecycleStatus` | string | 1 |
| `link` | string | 196 |
| `logo` | null / string | 1354 |
| `longDescription` | string | 1356 |
| `longDescriptionEn` | null / string | 1356 |
| `migrationGuide` | null / string | 1166 |
| `migrationGuide.dataLoss` | string | 12 |
| `migrationGuide.steps[]` | string | 12 |
| `migrationGuide.timeEstimate` | string | 12 |
| `name` | string | 1356 |
| `nameEn` | string | 22 |
| `ogImageUrl` | null / string | 1235 |
| `personas` | tableau vide | 302 |
| `personas[]` | string | 878 |
| `pivot_integration_source` | boolean | 57 |
| `prescription_block_reasons` | tableau vide | 829 |
| `prescription_block_reasons[]` | string | 352 |
| `prescription_context_questions` | tableau vide | 811 |
| `prescription_context_questions[]` | string | 370 |
| `prescription_output` | null / string | 1159 |
| `prescription_output.action` | string | 22 |
| `prescription_output.confidence` | string | 22 |
| `prescription_output.gain_annual_eur` | number | 22 |
| `prescription_output.gain_monthly_eur` | number | 22 |
| `prescription_output.mode` | string | 22 |
| `prescription_output.price_alt_eur` | number | 22 |
| `prescription_output.price_tool_eur` | number | 22 |
| `prescription_output.replacement_tool` | string | 22 |
| `prescription_output.verified_on` | string | 22 |
| `prescription_quality` | string | 1181 |
| `pricing` | null / string | 121 |
| `pricing_v5` | null | 253 |
| `pricing_v5.affiliate_url` | string | 1 |
| `pricing_v5.annual_monthly_eur` | number | 29 |
| `pricing_v5.billing_model` | string | 25 |
| `pricing_v5.billing_note` | string | 29 |
| `pricing_v5.billing_options[].currency` | string | 16 |
| `pricing_v5.billing_options[].label_en` | string | 22 |
| `pricing_v5.billing_options[].label_fr` | string | 22 |
| `pricing_v5.billing_options[].needs_verification` | boolean | 22 |
| `pricing_v5.billing_options[].price_monthly_eur` | number | 22 |
| `pricing_v5.billing_options[].price_original` | number | 12 |
| `pricing_v5.billing_options[].value` | string | 22 |
| `pricing_v5.cautions` | tableau vide | 138 |
| `pricing_v5.cautions[]` | string | 843 |
| `pricing_v5.cautionsEn` | tableau vide | 26 |
| `pricing_v5.cautionsEn[]` | string | 427 |
| `pricing_v5.compare_plan_kind` | string | 1043 |
| `pricing_v5.compare_plan_name` | null / string | 1043 |
| `pricing_v5.compare_price_monthly_eur` | null / number | 995 |
| `pricing_v5.conversion_rate_to_eur` | number | 4 |
| `pricing_v5.costTable[].annualUsd` | string | 1 |
| `pricing_v5.costTable[].monthlyUsd` | string | 1 |
| `pricing_v5.costTable[].plan` | string | 1 |
| `pricing_v5.costTable[].planEn` | string | 1 |
| `pricing_v5.costTable[].team` | string | 1 |
| `pricing_v5.costTable[].teamEn` | string | 1 |
| `pricing_v5.costTable[].verdictEn` | string | 1 |
| `pricing_v5.costTable[].verdictFr` | string | 1 |
| `pricing_v5.costTableNoteEn` | string | 1 |
| `pricing_v5.costTableNoteFr` | string | 1 |
| `pricing_v5.currency` | string | 19 |
| `pricing_v5.currency_original` | string | 29 |
| `pricing_v5.free_plan_card` | string | 8 |
| `pricing_v5.free_plan_cardEn` | string | 4 |
| `pricing_v5.free_tier` | boolean | 29 |
| `pricing_v5.free_tier_note` | string | 29 |
| `pricing_v5.location_sensitive` | boolean | 844 |
| `pricing_v5.minSeats` | number | 14 |
| `pricing_v5.monthly_eur` | number | 29 |
| `pricing_v5.official_source_url` | null / string | 1082 |
| `pricing_v5.plan_name` | string | 29 |
| `pricing_v5.plans` | tableau vide | 191 |
| `pricing_v5.plans[].billingCommitment` | null / string | 498 |
| `pricing_v5.plans[].billingPeriod` | null / string | 509 |
| `pricing_v5.plans[].comingSoon` | boolean | 1 |
| `pricing_v5.plans[].detailsSourceUrl` | string | 510 |
| `pricing_v5.plans[].displayName` | string | 513 |
| `pricing_v5.plans[].featureHighlights` | tableau vide | 50 |
| `pricing_v5.plans[].featureHighlights[]` | string | 411 |
| `pricing_v5.plans[].isComparePlan` | boolean | 513 |
| `pricing_v5.plans[].isFree` | boolean | 513 |
| `pricing_v5.plans[].lastConfirmedOn` | string | 502 |
| `pricing_v5.plans[].nativeAmount` | null / number | 513 |
| `pricing_v5.plans[].nativeCurrency` | null / string | 513 |
| `pricing_v5.plans[].observedLocale` | string | 20 |
| `pricing_v5.plans[].observedMarket` | null / string | 469 |
| `pricing_v5.plans[].observedOn` | string | 509 |
| `pricing_v5.plans[].planKey` | string | 513 |
| `pricing_v5.plans[].pricingUnit` | string | 476 |
| `pricing_v5.plans[].summary` | null / string | 475 |
| `pricing_v5.plans[].taxInclusion` | string | 504 |
| `pricing_v5.price_original` | number | 48 |
| `pricing_v5.price_original_currency` | string | 18 |
| `pricing_v5.price_reliability` | string | 1041 |
| `pricing_v5.reliability` | string | 29 |
| `pricing_v5.showCostTable` | boolean | 2 |
| `pricing_v5.source_domain` | null / string | 1082 |
| `pricing_v5.source_url` | string | 29 |
| `pricing_v5.tcoExampleEn` | string | 59 |
| `pricing_v5.tcoExampleFr` | string | 59 |
| `pricing_v5.usage_sensitive` | boolean | 1034 |
| `pricing_v5.verification_status` | string | 1077 |
| `pricing_v5.verified_on` | string | 1097 |
| `pricing_v5En.affiliate_url` | string | 1 |
| `pricing_v5En.cautions` | tableau vide | 25 |
| `pricing_v5En.cautions[]` | string | 568 |
| `pricing_v5En.cautionsEn[]` | string | 10 |
| `pricing_v5En.compare_plan_kind` | string | 593 |
| `pricing_v5En.compare_plan_name` | null / string | 593 |
| `pricing_v5En.compare_price_monthly_eur` | null / number | 593 |
| `pricing_v5En.free_plan_card` | string | 8 |
| `pricing_v5En.location_sensitive` | boolean | 226 |
| `pricing_v5En.minSeats` | number | 10 |
| `pricing_v5En.official_source_url` | null / string | 593 |
| `pricing_v5En.plans` | tableau vide | 174 |
| `pricing_v5En.plans[].billingCommitment` | null / string | 408 |
| `pricing_v5En.plans[].billingPeriod` | null / string | 415 |
| `pricing_v5En.plans[].detailsSourceUrl` | string | 416 |
| `pricing_v5En.plans[].displayName` | string | 419 |
| `pricing_v5En.plans[].featureHighlights` | tableau vide | 9 |
| `pricing_v5En.plans[].featureHighlights[]` | string | 373 |
| `pricing_v5En.plans[].isComparePlan` | boolean | 419 |
| `pricing_v5En.plans[].isFree` | boolean | 419 |
| `pricing_v5En.plans[].lastConfirmedOn` | string | 411 |
| `pricing_v5En.plans[].nativeAmount` | null / number | 419 |
| `pricing_v5En.plans[].nativeCurrency` | null / string | 419 |
| `pricing_v5En.plans[].observedLocale` | string | 7 |
| `pricing_v5En.plans[].observedMarket` | null / string | 379 |
| `pricing_v5En.plans[].observedOn` | string | 419 |
| `pricing_v5En.plans[].planKey` | string | 419 |
| `pricing_v5En.plans[].pricingUnit` | string | 386 |
| `pricing_v5En.plans[].summary` | null / string | 419 |
| `pricing_v5En.plans[].taxInclusion` | string | 411 |
| `pricing_v5En.price_reliability` | string | 593 |
| `pricing_v5En.source_domain` | null / string | 593 |
| `pricing_v5En.usage_sensitive` | boolean | 593 |
| `pricing_v5En.verification_status` | string | 593 |
| `pricing_v5En.verified_on` | string | 593 |
| `pricing.free` | null / string | 1234 |
| `pricing.paid` | null / string | 1232 |
| `pricingEn` | null / string | 199 |
| `pricingEn.free` | null / string | 1157 |
| `pricingEn.paid` | null / string | 1156 |
| `pricingTiers.free` | string | 359 |
| `pricingTiers.paid` | string | 366 |
| `promoCode` | string | 1 |
| `promoDescriptionEn` | string | 1 |
| `promoDescriptionFr` | string | 1 |
| `pros` | tableau vide | 64 |
| `pros[]` | string | 1292 |
| `prosEn` | null / tableau vide | 70 |
| `prosEn[]` | string | 1286 |
| `relations[].confidence` | string | 3 |
| `relations[].kind` | string | 3 |
| `relations[].needKeys[]` | string | 3 |
| `relations[].targetToolId` | string | 3 |
| `relevantFor` | tableau vide | 8 |
| `relevantFor[]` | string | 1182 |
| `relevantForEn[]` | string | 3 |
| `research.dossier` | null / string | 389 |
| `research.researchedOn` | string | 396 |
| `research.sources` | number | 391 |
| `seo` | null / objet vide | 78 |
| `seo.aiAngle.aiTools` | tableau vide | 218 |
| `seo.aiAngle.aiTools[]` | string | 124 |
| `seo.aiAngle.augmentEn` | string | 342 |
| `seo.aiAngle.augmentFr` | string | 342 |
| `seo.aiAngle.replaceEn` | string | 342 |
| `seo.aiAngle.replaceFr` | string | 342 |
| `seo.aiAngle.stance` | string | 342 |
| `seo.altMetaDescriptionEn` | string | 1245 |
| `seo.altMetaDescriptionFr` | string | 1245 |
| `seo.altTitleEn` | string | 1245 |
| `seo.altTitleFr` | string | 1245 |
| `seo.avisMetaDescriptionEn` | string | 1245 |
| `seo.avisMetaDescriptionFr` | string | 1245 |
| `seo.avisTitleEn` | string | 1245 |
| `seo.avisTitleFr` | string | 1245 |
| `seo.idealForEn` | string | 598 |
| `seo.idealForFr` | string | 598 |
| `seo.metaDescription` | string | 866 |
| `seo.metaDescriptionEn` | string | 214 |
| `seo.metaTitle` | string | 6 |
| `seo.presentationMetaDescriptionEn` | string | 1245 |
| `seo.presentationMetaDescriptionFr` | string | 1245 |
| `seo.presentationTitleEn` | string | 1245 |
| `seo.presentationTitleFr` | string | 1245 |
| `seo.prixMetaDescriptionEn` | string | 1245 |
| `seo.prixMetaDescriptionFr` | string | 1245 |
| `seo.prixTitleEn` | string | 1244 |
| `seo.prixTitleFr` | string | 1244 |
| `shortDescription` | string | 1356 |
| `shortDescriptionEn` | string | 1356 |
| `slug` | string | 1356 |
| `soloRelevance` | null / string | 1350 |
| `substitutable` | boolean | 1355 |
| `substitution_cluster_v2` | null / string | 1324 |
| `tagline.en` | string | 390 |
| `tagline.fr` | string | 390 |
| `tags[]` | string | 5 |
| `teamRelevance` | null / string | 1350 |
| `timeGainedHoursPerMonth` | null / number | 984 |
| `tool_type` | string | 1355 |
| `toolTrimRating.evidence.puissance` | string | 602 |
| `toolTrimRating.evidence.reversibilite` | string | 602 |
| `toolTrimRating.evidence.simplicite` | string | 602 |
| `toolTrimRating.evidence.utilisation` | string | 602 |
| `toolTrimRating.evidence.valeurAjoutee` | string | 602 |
| `toolTrimRating.evidenceEn.puissance` | string | 602 |
| `toolTrimRating.evidenceEn.reversibilite` | string | 602 |
| `toolTrimRating.evidenceEn.simplicite` | string | 602 |
| `toolTrimRating.evidenceEn.utilisation` | string | 602 |
| `toolTrimRating.evidenceEn.valeurAjoutee` | string | 602 |
| `toolTrimRating.lastActivityVerifiedOn` | null / string | 599 |
| `toolTrimRating.notedOn` | string | 602 |
| `toolTrimRating.puissance` | number | 602 |
| `toolTrimRating.reversibilite` | number | 602 |
| `toolTrimRating.simplicite` | number | 602 |
| `toolTrimRating.utilisation` | number | 602 |
| `toolTrimRating.valeurAjoutee` | number | 602 |
| `useCases` | tableau vide | 67 |
| `useCases[]` | string | 1289 |
| `useCasesEn` | null / tableau vide | 73 |
| `useCasesEn[]` | string | 1283 |
| `verdict` | null | 1 |
| `verdict.avoidIf[]` | string | 1355 |
| `verdict.billingTraps` | tableau vide | 1 |
| `verdict.billingTraps[].text` | string | 189 |
| `verdict.billingTraps[].title` | string | 189 |
| `verdict.faqPriceAnswer` | string | 5 |
| `verdict.keepIf` | tableau vide | 2 |
| `verdict.keepIf[]` | string | 1353 |
| `verdict.profitableIf[]` | string | 1 |
| `verdict.threshold` | string | 1355 |
| `verdict.tooExpensiveIf[]` | string | 1 |
| `verdictEn` | null | 12 |
| `verdictEn.avoidIf[]` | string | 1344 |
| `verdictEn.billingTraps` | tableau vide | 1 |
| `verdictEn.billingTraps[].text` | string | 188 |
| `verdictEn.billingTraps[].title` | string | 188 |
| `verdictEn.faqPriceAnswer` | string | 5 |
| `verdictEn.keepIf` | tableau vide | 2 |
| `verdictEn.keepIf[]` | string | 1342 |
| `verdictEn.profitableIf[]` | string | 1 |
| `verdictEn.threshold` | string | 1344 |
| `verdictEn.tooExpensiveIf[]` | string | 1 |
| `verdictFr.avoidIf[]` | string | 3 |
| `verdictFr.billingTraps[]` | string | 3 |
| `verdictFr.keepIf[]` | string | 3 |
| `verdictFr.label` | string | 3 |
| `verdictFr.score` | number | 3 |
| `verdictFr.summary` | string | 3 |
| `verdictFr.tcoExampleFr` | string | 3 |
| `verdictFr.threshold` | string | 3 |
| `verticals[]` | string | 1355 |
| `website` | string | 342 |
| `websiteUrl` | null / string | 1356 |

</details>
