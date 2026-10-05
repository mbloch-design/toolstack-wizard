# Mon Stack V1 — audit et intervention (5 octobre 2026)

## Audit de l’existant

- Routes personnelles : `/:lang/ma-stack`, alias `/:lang/my-stack`, rendues par `CartPage`. `/stacks` et `/stack/:slug` sont des stacks éditoriaux publics distincts.
- Accès : sidebar `AppShellV2`, homepage et footer. À conserver.
- Fiches et cartes : `PinToolButton`, ouvrant `StackSaveMenu` (destination, intention stack/wishlist, retrait). Explorer possède aussi un dialogue d’enregistrement.
- Page personnelle : objectifs et sous-domaines, classement manuel, drag/drop, wishlist, profil estimé, coût global, recherche orientée recommandations, `StackToolInspector` proche d’une fiche complète.
- État : hook partagé `useStackPins`, modèle `stackState` v3, clé `tooltrim-ma-stack-mvp-v3`, backup, migrations v1/v2, synchronisation entre onglets. Identifiants et métadonnées de sélection uniquement, sans copie catalogue.
- Supabase : lectures catalogue avec index statique immédiat ; compte/synchronisation optionnels dans `useStackAccount`. Le stockage personnel fonctionne déjà localement. L’accès à la propriété localStorage elle-même n’est cependant pas protégé contre SecurityError.
- Catalogue léger : id/slug, nom, catégorie principale, descriptions FR/EN, logo, pricing textuel, usages fonctionnels, covers, personas, relation freeAlternative/betterAlternative, cluster de substitution, hôte/bundle. Les plans, useCases et alternatives explicites sont disponibles dans la fiche complète chargée à la demande. Les tags ne sont pas un champ général de Tool (ils existent sur les articles).
- UI : ToolLogo, icônes centralisées, toasts Sonner, liens Router, `useLang`/`t(fr,en)`, tokens CSS et shell existants. Page historique : adaptations 640/768/1024 px, interactions tactiles/clavier et mouvement réduit.

## Gap analysis

| Statut | Éléments |
|---|---|
| Conserver | Routes, accès, catalogue, identité visuelle, hook partagé, version/backup/migrations, sélection par identifiant, i18n |
| Faire évoluer | Ajout vers un clic, état déjà présent vers inspection locale, recherche intégrée sans suggestions, regroupement par catégorie principale, inspection allégée, retrait avec undo |
| Manquant | Map, mémoire du mode, relations connues limitées aux outils présents, protection du getter localStorage |
| Retirer de cette expérience | Coût global, profil estimé, organisation manuelle, objectifs vides, recommandations, compte, wishlist comme second mode |
| À valider visuellement | Densité, territoires Map et inspection intégrée ; qualité éditoriale des catégories et relations catalogue |

## Plan minimal

1. Conserver le schéma existant, protéger localStorage et ajouter une restauration ciblée pour undo (sans écraser les changements intervenus entretemps).
2. Simplifier PinToolButton : ajout immédiat, état enregistré vers `ma-stack?outil=slug`.
3. Faire évoluer CartPage en conservant sa route : catégories présentes seulement, deux modes Stack/Map, recherche directe et même surface d’inspection dans les deux modes.
4. Réutiliser StackToolInspector pour afficher catégorie, usages, tarifs catalogue natifs, plans disponibles et alternatives déjà présentes ; lien vers la fiche et retrait distinct.
5. Vérifier les fonctions, la persistance, les erreurs de stockage, les deux langues et trois tailles d’écran ; build production.

La suppression des branches de rendu historiques de CartPage est nécessaire pour retirer les objectifs manuels et le dashboard. Le modèle partagé et ses fonctions restent compatibles avec Explorer et les anciennes sélections. Les anciennes envies restent stockées et apparaissent parmi les sélections conservées : aucun effacement ou changement d’intention automatique. Les classements personnels sont conservés mais ne pilotent plus le regroupement automatique V1.

Les prix affichés sont des informations catalogue, pas les dépenses de l’utilisateur. Aucune conversion monétaire ni somme. Sans tarif natif exploitable ou offre gratuite attestée, l’étiquette est masquée.

## Décisions et limites

- Les anciens slugs introuvables restent visibles et retirables, avec annulation ; aucun effacement automatique.
- Recherche par nom/slug avec priorité au nom exact, sans résultats suggérés avant saisie.
- Map : territoires présents répartis sur trois colonnes desktop, deux en tablette, une sur mobile. Le territoire sélectionné s’élargit pour intégrer son contexte.
- Relations : références explicites et cluster de substitution partagé, jamais la seule catégorie. Ces relations restent aussi fiables que leur source catalogue.
- Lecture des données catalogue : index léger immédiat, rafraîchissement Supabase facultatif, fiche complète seulement pour l’outil inspecté. La sélection ne génère aucune écriture Supabase.
- Les protections du stockage ont été étendues au shell (thème, devise, navigation et consentement), indispensables pour ouvrir Mon Stack quand le getter localStorage lève SecurityError.
- Le script E2E historique testait les objectifs manuels et le dashboard retirés. `npm run test:e2e:ma-stack` cible désormais les parcours V1 dans `e2e/mon-stack-v1.spec.ts`.
- Le vérificateur strict TypeScript du dépôt révèle des erreurs historiques hors périmètre, dont l’alias client/SSR `detailPages` compris par Vite mais pas par TypeScript. Le build n’est donc pas présenté comme une validation de ce vérificateur strict.
- Le cliquet design-tokens est désynchronisé de l’existant. Comparaison directe avec HEAD : aucune couleur hex ni rayon littéral supplémentaire dans index.css ; la suppression des anciens rendus diminue les styles inline.

## Vérification finale

- `npm run build` : PASS (SSR, prerender et budgets).
- `npm run test:ma-stack` : 63/63 PASS.
- `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5198 npm run test:e2e:ma-stack -- --workers=1` : 15/15 PASS sur le build final.
- Les E2E bloquent les lectures Supabase dans les parcours principaux : aucun compte ni serveur disponible n’est nécessaire pour ajouter, inspecter, retirer et annuler. Un scénario contrôlé prouve qu’un changement de tarif catalogue met à jour l’affichage sans copier le prix dans la sélection persistée.
- FR/EN : 390, 820 et 1440 px ; Map réellement en 1/2/3 colonnes, pas seulement son bouton actif. Stack conséquent de 60 références à 320 px sans débordement horizontal.
- Persistance après refresh et nouvel environnement navigateur restauré ; snapshot invalide, ID absent, backup et getter bloqué couverts.
- Alternatives présentes, contexte intégré, navigation fiche et interaction clavier vérifiés. Captures conservées dans `/private/tmp/tooltrim-mon-stack-v1/`.
- `git diff --check` : PASS. Vérificateur strict : erreurs hors fichiers modifiés ; cliquet tokens : baseline historique désynchronisée, sans ajout de couleurs ou rayons littéraux au CSS existant.
- Limites : Chromium uniquement ; la fermeture/réouverture est simulée par une nouvelle session avec stockage restauré. Pas de validation Safari/WebKit ni de test d’usage réel.
