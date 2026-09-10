# Soumission — revue de conversion du 10 septembre 2026

## Objectif

Transformer les visites d’éditeurs SaaS en soumissions complètes, en rendant le livrable éditorial, le prix et le parcours compréhensibles dès le premier écran. Pas de données de conversion ni de campagne source fournies : cette passe est une hypothèse de design et de copywriting, pas une mesure de performance.

## Diagnostic et changements

- Le bénéfice initial était dominé par l’absence de badge. Le hero présente désormais la découverte au moment du choix et la fiche rédigée par ToolTrim.
- Un aperçu explicatif montre les informations d’une fiche, sans inventer de témoignage, de note ni de résultats commerciaux.
- Le chiffre « 1 100+ outils référencés » décrit le catalogue, pas l’audience ni les clients payants. L’index local contient 1 162 outils au moment de la revue.
- L’offre prioritaire garde son prix de 29 USD, son paiement unique, le délai existant de cinq jours ouvrés et l’aller-retour factuel. Le verdict reste indépendant.
- Le parcours gratuit et ses conditions restent accessibles depuis le comparatif des offres.
- Les étapes expliquent qui rédige, quand l’éditeur intervient et ce qui se passe après le paiement.
- Les CTA sont présents dans le hero, l’offre et la conclusion. Le contact partenariat est déplacé en fin de page.
- Fond blanc et surface secondaire #F5F5F7 repris du checkout toolstack-wizard-clean, appliqués à la page seulement. Styles dans @layer components.
- Le formulaire rappelle la formule et distingue « Continuer vers le paiement » de « Continuer vers le badge ».

## Mesure après publication

L’événement existant submit_plan_select reçoit maintenant une source : hero, offers ou closing. submit_priority_checkout mesure le départ au checkout ; il ne prouve pas un paiement. submit_tool mesure la soumission finale côté client ; les paiements doivent être rapprochés des données du prestataire pour calculer une conversion commerciale.

Hypothèse principale : expliquer le livrable et le public avant les conditions du badge augmente les soumissions complètes par visite. Comparer l’ancienne et la nouvelle page par un test A/B simultané si l’outillage le permet. Métrique principale : soumissions complètes / visiteurs uniques de /submit ; métrique commerciale : paiements confirmés / visiteurs uniques. Suivre séparément FR/EN, mobile/desktop et source d’acquisition.

Aucune taille d’échantillon ni hausse attendue ne peut être justifiée sans trafic et taux de base. Définir un effet minimal utile, calculer l’échantillon à partir du taux observé, puis couvrir des semaines complètes sans arrêter le test au premier résultat positif. Le nouveau découpage des sources CTA sert au diagnostic, pas à attribuer une causalité.

## Validation

- TypeScript et build production avec prerender : PASS ; Supabase HTTP 402 traité par le fallback JSON existant.
- Contrôle visuel desktop et mobile 390 px ; largeur du document égale à celle du viewport.
- Choix des deux formules, rappel de la formule, libellé de prochaine étape et retour aux offres vérifiés.
- Aucun formulaire transmis ni paiement lancé lors de cette vérification : les endpoints locaux redirigent vers la production.

## Repasse après revue avec le propriétaire

La version finale remplace « Faire rédiger ma fiche » par « Référencer mon outil » et nomme l’offre payante « Publication prioritaire ». L’absence de badge demeure une condition explicite. Le panneau fictif est remplacé par un exemple réel du catalogue (Loyzia) et un accès à sa fiche. L’URL arrive en premier dans les champs existants, sans changer les données demandées ni les API.

Le DR 28 est une donnée communiquée par le propriétaire dans cette conversation, non vérifiée indépendamment ; le bloc l’accompagne du mois de communication, septembre 2026. La progression historique n’est pas affichée. Ni ce score ni les 1 100+ outils ne sont présentés comme une mesure d’audience ou une garantie de trafic. Le troisième repère présente le lien dofollow vers le site officiel, vérifié sur le rendu des fiches, sans promettre de progression dans les résultats de recherche.
